import { Injectable } from '@nestjs/common';

import {
  ArticleContentProcessor,
  type SimplificationChunk,
} from './article-content.processor';
import {
  type ArticleBlock,
  type ArticleQuizSourceCoverage,
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type ArticleTextTransformationType,
  type ArticleVocabularyQuizQuestionFormat,
} from '../contracts/types';

const DEFAULT_TARGET_LENGTH: ArticleSimplificationTargetLength = 'short';
const VOCABULARY_QUIZ_FORMAT_SEQUENCE: ArticleVocabularyQuizQuestionFormat[] = [
  'translation',
  'reverse_translation',
  'cloze',
];

@Injectable()
export class ArticlePromptFactory {
  constructor(private readonly contentProcessor: ArticleContentProcessor) {}

  createChunkSimplificationPrompt(params: {
    chunk: SimplificationChunk;
    level: ArticleSimplificationLevel;
    sourceWordCount: number;
    transformationType: ArticleTextTransformationType;
    title: string;
  }): string {
    if (params.transformationType === 'adaptation') {
      const adaptationLengthRule = this.getAdaptationLengthRule(
        params.chunk.text,
      );

      return `Rewrite this chunk of a longer English Wikipedia article in simpler English for a learner.

Article title: ${params.title}
Chunk: ${params.chunk.index} of ${params.chunk.total}
Learner level: ${params.level}

Rules:
- Keep the same meaning, the same order of ideas, and the important supporting details.
- Do not summarize, compress, or intentionally shorten this chunk.
- ${adaptationLengthRule}
- Do not add facts.
- Keep related ideas together and do not cut a sentence in the middle.
- Use simple, natural English for level ${params.level}.
- If a difficult term is important, keep it and explain it with easier surrounding language.
- Preserve useful headings, lists, tables, and images when they help comprehension.
- ${this.getTransformationOutputRule('forbidden')}
- You may keep images and tables only when they help understand this adapted chunk.
- If you keep an image, copy its "src" exactly from the source block.
- If you keep a table, simplify wording but do not invent values.
- Do not generate questions for this chunk; set "questions" to null.

${this.formatSource(params.chunk.blocks, params.chunk.text)}`;
    }

    const summaryLengthRule = this.getSummaryLengthRule(
      params.chunk.text,
      params.sourceWordCount,
    );

    return `Summarize this chunk of a longer English Wikipedia article for an English learner.

Article title: ${params.title}
Chunk: ${params.chunk.index} of ${params.chunk.total}
Learner level: ${params.level}

Rules:
- Summarize and shorten this chunk; keep only the central explanation, key facts, and essential supporting details.
- The summary chunk must be clearly shorter than the source chunk.
- Preserve meaning and local context.
- Do not add facts.
- Do not cut a sentence in the middle.
- Keep related ideas together.
- Use simple, natural English for level ${params.level}.
- This is not a tiny note or a 5-sentence recap.
- Rewrite this chunk into a substantial, readable summary section with multiple complete sentences.
- ${summaryLengthRule}
- ${this.getTransformationOutputRule('forbidden')}
- You may keep images and tables only when they help understand this simplified chunk.
- If you keep an image, copy its "src" exactly from the source block.
- If you keep a table, keep only useful rows/cells from the source table and simplify labels if needed.
- Do not invent image URLs, table facts, or source values.
- Do not generate questions for this chunk; set "questions" to null.

${this.formatSource(params.chunk.blocks, params.chunk.text)}`;
  }

