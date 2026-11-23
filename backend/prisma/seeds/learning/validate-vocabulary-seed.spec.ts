import { OKTOBERFEST_VOCABULARY_SEED } from './oktoberfest-vocabulary';
import { validateVocabularySeed } from './validate-vocabulary-seed';

const sample = OKTOBERFEST_VOCABULARY_SEED;

it('validates all twenty words in one learning stage without mutating the sample', () => {
  const before = structuredClone(sample);
  const lesson = validateVocabularySeed(sample);
  expect(lesson.words).toHaveLength(20);
  const [learning, practice] = lesson.stages;
  expect(lesson.stages.map((stage) => stage.kind)).toEqual([
    'learn',
    'practice',
  ]);
  expect(learning.wordIds).toEqual(lesson.words.map((word) => word.id));
  expect(learning.exercises).toHaveLength(0);
  expect(practice.wordIds).toEqual(learning.wordIds);
  expect(practice.exercises).toHaveLength(20);
  expect(new Set(practice.exercises.map((question) => question.kind))).toEqual(
    new Set(['word_to_picture', 'audio_to_picture', 'sentence_gap']),
  );
  expect(sample).toEqual(before);
  expect(lesson).not.toBe(sample);
});

it('rejects duplicate word identities', () => {
  const input = structuredClone(sample);
  input.words.push(input.words[0]);
  expect(() => validateVocabularySeed(input)).toThrow('Duplicate word IDs');
});

it('requires both supported interface locales', () => {
  const input = structuredClone(sample);
  input.stages[0].translations = input.stages[0].translations.filter(
    (copy) => copy.locale !== 'uk',
  );
  expect(() => validateVocabularySeed(input)).toThrow('English and Ukrainian');
});

it('rejects a question whose correct word is missing from its options', () => {
  const input = structuredClone(sample);
  const question = input.stages[1].exercises[0];
  question.optionWordIds = question.optionWordIds.filter(
    (wordId) => wordId !== question.correctWordId,
  );
  expect(() => validateVocabularySeed(input)).toThrow(
    'Correct word is missing',
  );
});

it('rejects distractors outside the practice roster', () => {
  const input = structuredClone(sample);
  const stage = input.stages[1];
  const distractor = stage.exercises[0].optionWordIds[1];
  stage.wordIds = stage.wordIds.filter((wordId) => wordId !== distractor);
  expect(() => validateVocabularySeed(input)).toThrow(
    'outside the stage roster',
  );
});

it('rejects duplicate option and question IDs', () => {
  const input = structuredClone(sample);
  const [first, second] = input.stages[1].exercises;
  first.optionWordIds.push(first.correctWordId);
  expect(() => validateVocabularySeed(input)).toThrow(
    'Duplicate answer options',
  );
  first.optionWordIds.pop();
  second.id = first.id;
  expect(() => validateVocabularySeed(input)).toThrow('Duplicate exercise IDs');
});

it('rejects questions in learning stages and empty practice stages', () => {
  const input = structuredClone(sample);
  input.stages[0].exercises = [input.stages[1].exercises[0]];
  expect(() => validateVocabularySeed(input)).toThrow('Learning stages cannot');
  input.stages[0].exercises = [];
  input.stages[1].exercises = [];
  expect(() => validateVocabularySeed(input)).toThrow(
    'Practice stages require',
  );
});

it('rejects missing gap fields and unknown input fields', () => {
  expect(() =>
    validateVocabularySeed({ ...sample, publishedAt: new Date() }),
  ).toThrow();
  const invalidStage = {
    ...sample.stages[1],
    exercises: [
      {
        id: 'bad-gap',
        kind: 'sentence_gap',
        correctWordId: 'festival',
        optionWordIds: ['festival', 'tent'],
      },
    ],
  };
  expect(() =>
    validateVocabularySeed({ ...sample, stages: [invalidStage] }),
  ).toThrow();
});
