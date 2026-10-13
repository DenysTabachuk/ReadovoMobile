import { Injectable } from '@nestjs/common';

import { ArticleQuizResponseParser } from './article-quiz-response-parser';
import { isEnglishFunctionWord } from './vocabulary-policy';
import {
  type ArticleQuizQuestionOption,
  type ArticleSimplificationLevel,
  type ArticleVocabularyQuizQuestion,
  type ArticleVocabularyQuizQuestionFormat,
  type ArticleVocabularyQuizTermKind,
  type GenerateArticleVocabularyQuizResponse,
} from '../contracts/types';

const FORMAT_SEQUENCE: ArticleVocabularyQuizQuestionFormat[] = [
  'translation',
  'reverse_translation',
  'cloze',
];

@Injectable()
export class ArticleVocabularyQuizResponseParser {
  constructor(private readonly quizParser: ArticleQuizResponseParser) {}

  parse(params: {
    rawResponse: string;
    requestedLevel?: ArticleSimplificationLevel;
    sourceText: string;
    targetQuestionCount: number;
  }): GenerateArticleVocabularyQuizResponse & { diagnostics: string[] } {
    const fallbackLevel =
      params.requestedLevel ?? this.inferLevelFromText(params.sourceText);

    if (!params.rawResponse) {
      return {
        diagnostics: ['AI response was empty.'],
        questions: [],
        resolvedLevel: fallbackLevel,
      };
    }

    const parsedJson = this.quizParser.parseJsonObject<{
      questions?: unknown;
      resolvedLevel?: unknown;
    }>(params.rawResponse);

    if (!parsedJson.parsed) {
      return {
        diagnostics: parsedJson.diagnostics,
        questions: [],
        resolvedLevel: fallbackLevel,
      };
    }

    const parsed = parsedJson.parsed;
    const resolvedLevel =
      params.requestedLevel ??
      this.normalizeResolvedLevel(parsed.resolvedLevel) ??
      fallbackLevel;
    const normalizedQuestions = this.normalizeQuestions(parsed.questions, {
      sourceText: params.sourceText,
      targetQuestionCount: params.targetQuestionCount,
    });

    return {
      diagnostics: [
        ...parsedJson.diagnostics,
        typeof parsed.resolvedLevel === 'string'
          ? `AI resolvedLevel="${parsed.resolvedLevel}".`
          : 'AI resolvedLevel is missing or invalid.',
        ...normalizedQuestions.diagnostics,
      ],
      questions: normalizedQuestions.questions,
      resolvedLevel,
    };
  }

  getQuestionTarget(text: string): number {
    const wordCount = this.countWords(text);

    if (wordCount <= 1200) return 6;
    if (wordCount <= 5000) return 8;
    if (wordCount <= 10000) return 10;
    if (wordCount <= 25000) return 12;
    if (wordCount <= 50000) return 14;

    return 16;
  }

  private normalizeQuestions(
    rawQuestions: unknown,
    params: { sourceText: string; targetQuestionCount: number },
  ): {
    diagnostics: string[];
    questions: ArticleVocabularyQuizQuestion[];
  } {
    if (!Array.isArray(rawQuestions)) {
      return {
        diagnostics: ['`questions` is not an array.'],
        questions: [],
      };
    }

    const usedTerms = new Set<string>();
    const diagnostics: string[] = [];
    const validQuestions: ArticleVocabularyQuizQuestion[] = [];

    rawQuestions.forEach((question, index) => {
      const normalizedQuestion = this.normalizeQuestion(
        question,
        index,
        params.sourceText,
      );

      if (!normalizedQuestion) {
        diagnostics.push(`Question ${index + 1} was rejected.`);
        return;
      }

      if ('reason' in normalizedQuestion) {
        diagnostics.push(
          `Question ${index + 1} was rejected: ${normalizedQuestion.reason}`,
        );
        return;
      }

      const normalizedTerm = this.normalizeTextForSourceMatch(
        normalizedQuestion.question.term,
      );
      if (usedTerms.has(normalizedTerm)) {
        diagnostics.push(
          `Question ${index + 1} was rejected because term "${normalizedQuestion.question.term}" is duplicated.`,
        );
        return;
      }

      usedTerms.add(normalizedTerm);
      validQuestions.push(normalizedQuestion.question);
    });

    const questions = this.scheduleQuestionFormats(validQuestions);
    if (questions.length > params.targetQuestionCount) {
      diagnostics.push(
        `AI returned ${questions.length} valid questions, trimmed to ${params.targetQuestionCount}.`,
      );
    }

    return {
      diagnostics,
      questions: questions.slice(0, params.targetQuestionCount),
    };
  }

