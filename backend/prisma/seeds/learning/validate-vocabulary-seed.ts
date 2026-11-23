import { vocabularySeedSchema } from './vocabulary-seed.schema';
import type { VocabularySeedContent } from './vocabulary-seed.types';

const REQUIRED_INTERFACE_LOCALES = ['en', 'uk'] as const;

/**
 * Validates test seed structure and cross-row references before any writes.
 * @param input - Untrusted vocabulary content; arrays define display order.
 * @returns Parsed content with trimmed copy; throws for invalid structure, locales,
 * duplicate IDs, missing words, invalid rosters or incomplete questions. Does not mutate input.
 * @example
 * validateVocabularySeed({ words: [] }); // Throws before reaching the database.
 */
export function validateVocabularySeed(input: unknown): VocabularySeedContent {
  const lesson = vocabularySeedSchema.parse(input);
  const wordIds = new Set(lesson.words.map((word) => word.id));
  if (wordIds.size !== lesson.words.length)
    throw new Error('Duplicate word IDs');
  const stageIds = new Set(lesson.stages.map((stage) => stage.id));
  if (stageIds.size !== lesson.stages.length)
    throw new Error('Duplicate stage IDs');
  const exerciseIds = new Set<string>();
  const rosterWordIds = new Set<string>();

  for (const owner of lesson.stages) {
    const locales = new Set(owner.translations.map((copy) => copy.locale));
    if (locales.size !== owner.translations.length)
      throw new Error('Duplicate translation locales');
    if (REQUIRED_INTERFACE_LOCALES.some((locale) => !locales.has(locale))) {
      throw new Error('English and Ukrainian interface copy are required');
    }
  }
  for (const stage of lesson.stages) {
    const roster = new Set(stage.wordIds);
    if (roster.size !== stage.wordIds.length)
      throw new Error('Duplicate stage words');
    for (const wordId of roster) {
      if (!wordIds.has(wordId))
        throw new Error('Stage references an unknown word');
      rosterWordIds.add(wordId);
    }
    if (stage.kind === 'learn' && stage.exercises.length > 0)
      throw new Error('Learning stages cannot contain questions');
    if (stage.kind === 'practice' && stage.exercises.length === 0)
      throw new Error('Practice stages require questions');
    for (const exercise of stage.exercises) {
      if (exerciseIds.has(exercise.id))
        throw new Error('Duplicate exercise IDs');
      exerciseIds.add(exercise.id);
      const options = new Set(exercise.optionWordIds);
      if (options.size !== exercise.optionWordIds.length)
        throw new Error('Duplicate answer options');
      if (!options.has(exercise.correctWordId))
        throw new Error('Correct word is missing from answer options');
      for (const wordId of options) {
        if (!roster.has(wordId))
          throw new Error('Answer option is outside the stage roster');
      }
      if (
        exercise.kind === 'sentence_gap' &&
        !(exercise.sentenceBefore + exercise.sentenceAfter).trim()
      ) {
        throw new Error('Sentence gap requires surrounding text');
      }
    }
  }
  if (rosterWordIds.size !== wordIds.size)
    throw new Error('Every word must belong to a stage');
  return lesson;
}
