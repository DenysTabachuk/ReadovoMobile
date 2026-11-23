import { z } from 'zod';
import { VocabularyStageKind } from '../../../src/generated/prisma/enums';

const text = z.string().trim().min(1);
const contentId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const MIN_ANSWER_OPTIONS = 2;
const translation = z
  .object({
    locale: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/),
    title: text,
    description: text,
  })
  .strict();
const question = {
  id: contentId,
  correctWordId: contentId,
  optionWordIds: z.array(contentId).min(MIN_ANSWER_OPTIONS),
};

export const vocabularySeedSchema = z
  .object({
    words: z
      .array(
        z
          .object({
            id: contentId,
            word: text,
            transcription: text,
            translationUk: text,
            example: text,
            exampleTranslationUk: text,
            imageKey: z
              .string()
              .regex(/^[a-z0-9][a-z0-9/_-]*\.(?:svg|png|webp|jpg)$/),
            imageSourceUrl: z.url().startsWith('https://'),
            imageLicense: text,
            imageAttribution: text,
          })
          .strict(),
      )
      .min(1),
    stages: z
      .array(
        z
          .object({
            id: contentId,
            kind: z.enum(VocabularyStageKind),
            translations: z.array(translation).min(1),
            wordIds: z.array(contentId).min(1),
            exercises: z.array(
              z.discriminatedUnion('kind', [
                z
                  .object({ ...question, kind: z.literal('word_to_picture') })
                  .strict(),
                z
                  .object({ ...question, kind: z.literal('audio_to_picture') })
                  .strict(),
                z
                  .object({
                    ...question,
                    kind: z.literal('sentence_gap'),
                    sentenceBefore: z.string(),
                    sentenceAfter: z.string(),
                    sentenceTranslationUk: text,
                  })
                  .strict(),
              ]),
            ),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