  private normalizeQuestion(
    rawQuestion: unknown,
    index: number,
    sourceText: string,
  ): { question: ArticleVocabularyQuizQuestion } | { reason: string } | null {
    if (!rawQuestion || typeof rawQuestion !== 'object') {
      return { reason: 'question is not an object' };
    }

    const candidate = rawQuestion as {
      correctOptionIds?: unknown;
      explanation?: unknown;
      format?: unknown;
      id?: unknown;
      options?: unknown;
      prompt?: unknown;
      sourceExcerpt?: unknown;
      term?: unknown;
      termKind?: unknown;
      translation?: unknown;
      type?: unknown;
    };
    const prompt = this.getStringValue(candidate.prompt);
    const term = this.getStringValue(candidate.term);
    const format = this.normalizeQuestionFormat(candidate.format);
    const termKind =
      this.normalizeTermKind(candidate.termKind) ??
      (term.includes(' ') ? 'phrase' : 'word');
    const sourceExcerpt = this.getStringValue(candidate.sourceExcerpt);
    const translation = this.getStringValue(candidate.translation);
    const type =
      candidate.type === 'single_choice' || candidate.type === undefined
        ? 'single_choice'
        : null;
    const options = this.quizParser.normalizeQuestionOptions(candidate.options);
    const correctOptionIds = this.quizParser.normalizeCorrectOptionIds(
      candidate.correctOptionIds,
      options,
      type,
    );

    if (!prompt) return { reason: 'prompt is empty' };
    if (!term) return { reason: 'term is empty' };
    if (!translation) return { reason: 'translation is empty' };
    if (!format) return { reason: 'format is missing or invalid' };
    if (!type) return { reason: 'type must be "single_choice"' };
    if (options.length !== 4) {
      return { reason: `expected exactly 4 options, got ${options.length}` };
    }
    if (correctOptionIds.length !== 1) {
      return {
        reason: `expected exactly 1 correct option id, got ${correctOptionIds.length}`,
      };
    }
    if (!this.isUsefulTerm(term)) {
      return { reason: `term "${term}" is not useful vocabulary for the quiz` };
    }
    if (this.hasRepeatedAdjacentToken(term)) {
      return { reason: `term "${term}" contains repeated adjacent words` };
    }
    if (this.isStopwordHeavyPhrase(term)) {
      return {
        reason: `term "${term}" looks like a sentence fragment, not a vocabulary item`,
      };
    }
    if (!this.isUsefulTranslation(term, translation)) {
      return {
        reason: `translation for term "${term}" is too broad or not dictionary-like`,
      };
    }
    if (!this.sourceTextContainsTerm(sourceText, term)) {
      return { reason: `term "${term}" is not present in the source text` };
    }
    if (this.hasDuplicateOptionTexts(options)) {
      return { reason: `options contain duplicate texts for term "${term}"` };
    }

    const id =
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id.trim()
        : `vq-${index + 1}`;
    const explanation =
      typeof candidate.explanation === 'string' && candidate.explanation.trim()
        ? candidate.explanation.trim()
        : undefined;

    return {
      question: {
        correctOptionIds,
        explanation,
        format,
        id,
        options,
        prompt,
        sourceExcerpt: sourceExcerpt || undefined,
        term,
        termKind,
        translation,
        type,
      },
    };
  }

