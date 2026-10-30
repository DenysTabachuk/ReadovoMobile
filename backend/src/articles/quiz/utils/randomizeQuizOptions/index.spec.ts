import { randomUUID } from 'node:crypto';
import { randomizeQuizOptions } from '.';

jest.mock('node:crypto', () => ({ randomUUID: jest.fn() }));

beforeEach(() => {
  jest
    .mocked(randomUUID)
    .mockReset()
    .mockReturnValueOnce('33333333-3333-4333-8333-333333333333')
    .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
    .mockReturnValueOnce('22222222-2222-4222-8222-222222222222');
});

it.each([
  {
    type: 'single_choice',
    correctOptionIds: ['q:correct'],
    expectedTexts: ['forest'],
  },
  {
    type: 'multiple_choice',
    correctOptionIds: ['q:correct', 'q:second'],
    expectedTexts: ['mountain', 'forest'],
  },
] as const)(
  'preserves $type grading while hiding identifiers and the original correct position',
  ({ type, correctOptionIds, expectedTexts }) => {
    const question = {
      id: 'q',
      type,
      prompt: 'Select words.',
      explanation: 'Private feedback.',
      options: [
        { id: 'q:correct', text: 'forest' },
        { id: 'q:wrong', text: 'sea' },
        { id: 'q:second', text: 'mountain' },
      ],
      correctOptionIds: [...correctOptionIds],
    };
    const original = structuredClone(question);
    const result = randomizeQuizOptions(question);

    expect(result.options.map((option) => option.text)).toEqual([
      'sea',
      'mountain',
      'forest',
    ]);
    expect(
      result.options
        .filter((option) => result.correctOptionIds.includes(option.id))
        .map((option) => option.text),
    ).toEqual(expectedTexts);
    expect(
      result.options.every(
        (option) =>
          !question.options.some(
            (originalOption) => originalOption.id === option.id,
          ),
      ),
    ).toBe(true);
    expect(result).toMatchObject({
      id: 'q',
      prompt: 'Select words.',
      explanation: 'Private feedback.',
    });
    expect(question).toEqual(original);
  },
);
