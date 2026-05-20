import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import Groq from 'groq-sdk';

import { DictionaryRepository } from './dictionary.repository';
import {
  type CreateDictionaryWordRequest,
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryTestQuestionFormat,
  type DictionaryTestQuestion,
  type DictionaryWord,
  type QuizOptionsRequest,
  type SimilarWordsRequest,
  type SubmitDictionaryTestAnswerRequest,
  type UpdateDictionaryWordProgressRequest,
} from './types';
import { DictionaryEmbeddingService } from './dictionary-embedding.service';

const DEFAULT_DICTIONARY_TEST_LIMIT = 10;
const DICTIONARY_TEST_OPTION_COUNT = 4;
const DICTIONARY_TEST_DISTRACTOR_COUNT = DICTIONARY_TEST_OPTION_COUNT - 1;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_REQUEST_TIMEOUT_MS = 180000;
const MAX_DICTIONARY_TEST_COMPLETION_TOKENS = 6000;
export const REQUIRED_CORRECT_ANSWERS_TO_LEARN = 5;
const MAX_DICTIONARY_FRAGMENT_WORDS = 5;

type GeneratedDictionaryTestQuestion = {
  clozePrompt?: string;
  distractors: string[];
  format: DictionaryTestQuestionFormat;
};

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);

  constructor(
    private readonly dictionaryEmbeddingService: DictionaryEmbeddingService,
    private readonly dictionaryRepository: DictionaryRepository,
  ) {}

  async createWord(
    userId: string,
    request: CreateDictionaryWordRequest,
  ): Promise<DictionaryWord> {
    const word = request.word?.trim();
    const translation = request.translation?.trim();
    const context = request.context?.trim();

    if (!word) {
      throw new BadRequestException('Word is required.');
    }

    const wordCount = countWords(word);

    if (wordCount < 1 || wordCount > MAX_DICTIONARY_FRAGMENT_WORDS) {
      throw new BadRequestException(
        `Word or phrase must contain from 1 to ${MAX_DICTIONARY_FRAGMENT_WORDS} words.`,
      );
    }

    if (!translation) {
      throw new BadRequestException('Translation is required.');
    }

    if (!context) {
      throw new BadRequestException('Context is required.');
    }

    const existingWords = await this.dictionaryRepository.findAll(userId);
    const normalizedWord = this.normalizeWord(word);
    const duplicateWord = existingWords.find(
      (existingWord) =>
        this.normalizeWord(existingWord.word) === normalizedWord,
    );

    if (duplicateWord) {
      throw new BadRequestException(
        'Word or phrase already exists in dictionary.',
      );
    }

    const createdWord = await this.dictionaryRepository.create({
      context,
      createdAt: new Date().toISOString(),
      correctAnswersCount: 0,
      id: randomUUID(),
      progress: 'new',
      requiredCorrectAnswers: REQUIRED_CORRECT_ANSWERS_TO_LEARN,
      translation,
      userId,
      word,
    });

    if (!createdWord) {
      throw new BadRequestException(
        'Word or phrase already exists in dictionary.',
      );
    }

    return createdWord;
  }

  findAll(userId: string): Promise<DictionaryWord[]> {
    return this.dictionaryRepository.findAll(userId);
  }

  async deleteWord(userId: string, wordId: string): Promise<DictionaryWord> {
    const normalizedWordId = wordId?.trim();

    if (!normalizedWordId) {
      throw new BadRequestException('Word id is required.');
    }

    const deletedWord = await this.dictionaryRepository.deleteById(
      normalizedWordId,
      userId,
    );

    if (!deletedWord) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    return deletedWord;
  }

  generateEmbedding(text: string): Promise<number[]> {
    return this.dictionaryEmbeddingService.generateEmbedding(text);
  }

  async getSimilarWords(request: SimilarWordsRequest): Promise<string[]> {
    const wordList = await this.resolveWordList(request.wordList);

    return this.dictionaryEmbeddingService.getSimilarWords(
      request.word ?? '',
      wordList,
    );
  }

  async generateQuizOptions(request: QuizOptionsRequest): Promise<string[]> {
    const wordList = await this.resolveWordList(request.wordList);

    return this.dictionaryEmbeddingService.generateQuizOptions(
      request.correctWord ?? '',
      wordList,
    );
  }

  async createTest(
    userId: string,
    limit = DEFAULT_DICTIONARY_TEST_LIMIT,
  ): Promise<DictionaryTest> {
    const normalizedLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(DEFAULT_DICTIONARY_TEST_LIMIT, Math.floor(limit)))
      : DEFAULT_DICTIONARY_TEST_LIMIT;
    const words = await this.dictionaryRepository.findAll(userId);

    if (words.length === 0) {
      throw new BadRequestException(
        'At least 1 dictionary word is required to create a test.',
      );
    }

    const reviewCandidates =
      await this.dictionaryRepository.findReviewCandidates(
        userId,
        normalizedLimit,
      );

    if (reviewCandidates.length === 0) {
      throw new BadRequestException(
        'No dictionary words are available to create a test.',
      );
    }

    const questions = await this.createTestQuestionsWithAi(reviewCandidates);

    return { questions };
  }

  async submitTestAnswer(
    userId: string,
    request: SubmitDictionaryTestAnswerRequest,
  ): Promise<DictionaryTestAnswerResult> {
    const wordId = request.wordId?.trim();
    const selectedOptionId = request.selectedOptionId?.trim();

    if (!wordId) {
      throw new BadRequestException('Word id is required.');
    }

    if (!selectedOptionId) {
      throw new BadRequestException('Selected option id is required.');
    }

    const word = await this.dictionaryRepository.findById(wordId, userId);

    if (!word) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    const isCorrect = selectedOptionId === word.id;
    const nextReviewProgress = this.getNextReviewProgress(
      word.correctAnswersCount,
      word.progress,
      isCorrect,
    );
    const reviewedWord = await this.dictionaryRepository.updateReviewResult(
      word.id,
      userId,
      nextReviewProgress.progress,
      nextReviewProgress.correctAnswersCount,
      new Date().toISOString(),
    );

    if (!reviewedWord) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    return {
      correctOptionId: word.id,
      correctTranslation: word.translation,
      isCorrect,
      word: reviewedWord,
    };
  }

  async updateWordProgress(
    userId: string,
    wordId: string,
    request: UpdateDictionaryWordProgressRequest,
  ): Promise<DictionaryWord> {
    const progress = request.progress;

    if (progress !== 'in_progress') {
      throw new BadRequestException(
        'Only in_progress status can be set manually.',
      );
    }

    const word = await this.dictionaryRepository.findById(wordId, userId);

    if (!word) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    const updatedWord = await this.dictionaryRepository.updateProgress(
      word.id,
      userId,
      progress,
      Math.min(word.correctAnswersCount, REQUIRED_CORRECT_ANSWERS_TO_LEARN - 1),
    );

    if (!updatedWord) {
      throw new NotFoundException('Dictionary word was not found.');
    }

    return updatedWord;
  }

  private async resolveWordList(wordList?: string[]): Promise<string[]> {
    if (wordList?.length) {
      return wordList;
    }

    return [];
  }

  private async createTestQuestionsWithAi(
    words: DictionaryWord[],
  ): Promise<DictionaryTestQuestion[]> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.error('Groq key is missing for dictionary test generation.');
      throw new InternalServerErrorException(
        'Dictionary test generation service is not configured.',
      );
    }

    const prompt = this.createDictionaryTestPrompt(words);

    try {
      const client = new Groq({ apiKey });
      const rawResponse = await this.createGroqTextCompletion({
        client,
        maxCompletionTokens: MAX_DICTIONARY_TEST_COMPLETION_TOKENS,
        prompt,
        systemMessage:
          'You create varied English-Ukrainian vocabulary tests for language learners.',
      });
      const generatedQuestionsByWordId = this.parseDictionaryTestModelResponse(
        rawResponse,
        words,
      );

      return words.map((word) => {
        const generatedQuestion = generatedQuestionsByWordId.get(word.id);

        if (!generatedQuestion) {
          throw new BadGatewayException(
            'Dictionary test generation returned incomplete questions.',
          );
        }

        return this.createTestQuestionFromGeneratedQuestion(
          word,
          generatedQuestion,
        );
      });
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Groq error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Groq dictionary test request failed: model=${GROQ_MODEL}, reason="${errorMessage}"`,
        errorStack,
      );

      throw new BadGatewayException('Failed to generate dictionary test.');
    }
  }

  private createTestQuestionFromGeneratedQuestion(
    word: DictionaryWord,
    generatedQuestion: GeneratedDictionaryTestQuestion,
  ): DictionaryTestQuestion {
    const correctAnswerText = this.getCorrectAnswerText(
      word,
      generatedQuestion.format,
    );
    const options = this.shuffleWords([
      {
        id: word.id,
        text: correctAnswerText,
        translation: correctAnswerText,
      },
      ...generatedQuestion.distractors.map((distractor, index) => ({
        id: `${word.id}:distractor:${index + 1}`,
        text: distractor,
        translation: distractor,
      })),
    ]);

    return {
      format: generatedQuestion.format,
      options,
      prompt: this.createDictionaryTestQuestionPrompt(
        word,
        generatedQuestion,
      ),
      word: word.word,
      wordId: word.id,
    };
  }

  private createDictionaryTestPrompt(words: DictionaryWord[]): string {
    const input = words.map((word, index) => ({
      context: word.context,
      format: this.getDictionaryQuestionFormatForIndex(index),
      id: word.id,
      translation: word.translation,
      word: word.word,
    }));

    return `Generate a varied vocabulary test from the user's dictionary words.

Input is an array of user's dictionary words:
${JSON.stringify(input, null, 2)}

Rules:
- Create one test item for every input object.
- Each input object includes "format". Use exactly that format for that item:
  - "translation": learner sees the English "word" and chooses the Ukrainian translation.
  - "reverse_translation": learner sees the Ukrainian "translation" and chooses the English word or phrase.
  - "cloze": learner sees a short English sentence with "____" and chooses the missing English word or phrase.
- For "translation", the correct answer is ALWAYS the exact "translation" from the input.
- For "reverse_translation" and "cloze", the correct answer is ALWAYS the exact "word" from the input.
- Do not rewrite, normalize, improve, inflect, shorten, or replace the correct answer.
- Generate ONLY wrong answer options in "distractors"; never include the correct answer there.
- Each item must contain exactly 3 wrong distractors.
- For "translation", distractors must be Ukrainian.
- For "reverse_translation" and "cloze", distractors must be English.
- Distractors must be plausible and close by topic, style, part of speech, and length to the correct answer.
- Do not use distant, silly, or obviously irrelevant distractors.
- Do not use synonyms of the correct answer.
- Do not use duplicates, near-duplicates, or the correct answer itself.
- If the correct answer is one word, prefer one-word distractors.
- If the correct answer is a phrase, use short phrases of similar length.
- Use "context" only to understand the meaning of "word".
- For "cloze", create "clozePrompt" as a short English sentence using "____" where the exact word or phrase should be inserted.
- For "cloze", prefer adapting the provided context. If context is not useful, write a simple natural sentence.
- Return ONLY valid JSON with this schema:
{
  "questions": [
    {
      "wordId": string,
      "format": "translation" | "reverse_translation" | "cloze",
      "clozePrompt"?: string,
      "distractors": [string, string, string]
    }
  ]
}`;
  }

  private async createGroqTextCompletion(params: {
    client: Groq;
    maxCompletionTokens: number;
    prompt: string;
    systemMessage: string;
  }): Promise<string> {
    const completion = await params.client.chat.completions.create(
      {
        messages: [
          { content: params.systemMessage, role: 'system' },
          { content: params.prompt, role: 'user' },
        ],
        model: GROQ_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_completion_tokens: params.maxCompletionTokens,
      },
      {
        timeout: GROQ_REQUEST_TIMEOUT_MS,
      },
    );

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  private parseDictionaryTestModelResponse(
    rawResponse: string,
    words: DictionaryWord[],
  ): Map<string, GeneratedDictionaryTestQuestion> {
    if (!rawResponse) {
      throw new BadGatewayException('Dictionary test generation was empty.');
    }

    const parsed = this.parseJsonObject<{
      questions?: unknown;
    }>(rawResponse);

    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new BadGatewayException(
        'Dictionary test generation returned invalid JSON.',
      );
    }

    const wordsById = new Map(words.map((word) => [word.id, word]));
    const expectedFormatsByWordId = new Map(
      words.map((word, index) => [
        word.id,
        this.getDictionaryQuestionFormatForIndex(index),
      ]),
    );
    const generatedQuestionsByWordId =
      new Map<string, GeneratedDictionaryTestQuestion>();

    for (const rawQuestion of parsed.questions) {
      if (!rawQuestion || typeof rawQuestion !== 'object') {
        continue;
      }

      const candidate = rawQuestion as {
        clozePrompt?: unknown;
        distractors?: unknown;
        format?: unknown;
        wordId?: unknown;
      };
      const wordId = typeof candidate.wordId === 'string'
        ? candidate.wordId.trim()
        : '';
      const word = wordsById.get(wordId);
      const format =
        expectedFormatsByWordId.get(wordId) ??
        this.normalizeDictionaryQuestionFormat(candidate.format);

      if (!word || !format || !Array.isArray(candidate.distractors)) {
        continue;
      }

      const distractors = this.normalizeDistractors(
        candidate.distractors,
        this.getCorrectAnswerText(word, format),
      );
      const clozePrompt = typeof candidate.clozePrompt === 'string'
        ? candidate.clozePrompt.trim().replace(/\s+/g, ' ')
        : undefined;

      if (distractors.length === DICTIONARY_TEST_DISTRACTOR_COUNT) {
        generatedQuestionsByWordId.set(word.id, {
          clozePrompt,
          distractors,
          format,
        });
      }
    }

    if (generatedQuestionsByWordId.size !== words.length) {
      this.logger.warn(
        `Dictionary test AI returned ${generatedQuestionsByWordId.size} valid questions for ${words.length} words. Raw AI response: ${this.truncateForLog(rawResponse)}`,
      );
      throw new BadGatewayException(
        'Dictionary test generation returned incomplete questions.',
      );
    }

    return generatedQuestionsByWordId;
  }

  private getNextReviewProgress(
    currentCorrectAnswersCount: number,
    currentProgress: DictionaryWord['progress'],
    isCorrect: boolean,
  ): Pick<DictionaryWord, 'correctAnswersCount' | 'progress'> {
    if (!isCorrect) {
      const correctAnswersCount =
        currentProgress === 'learned'
          ? REQUIRED_CORRECT_ANSWERS_TO_LEARN - 1
          : currentCorrectAnswersCount;

      return {
        correctAnswersCount,
        progress: 'in_progress',
      };
    }

    const correctAnswersCount = Math.min(
      currentCorrectAnswersCount + 1,
      REQUIRED_CORRECT_ANSWERS_TO_LEARN,
    );

    return {
      correctAnswersCount,
      progress:
        correctAnswersCount >= REQUIRED_CORRECT_ANSWERS_TO_LEARN
          ? 'learned'
          : 'in_progress',
    };
  }

  private normalizeWord(word: string): string {
    return word.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private normalizeDictionaryQuestionFormat(
    value: unknown,
  ): DictionaryTestQuestionFormat | null {
    if (
      value === 'translation' ||
      value === 'reverse_translation' ||
      value === 'cloze'
    ) {
      return value;
    }

    return null;
  }

  private getDictionaryQuestionFormatForIndex(
    index: number,
  ): DictionaryTestQuestionFormat {
    const formats: DictionaryTestQuestionFormat[] = [
      'translation',
      'reverse_translation',
      'cloze',
    ];

    return formats[index % formats.length];
  }

  private getCorrectAnswerText(
    word: DictionaryWord,
    format: DictionaryTestQuestionFormat,
  ): string {
    return format === 'translation' ? word.translation : word.word;
  }

  private createDictionaryTestQuestionPrompt(
    word: DictionaryWord,
    generatedQuestion: GeneratedDictionaryTestQuestion,
  ): string {
    if (generatedQuestion.format === 'translation') {
      return `Оберіть український переклад: ${word.word}`;
    }

    if (generatedQuestion.format === 'reverse_translation') {
      return `Оберіть англійський відповідник: ${word.translation}`;
    }

    return generatedQuestion.clozePrompt?.includes('____')
      ? generatedQuestion.clozePrompt
      : this.createFallbackClozePrompt(word);
  }

  private createFallbackClozePrompt(word: DictionaryWord): string {
    const normalizedContext = word.context.trim().replace(/\s+/g, ' ');

    if (normalizedContext) {
      const escapedWord = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordPattern = new RegExp(`\\b${escapedWord}\\b`, 'i');
      const clozeContext = normalizedContext.replace(wordPattern, '____');

      if (clozeContext !== normalizedContext) {
        return clozeContext;
      }
    }

    return `Complete the phrase with the correct English word: ____`;
  }

  private normalizeDistractors(
    rawDistractors: unknown[],
    correctTranslation: string,
  ): string[] {
    const normalizedCorrectTranslation =
      this.normalizeTranslation(correctTranslation);
    const seenDistractors = new Set<string>();
    const distractors: string[] = [];

    for (const rawDistractor of rawDistractors) {
      if (typeof rawDistractor !== 'string') {
        continue;
      }

      const distractor = rawDistractor.trim().replace(/\s+/g, ' ');
      const normalizedDistractor = this.normalizeTranslation(distractor);

      if (
        !distractor ||
        normalizedDistractor === normalizedCorrectTranslation ||
        seenDistractors.has(normalizedDistractor)
      ) {
        continue;
      }

      seenDistractors.add(normalizedDistractor);
      distractors.push(distractor);

      if (distractors.length === DICTIONARY_TEST_DISTRACTOR_COUNT) {
        break;
      }
    }

    return distractors;
  }

  private normalizeTranslation(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private parseJsonObject<T>(rawResponse: string): T | null {
    const normalized = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      return JSON.parse(normalized) as T;
    } catch {
      const objectStartIndex = normalized.indexOf('{');
      const objectEndIndex = normalized.lastIndexOf('}');

      if (objectStartIndex < 0 || objectEndIndex <= objectStartIndex) {
        return null;
      }

      try {
        return JSON.parse(
          normalized.slice(objectStartIndex, objectEndIndex + 1),
        ) as T;
      } catch {
        return null;
      }
    }
  }

  private truncateForLog(value: string, maxLength = 1200): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength)}...`;
  }

  private shuffleWords<T>(words: T[]): T[] {
    return [...words].sort(() => Math.random() - 0.5);
  }
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