  private scheduleQuestionFormats(
    questions: ArticleVocabularyQuizQuestion[],
  ): ArticleVocabularyQuizQuestion[] {
    return questions.map((question, index) =>
      this.createQuestionWithFormat(
        question,
        FORMAT_SEQUENCE[index % FORMAT_SEQUENCE.length] ?? 'translation',
        questions,
      ),
    );
  }

  private createQuestionWithFormat(
    question: ArticleVocabularyQuizQuestion,
    format: ArticleVocabularyQuizQuestionFormat,
    questions: ArticleVocabularyQuizQuestion[],
  ): ArticleVocabularyQuizQuestion {
    const correctOptionText =
      format === 'translation' ? question.translation : question.term;
    const distractorTexts = this.getDistractorTexts(
      question,
      questions,
      format,
      correctOptionText,
    );
    const options = [
      { id: `${question.id}:correct`, text: correctOptionText },
      ...distractorTexts.map((text, index) => ({
        id: `${question.id}:distractor:${index + 1}`,
        text,
      })),
    ];

    return {
      ...question,
      correctOptionIds: [`${question.id}:correct`],
      format,
      options,
      prompt: this.createQuestionPrompt(question, format),
      type: 'single_choice',
    };
  }

  private getDistractorTexts(
    question: ArticleVocabularyQuizQuestion,
    questions: ArticleVocabularyQuizQuestion[],
    format: ArticleVocabularyQuizQuestionFormat,
    correctOptionText: string,
  ): string[] {
    const normalizedCorrect = this.normalizeOptionText(correctOptionText);
    const seenTexts = new Set([normalizedCorrect]);
    const distractorTexts: string[] = [];
    const candidateTexts =
      format === 'translation'
        ? questions.map((candidate) => candidate.translation)
        : questions.map((candidate) => candidate.term);

    for (const candidateText of candidateTexts) {
      const normalizedCandidate = this.normalizeOptionText(candidateText);
      if (!candidateText || seenTexts.has(normalizedCandidate)) continue;

      seenTexts.add(normalizedCandidate);
      distractorTexts.push(candidateText);
      if (distractorTexts.length === 3) return distractorTexts;
    }

    for (const option of question.options) {
      const normalizedOption = this.normalizeOptionText(option.text);
      if (
        !option.text ||
        question.correctOptionIds.includes(option.id) ||
        seenTexts.has(normalizedOption)
      ) {
        continue;
      }

      seenTexts.add(normalizedOption);
      distractorTexts.push(option.text);
      if (distractorTexts.length === 3) break;
    }

    return distractorTexts;
  }

  private createQuestionPrompt(
    question: ArticleVocabularyQuizQuestion,
    format: ArticleVocabularyQuizQuestionFormat,
  ): string {
    if (format === 'translation') {
      return `Оберіть український переклад: ${question.term}`;
    }
    if (format === 'reverse_translation') {
      return `Оберіть англійський відповідник: ${question.translation}`;
    }

    return this.createClozePrompt(question);
  }

  private createClozePrompt(question: ArticleVocabularyQuizQuestion): string {
    const sourceExcerpt = question.sourceExcerpt?.trim();
    if (sourceExcerpt) {
      const escapedTerm = question.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const clozePrompt = sourceExcerpt.replace(
        new RegExp(`\\b${escapedTerm}\\b`, 'i'),
        '____',
      );
      if (clozePrompt !== sourceExcerpt) return clozePrompt;
    }

    return 'Complete the sentence with the correct English word or phrase: ____';
  }

  private normalizeQuestionFormat(
    format: unknown,
  ): ArticleVocabularyQuizQuestionFormat | null {
    if (
      format === 'translation' ||
      format === 'reverse_translation' ||
      format === 'definition' ||
      format === 'cloze' ||
      format === 'synonym'
    ) {
      return format;
    }

    return null;
  }

