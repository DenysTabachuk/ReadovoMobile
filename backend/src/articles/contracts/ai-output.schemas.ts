import { z } from 'zod';

export const AI_SCHEMA_NAMES = {
  articleTransformation: 'article_transformation_v1',
  readingQuiz: 'article_reading_quiz_v1',
  vocabularyQuiz: 'article_vocabulary_quiz_v1',
} as const;

const NullableBooleanSchema = z.boolean().nullable();
const NullableStringSchema = z.string().nullable();

export const AiInlineNodeSchema = z.union([
  z
    .object({
      bold: NullableBooleanSchema,
      italic: NullableBooleanSchema,
      text: z.string(),
      type: z.literal('text'),
    })
    .strict(),
  z
    .object({
      bold: NullableBooleanSchema,
      italic: NullableBooleanSchema,
      text: z.string(),
      type: z.literal('word'),
    })
    .strict(),
]);

const AiTableCellSchema = z
  .object({
    header: NullableBooleanSchema,
    text: z.string(),
  })
  .strict();

export const AiArticleBlockSchema = z.union([
  z
    .object({
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      text: z.string(),
      type: z.literal('heading'),
    })
    .strict(),
  z
    .object({
      children: z.array(AiInlineNodeSchema),
      type: z.literal('paragraph'),
    })
    .strict(),
  z
    .object({
      items: z.array(z.array(AiInlineNodeSchema)),
      ordered: z.boolean(),
      type: z.literal('list'),
    })
    .strict(),
  z
    .object({
      rows: z.array(z.array(AiTableCellSchema)),
      type: z.literal('table'),
    })
    .strict(),
  z
    .object({
      alt: NullableStringSchema,
      caption: NullableStringSchema,
      src: z.string(),
      type: z.literal('image'),
    })
    .strict(),
]);

const AiQuestionOptionSchema = z
  .object({
    id: z.string(),
    text: z.string(),
  })
  .strict();

export const AiQuizQuestionSchema = z
  .object({
    correctOptionIds: z.array(z.string()),
    explanation: NullableStringSchema,
    id: z.string(),
    options: z.array(AiQuestionOptionSchema),
    prompt: z.string(),
    type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
  })
  .strict();

export const ArticleTransformationOutputSchema = z
  .object({
    adaptedBlocks: z.array(AiArticleBlockSchema),
    questions: z.array(AiQuizQuestionSchema).nullable(),
  })
  .strict();

export const ReadingQuizOutputSchema = z
  .object({
    questions: z.array(AiQuizQuestionSchema),
  })
  .strict();

export const AiVocabularyQuizQuestionSchema = z
  .object({
    correctOptionIds: z.array(z.string()),
    explanation: NullableStringSchema,
    format: z.enum(['translation', 'reverse_translation', 'cloze']),
    id: z.string(),
    options: z.array(AiQuestionOptionSchema),
    prompt: z.string(),
    sourceExcerpt: NullableStringSchema,
    term: z.string(),
    termKind: z.enum(['word', 'phrase']),
    translation: z.string(),
    type: z.literal('single_choice'),
  })
  .strict();

export const VocabularyQuizOutputSchema = z
  .object({
    questions: z.array(AiVocabularyQuizQuestionSchema),
    resolvedLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  })
  .strict();

export type AiArticleBlock = z.infer<typeof AiArticleBlockSchema>;
export type AiQuizQuestion = z.infer<typeof AiQuizQuestionSchema>;
export type ArticleTransformationOutput = z.infer<
  typeof ArticleTransformationOutputSchema
>;
export type ReadingQuizOutput = z.infer<typeof ReadingQuizOutputSchema>;
export type AiVocabularyQuizQuestion = z.infer<
  typeof AiVocabularyQuizQuestionSchema
>;
export type VocabularyQuizOutput = z.infer<typeof VocabularyQuizOutputSchema>;
