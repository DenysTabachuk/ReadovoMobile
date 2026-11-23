import { Injectable } from '@nestjs/common';

import {
  type AiVocabularyQuizQuestion,
  type VocabularyQuizOutput,
} from '../contracts/ai-output.schemas';
import { type SemanticValidationResult } from '../contracts/semantic-validation';
import {
  type ArticleQuizQuestionOption,
  type ArticleSimplificationLevel,
  type ArticleVocabularyQuizQuestion,
  type ArticleVocabularyQuizQuestionFormat,
  type GenerateArticleVocabularyQuizResponse,
} from '../contracts/types';
import { ArticleQuizValidator } from './article-quiz.validator';
import { isEnglishFunctionWord } from './vocabulary-policy';

const FORMAT_SEQUENCE: ArticleVocabularyQuizQuestionFormat[] = [
  'translation',
  'reverse_translation',
  'cloze',
];

@Injectable()
export class ArticleVocabularyQuizValidator {
  constructor(private readonly quizValidator: ArticleQuizValidator) {}

  getQuestionTarget(text: string): number {
    const wordCount = this.countWords(text);

    if (wordCount <= 1200) return 6;
    if (wordCount <= 5000) return 8;
    if (wordCount <= 10000) return 10;
    if (wordCount <= 25000) return 12;
    if (wordCount <= 50000) return 14;
    return 16;
  }

  validate(
    output: VocabularyQuizOutput,
    params: {
      requestedLevel?: ArticleSimplificationLevel;
      sourceText: string;
      targetQuestionCount: number;
    },
  ): SemanticValidationResult<GenerateArticleVocabularyQuizResponse> {
    const issues: string[] = [];
    const usedTerms = new Set<string>();
    const questions = output.questions.flatMap((question, index) => {
      const result = this.validateQuestion(question, index, params.sourceText);
      if (!result.success) {
        issues.push(...result.issues);
        return [];
      }

      const normalizedTerm = this.normalizeText(result.data.term);
      if (usedTerms.has(normalizedTerm)) {
        issues.push(`Question ${index + 1}: term must not be duplicated.`);
        return [];
      }

      usedTerms.add(normalizedTerm);
      return [result.data];
    });

    if (new Set(questions.map(({ id }) => id)).size !== questions.length) {
      issues.push('Vocabulary question ids must be unique.');
    }

    if (questions.length === 0) {
      issues.push('At least one valid vocabulary question is required.');
    }
    if (questions.length > params.targetQuestionCount) {
      issues.push(
        `At most ${params.targetQuestionCount} vocabulary questions are allowed.`,
      );
    }
    if (issues.length > 0) return { issues, success: false };

    return {
      data: {
        questions: this.scheduleFormats(questions),
        resolvedLevel: params.requestedLevel ?? output.resolvedLevel,
      },
      issues: [],
      success: true,
    };
  }

  private validateQuestion(
    question: AiVocabularyQuizQuestion,
    index: number,
    sourceText: string,
  ): SemanticValidationResult<ArticleVocabularyQuizQuestion> {
    const label = `Question ${index + 1}`;
    const id = question.id.trim();
    const prompt = question.prompt.trim();
    const term = question.term.trim();
    const translation = question.translation.trim();
    const sourceExcerpt = question.sourceExcerpt?.trim() || undefined;
    const options = this.quizValidator.normalizeOptions(question.options);
    const correctOptionIds = this.quizValidator.normalizeCorrectOptionIds(
      question.correctOptionIds,
      options,
    );
    const issues = [
      ...(!id ? [`${label}: id must not be empty.`] : []),
      ...(!prompt ? [`${label}: prompt must not be empty.`] : []),
      ...(!term ? [`${label}: term must not be empty.`] : []),
      ...(!translation ? [`${label}: translation must not be empty.`] : []),
      ...(options.length !== 4
        ? [`${label}: exactly four non-empty options are required.`]
        : []),
      ...(new Set(options.map(({ id: optionId }) => optionId)).size !==
      options.length
        ? [`${label}: option ids must be unique.`]
        : []),
      ...(correctOptionIds.length !== 1
        ? [`${label}: exactly one correct option is required.`]
        : []),
      ...(!this.isUsefulTerm(term)
        ? [`${label}: term "${term}" is not useful vocabulary.`]
        : []),
      ...(this.hasRepeatedAdjacentToken(term)
        ? [`${label}: term "${term}" contains repeated adjacent words.`]
        : []),
      ...(question.termKind !== this.getTermKind(term)
        ? [`${label}: termKind does not match the target term.`]
        : []),
      ...(this.isStopwordHeavyPhrase(term)
        ? [`${label}: term "${term}" looks like a sentence fragment.`]
        : []),
      ...(!this.isUsefulTranslation(term, translation)
        ? [`${label}: translation must be concise Ukrainian dictionary text.`]
        : []),
      ...(!this.sourceContainsTerm(sourceText, term)
        ? [`${label}: term "${term}" is missing from the source text.`]
        : []),
      ...(sourceExcerpt &&
      !this.isValidSourceExcerpt(sourceText, sourceExcerpt, term)
        ? [
            `${label}: sourceExcerpt must be copied from the source text and contain the target term.`,
          ]
        : []),
      ...(this.hasDuplicateOptionTexts(options)
        ? [`${label}: option texts must be unique.`]
        : []),
    ];

    if (issues.length > 0) return { issues, success: false };

    return {
      data: {
        correctOptionIds,
        explanation: question.explanation?.trim() || undefined,
        format: question.format,
        id,
        options,
        prompt,
        sourceExcerpt,
        term,
        termKind: question.termKind,
        translation,
        type: 'single_choice',
      },
      issues: [],
      success: true,
    };
  }