  createSimplificationPrompt(params: {
    level: ArticleSimplificationLevel;
    sourceBlocks?: ArticleBlock[];
    text: string;
    transformationType: ArticleTextTransformationType;
    title: string;
  }): string {
    if (params.transformationType === 'adaptation') {
      const adaptationLengthRule = this.getAdaptationLengthRule(params.text);

      return `You are helping to adapt English educational texts for language learners.

Rewrite the following English Wikipedia article for a user with level ${params.level}.

Rules:
- Preserve the full meaning, the sequence of ideas, and the important supporting details.
- Do not summarize, compress, or intentionally shorten the article.
- Do not turn it into a recap or a short overview.
- ${adaptationLengthRule}
- Do not add facts that are not in the original text.
- Use simple and natural English.
- Adapt vocabulary and grammar to level ${params.level}.
- For A1/A2: use short, common words and clear sentence structure.
- For B1: keep the meaning complete, but make syntax simpler and cleaner.
- For B2: keep nuance and detail, but improve readability.
- If a difficult word is important, keep it and explain it with easier surrounding language.
- Keep the text coherent and readable, not a list of notes.
- ${this.getTransformationOutputRule('forbidden')}
- Do not use "formula" blocks in adapted output.
- Keep headings, images, and tables when they help comprehension.
- If source blocks are provided, use them to decide which source tables and images are useful.
- If you keep an image, copy its "src" exactly from the source image block.
- If you keep a table, simplify labels if needed but do not invent values.
- Do not generate questions; set "questions" to null.

Title:
${params.title}

${this.formatSource(params.sourceBlocks, params.text)}`;
    }

    const questionRule = this.getQuestionCountRule('medium');
    const summaryLengthRule = this.getSummaryLengthRule(params.text);

    return `You are helping to create educational English summaries for language learners.

Summarize the following English Wikipedia article for a user with level ${params.level}.

Rules:
- Summarize and shorten the article; keep only the central explanation, the most important facts, and essential supporting details.
- The summary must be clearly shorter than the original article and must not be longer than an adapted version of the same article.
- Do not add facts that are not in the original text.
- Use simple and natural English.
- Adapt vocabulary and grammar to level ${params.level}.
- For A1/A2: use short sentences and common words.
- For B1: use moderately simple sentences.
- For B2: keep more details, but make the text clear.
- For C1: keep nuance and precision, but still improve readability.
- Avoid complex academic words where possible.
- If a difficult word is important, keep it but explain it simply.
- Make the text coherent, not just a list of sentences or bullet notes.
- This is not a micro-summary and not a 5-sentence overview.
- Keep enough detail so the reader can understand the topic, but remove repetition, side details, and nonessential examples.
- ${summaryLengthRule}
- ${this.getTransformationOutputRule('required')}
- Do not use "formula" blocks in adapted output.
- Keep headings/tables/images where they help comprehension.
- If source blocks are provided, use them to decide which source tables and images are useful.
- If you keep an image, copy its "src" exactly from the source image block.
- If you keep a table, keep only useful rows/cells from a source table and simplify labels if needed.
- Never invent image URLs or table values that are not supported by the source text.
- Generate comprehension questions for the summary text.
- Question count: ${questionRule}.
- Allowed question types:
  - "single_choice": exactly 1 correct option.
  - "multiple_choice": 2 or more correct options.
  - "true_false": exactly 2 options ("True", "False"), exactly 1 correct option.
- Questions must match learner level ${params.level}.
- Keep wording simple for A1/A2, moderate for B1, richer but clear for B2, and nuanced but natural for C1.
- Every question must be answerable only from adapted text.
- Set "explanation" to null when no explanation is needed.

Title:
${params.title}

${this.formatSource(params.sourceBlocks, params.text)}`;
  }

  createQuizPrompt(params: {
    level: ArticleSimplificationLevel;
    sourceCoverage?: ArticleQuizSourceCoverage;
    targetLength?: ArticleSimplificationTargetLength;
    text: string;
    title: string;
  }): string {
    const questionRule = this.getQuestionCountRule(
      params.targetLength ?? DEFAULT_TARGET_LENGTH,
    );
    const coverageRule =
      params.sourceCoverage === 'representative_excerpts'
        ? '- The source contains representative excerpts from a longer article. Cover different excerpts where possible, and use only facts explicitly present in them.'
        : '- The source contains the complete article text.';

    return `Generate a reading-comprehension quiz for the article below.

Rules:
- Language: English.
- Learner level: ${params.level}.
- Question count: ${questionRule}.
- Allowed question types:
  - "single_choice": exactly 1 correct option.
  - "multiple_choice": 2 or more correct options.
  - "true_false": exactly 2 options ("True", "False"), exactly 1 correct option.
- Questions must be answerable from the article text only.
- Do not invent facts.
${coverageRule}
- For A1/A2 use simpler vocabulary and shorter prompts.
- For B1 moderate complexity; for B2 richer but clear wording; for C1 allow more nuance while staying clear.
- Follow the attached strict output schema exactly.
- Set "explanation" to null when no explanation is needed.

Title:
${params.title}

${params.sourceCoverage === 'representative_excerpts' ? 'Representative excerpts' : 'Text'}:
${params.text}`;
  }

