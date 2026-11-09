import { COMMON_THINGS_SEED } from './common-things';
import { validateVocabularySeed } from './validate';

it('validates the complete draft without mutating it and preserves the two learning blocks', () => {
  const before = structuredClone(COMMON_THINGS_SEED);
  const lesson = validateVocabularySeed(COMMON_THINGS_SEED);
  expect(lesson.words).toHaveLength(20);
  expect(lesson.stages).toHaveLength(6);
  expect(
    lesson.stages
      .filter((stage) => stage.kind === 'learn')
      .map((stage) => stage.wordIds.length),
  ).toEqual([10, 10]);
  expect(lesson.stages.map((stage) => stage.exercises.length)).toEqual([
    0, 10, 10, 10, 0, 20,
  ]);
  expect(
    new Set(lesson.stages[5].exercises.map((question) => question.kind)),
  ).toEqual(new Set(['word_to_picture', 'audio_to_picture', 'sentence_gap']));
  expect(COMMON_THINGS_SEED).toEqual(before);
  expect(lesson).not.toBe(COMMON_THINGS_SEED);
});

it('rejects duplicate word identities', () => {
  const input = structuredClone(COMMON_THINGS_SEED);
  input.words.push(input.words[0]);
  expect(() => validateVocabularySeed(input)).toThrow('Duplicate word IDs');
});

it('requires both supported interface locales', () => {
  const input = structuredClone(COMMON_THINGS_SEED);
  input.stages[0].translations = input.stages[0].translations.filter(
    (copy) => copy.locale !== 'uk',
  );
  expect(() => validateVocabularySeed(input)).toThrow('English and Ukrainian');
});

it('rejects a question whose correct word is missing from its options', () => {
  const input = structuredClone(COMMON_THINGS_SEED);
  input.stages[1].exercises[0].optionWordIds = ['book', 'pencil'];
  expect(() => validateVocabularySeed(input)).toThrow(
    'Correct word is missing',
  );
});

it('rejects distractors outside the current learning block', () => {
  const input = structuredClone(COMMON_THINGS_SEED);
  input.stages[1].exercises[0].optionWordIds = ['backpack', 'bed'];
  expect(() => validateVocabularySeed(input)).toThrow(
    'outside the stage roster',
  );
});

it('rejects duplicate option and question IDs', () => {
  const input = structuredClone(COMMON_THINGS_SEED);
  input.stages[1].exercises[0].optionWordIds = ['backpack', 'backpack'];
  expect(() => validateVocabularySeed(input)).toThrow(
    'Duplicate answer options',
  );
  input.stages[1].exercises[0].optionWordIds = ['backpack', 'book'];
  input.stages[1].exercises[1].id = input.stages[1].exercises[0].id;
  expect(() => validateVocabularySeed(input)).toThrow('Duplicate exercise IDs');
});

it('rejects questions in learning stages and empty practice stages', () => {
  const input = structuredClone(COMMON_THINGS_SEED);
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
    validateVocabularySeed({ ...COMMON_THINGS_SEED, publishedAt: new Date() }),
  ).toThrow();
  const invalidStage = {
    ...COMMON_THINGS_SEED.stages[3],
    exercises: [
      {
        id: 'bad-gap',
        kind: 'sentence_gap',
        correctWordId: 'book',
        optionWordIds: ['book', 'pencil'],
      },
    ],
  };
  expect(() =>
    validateVocabularySeed({ ...COMMON_THINGS_SEED, stages: [invalidStage] }),
  ).toThrow();
});