  private scheduleFormats(
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
    const correctText =
      format === 'translation' ? question.translation : question.term;
    const distractors = this.getDistractors(
      question,
      questions,
      format,
      correctText,
    );

    return {
      ...question,
      correctOptionIds: [`${question.id}:correct`],
      format,
      options: [
        { id: `${question.id}:correct`, text: correctText },
        ...distractors.map((text, index) => ({
          id: `${question.id}:distractor:${index + 1}`,
          text,
        })),
      ],
      prompt: this.createPrompt(question, format),
    };
  }

  private getDistractors(
    question: ArticleVocabularyQuizQuestion,
    questions: ArticleVocabularyQuizQuestion[],
    format: ArticleVocabularyQuizQuestionFormat,
    correctText: string,
  ): string[] {
    const seen = new Set([this.normalizeOptionText(correctText)]);
    const distractors: string[] = [];
    const candidates = [
      ...(format === 'translation'
        ? questions.map(({ translation }) => translation)
        : questions.map(({ term }) => term)),
      ...question.options
        .filter(({ id }) => !question.correctOptionIds.includes(id))
        .map(({ text }) => text),
    ];

    for (const candidate of candidates) {
      const normalized = this.normalizeOptionText(candidate);
      if (!candidate || seen.has(normalized)) continue;

      seen.add(normalized);
      distractors.push(candidate);
      if (distractors.length === 3) break;
    }

    return distractors;
  }

  private createPrompt(
    question: ArticleVocabularyQuizQuestion,
    format: ArticleVocabularyQuizQuestionFormat,
  ): string {
    if (format === 'translation') {
      return `Оберіть український переклад: ${question.term}`;
    }
    if (format === 'reverse_translation') {
      return `Оберіть англійський відповідник: ${question.translation}`;
    }

    const sourceExcerpt = question.sourceExcerpt?.trim();
    if (sourceExcerpt) {
      const escapedTerm = question.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cloze = sourceExcerpt.replace(
        new RegExp(`\\b${escapedTerm}\\b`, 'i'),
        '____',
      );
      if (cloze !== sourceExcerpt) return cloze;
    }

    return 'Complete the sentence with the correct English word or phrase: ____';
  }

  private isUsefulTerm(term: string): boolean {
    const normalized = this.normalizeText(term);
    const tokens = normalized.split(' ').filter(Boolean);
    return (
      normalized.length >= 2 &&
      tokens.length > 0 &&
      tokens.length <= 5 &&
      /[a-z]/.test(normalized) &&
      !tokens.every(isEnglishFunctionWord)
    );
  }

  private hasRepeatedAdjacentToken(term: string): boolean {
    const tokens = this.normalizeText(term).split(' ').filter(Boolean);
    return tokens.some(
      (token, index) => index > 0 && token === tokens[index - 1],
    );
  }

  private isStopwordHeavyPhrase(term: string): boolean {
    const tokens = this.normalizeText(term).split(' ').filter(Boolean);
    return (
      tokens.length >= 4 && tokens.filter(isEnglishFunctionWord).length >= 2
    );
  }

  private isUsefulTranslation(term: string, translation: string): boolean {
    if (!translation || /[a-z]{3,}/i.test(translation)) return false;

    const termWords = this.normalizeText(term)
      .split(' ')
      .filter(Boolean).length;
    const translationWords = translation.split(/\s+/).filter(Boolean).length;
    return translationWords <= (termWords <= 1 ? 4 : 6);
  }

  private sourceContainsTerm(sourceText: string, term: string): boolean {
    const source = ` ${this.normalizeText(sourceText)} `;
    const normalizedTerm = this.normalizeText(term);
    return Boolean(normalizedTerm) && source.includes(` ${normalizedTerm} `);
  }

  private getTermKind(term: string): 'phrase' | 'word' {
    return term.trim().split(/\s+/).length > 1 ? 'phrase' : 'word';
  }

  private isValidSourceExcerpt(
    sourceText: string,
    sourceExcerpt: string,
    term: string,
  ): boolean {
    const normalizedSource = this.normalizeText(sourceText);
    const normalizedExcerpt = this.normalizeText(sourceExcerpt);

    return (
      Boolean(normalizedExcerpt) &&
      normalizedSource.includes(normalizedExcerpt) &&
      this.sourceContainsTerm(sourceExcerpt, term)
    );
  }

  private hasDuplicateOptionTexts(
    options: ArticleQuizQuestionOption[],
  ): boolean {
    const texts = options.map(({ text }) => this.normalizeOptionText(text));
    return new Set(texts).size !== texts.length;
  }

  private normalizeText(text: string): string {
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

  private countWords(text: string): number {
    return text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
  }
}