  private normalizeTermKind(
    termKind: unknown,
  ): ArticleVocabularyQuizTermKind | null {
    return termKind === 'word' || termKind === 'phrase' ? termKind : null;
  }

  private normalizeResolvedLevel(
    level: unknown,
  ): ArticleSimplificationLevel | null {
    if (typeof level !== 'string') return null;

    const normalizedLevel = level.trim().toUpperCase();
    return this.isSimplificationLevel(normalizedLevel) ? normalizedLevel : null;
  }

  private isUsefulTerm(term: string): boolean {
    const normalizedTerm = this.normalizeTextForSourceMatch(term);
    if (!normalizedTerm || normalizedTerm.length < 2) return false;

    const tokens = normalizedTerm.split(' ').filter(Boolean);
    return (
      tokens.length > 0 &&
      tokens.length <= 5 &&
      /[a-z]/.test(normalizedTerm) &&
      !tokens.every((token) => isEnglishFunctionWord(token))
    );
  }

  private hasRepeatedAdjacentToken(term: string): boolean {
    const tokens = this.normalizeTextForSourceMatch(term)
      .split(' ')
      .filter(Boolean);
    return tokens.some(
      (token, index) => index > 0 && token === tokens[index - 1],
    );
  }

  private isStopwordHeavyPhrase(term: string): boolean {
    const tokens = this.normalizeTextForSourceMatch(term)
      .split(' ')
      .filter(Boolean);
    return (
      tokens.length >= 4 && tokens.filter(isEnglishFunctionWord).length >= 2
    );
  }

  private isUsefulTranslation(term: string, translation: string): boolean {
    const normalizedTranslation = translation.trim();
    if (!normalizedTranslation || /[a-z]{3,}/i.test(normalizedTranslation)) {
      return false;
    }

    const termTokenCount = this.normalizeTextForSourceMatch(term)
      .split(' ')
      .filter(Boolean).length;
    const translationTokenCount = normalizedTranslation
      .split(/\s+/)
      .filter(Boolean).length;

    return translationTokenCount <= (termTokenCount <= 1 ? 4 : 6);
  }

  private hasDuplicateOptionTexts(
    options: ArticleQuizQuestionOption[],
  ): boolean {
    const normalizedOptions = options.map((option) =>
      option.text.trim().toLowerCase(),
    );
    return new Set(normalizedOptions).size !== normalizedOptions.length;
  }

  private sourceTextContainsTerm(sourceText: string, term: string): boolean {
    const normalizedSource = ` ${this.normalizeTextForSourceMatch(sourceText)} `;
    const normalizedTerm = this.normalizeTextForSourceMatch(term);
    return (
      Boolean(normalizedTerm) &&
      normalizedSource.includes(` ${normalizedTerm} `)
    );
  }

  private normalizeTextForSourceMatch(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]+/g, ' ')
      .replace(/[-\s]+/g, ' ')
      .trim();
  }

  private normalizeOptionText(text: string): string {
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private getStringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private countWords(text: string): number {
    return text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
  }

  private inferLevelFromText(text: string): ArticleSimplificationLevel {
    const words: string[] = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
    const sentences = text
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const wordCount = words.length;
    const averageWordLength =
      wordCount > 0
        ? words.reduce((total, word) => total + word.length, 0) / wordCount
        : 0;
    const averageSentenceLength =
      sentences.length > 0 ? wordCount / sentences.length : wordCount;

    if (averageSentenceLength <= 10 && averageWordLength <= 4.3) return 'A1';
    if (averageSentenceLength <= 13 && averageWordLength <= 4.8) return 'A2';
    if (averageSentenceLength <= 18 && averageWordLength <= 5.4) return 'B1';
    if (averageSentenceLength <= 24 && averageWordLength <= 6) return 'B2';

    return 'C1';
  }

  private isSimplificationLevel(
    level: string,
  ): level is ArticleSimplificationLevel {
    return ['A1', 'A2', 'B1', 'B2', 'C1'].includes(level);
  }
}