  createVocabularyQuizPrompt(params: {
    level?: ArticleSimplificationLevel;
    sourceCoverage?: ArticleQuizSourceCoverage;
    targetQuestionCount: number;
    text: string;
    title: string;
  }): string {
    const learnerLevelRule = params.level
      ? `- Learner level is fixed at ${params.level}. Set "resolvedLevel" to "${params.level}".`
      : '- If learner level is not provided, estimate it and set "resolvedLevel" to one of "A1", "A2", "B1", "B2", "C1".';
    const coverageRule =
      params.sourceCoverage === 'representative_excerpts'
        ? '- The source contains representative excerpts from a longer article. Select terms across different excerpts where possible.'
        : '- The source contains the complete article text.';

    return `Generate a vocabulary quiz from the article below.

Rules:
- Focus on vocabulary that is important for understanding the article's topic, process, or main ideas.
- Select target terms only from the source text. Each target term must appear verbatim in the text.
- Prefer meaningful topic words and short useful phrases or phrasal expressions.
- Do not select articles, pronouns, prepositions, auxiliary verbs, isolated numbers, obvious function words, or proper names unless a name is essential to understanding the topic.
${coverageRule}
- Allowed target terms: one word or one short phrase of up to 5 words.
${learnerLevelRule}
- Respect learner level when choosing target terms. For lower levels, prefer simpler but still meaningful vocabulary from the text.
- Generate exactly ${params.targetQuestionCount} questions when the text contains enough useful vocabulary.
- Return at least 5 questions whenever the text has 5 useful words or phrases worth learning.
- Use fewer than 5 only when the text genuinely does not contain enough useful vocabulary. Never exceed ${params.targetQuestionCount} questions.
- Each question must test exactly one target term.
- Include "translation" for every question: the best general Ukrainian translation of "term" for saving to a learner dictionary.
- Use only "single_choice" questions with exactly 4 options and exactly 1 correct option.
- Use this exact format sequence for the returned questions, then repeat it if more questions are needed: ${VOCABULARY_QUIZ_FORMAT_SEQUENCE.map((format) => `"${format}"`).join(', ')}.
- Question 1 must use "translation", question 2 "reverse_translation", question 3 "cloze", question 4 "translation", and so on.
- Allowed formats:
  - "translation": choose the best Ukrainian translation of the target term.
  - "reverse_translation": choose the English target term that matches a Ukrainian translation prompt.
  - "cloze": complete a sentence from the text or a very similar context with the correct term.
- For "translation", the correct option text must be the Ukrainian translation.
- For "reverse_translation" and "cloze", the correct option text must be the exact target term from the source text.
- Wrong options must be plausible, not silly.
- Do not invent target terms that are missing from the text. Only distractors may be invented.
- For "cloze", hide the term with "____".
- Keep prompts concise.
- Keep option texts short where possible.
- "sourceExcerpt" should be a short excerpt from the source text that contains the term, ideally no more than 12 words.
- Follow the attached strict output schema exactly.
- Set "sourceExcerpt" or "explanation" to null when no legitimate value exists.

Title:
${params.title}

${params.sourceCoverage === 'representative_excerpts' ? 'Representative excerpts' : 'Text'}:
${params.text}`;
  }

  private getSummaryLengthRule(
    sourceText: string,
    wholeArticleWordCount = this.contentProcessor.countWords(sourceText),
  ): string {
    const sourceWordCount = this.contentProcessor.countWords(sourceText);
    const maxPercent = this.getSummaryMaxPercent(wholeArticleWordCount);
    const maxSummaryWords = Math.max(
      1,
      Math.ceil(sourceWordCount * maxPercent),
    );
    const percentLabel = Math.round(maxPercent * 100);

    return `Keep the summary shorter than the source. Hard maximum: no more than ${maxSummaryWords} words (${percentLabel}% of this source text, based on the full article size).`;
  }

  private getTransformationOutputRule(
    questionPolicy: 'forbidden' | 'required',
  ): string {
    const questionRule =
      questionPolicy === 'required'
        ? 'Return comprehension questions in "questions".'
        : 'Set "questions" to null.';

    return [
      'Follow the attached strict output schema exactly.',
      'Use only heading, paragraph, list, table, and image blocks; never return formula blocks.',
      'Set nullable formatting, image, and question fields to null when they do not apply.',
      questionRule,
    ].join(' ');
  }

  private formatSource(
    blocks: ArticleBlock[] | undefined,
    text: string,
  ): string {
    if (blocks?.length) {
      return `Source blocks:\n${this.contentProcessor.formatArticleBlocksForPrompt(blocks)}`;
    }

    return `Source text:\n${text}`;
  }

  private getSummaryMaxPercent(wordCount: number): number {
    if (wordCount <= 2000) {
      return 0.6;
    }

    if (wordCount <= 10000) {
      return 0.35;
    }

    if (wordCount <= 25000) {
      return 0.25;
    }

    return 0.15;
  }

  private getAdaptationLengthRule(sourceText: string): string {
    const wordCount = this.contentProcessor.countWords(sourceText);

    if (wordCount <= 220) {
      return 'Keep all source information that is useful for understanding. Simplify wording and sentence structure, but do not remove facts, examples, explanations, or context just to make the text shorter.';
    }

    if (wordCount <= 900) {
      return 'Keep every major point and the supporting details. The adapted text may use simpler words and shorter sentences, but it must not become shorter by dropping sections, examples, dates, names, causes, effects, or explanations.';
    }

    return 'For long articles, preserve all major sections and supporting details. Do not compress the article into an overview. Do not drop paragraphs because the article is long. Split complex ideas into simpler sentences instead of deleting them.';
  }

  private getQuestionCountRule(
    targetLength: ArticleSimplificationTargetLength,
  ): string {
    if (targetLength === 'short') return 'exactly 3 questions';
    if (targetLength === 'medium') return '4 to 5 questions';
    return 'at least 6 questions';
  }

  private countWords(text: string): number {
    return text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
  }
}
