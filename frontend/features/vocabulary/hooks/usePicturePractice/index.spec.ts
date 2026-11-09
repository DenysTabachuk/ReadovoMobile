import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { usePicturePractice } from '.';

jest.mock('../../assets/backpack.svg', () => 1);
jest.mock('../../assets/book.svg', () => 2);
jest.mock('../../assets/pencil.svg', () => 3);

let root: Root;
let practice: ReturnType<typeof usePicturePractice>;

function Probe() {
  practice = usePicturePractice();
  return null;
}

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(async () => {
  root = createRoot();
  await act(async () => root.render(createElement(Probe)));
});
afterEach(async () => {
  await act(async () => root.unmount());
});

it('requires a valid selection before checking and an answer before advancing', async () => {
  await act(async () => {
    practice.selectOption('picture-backpack', 'unknown');
    practice.checkAnswer('picture-backpack');
    practice.advance('picture-backpack');
  });
  expect(practice.question?.id).toBe('picture-backpack');
  expect(practice.selectedOptionId).toBeNull();
  expect(practice.answers).toEqual([]);
});

it('records one answer and prevents changing it or counting it twice', async () => {
  await act(async () => practice.selectOption('picture-backpack', 'book'));
  await act(async () => {
    practice.checkAnswer('picture-backpack');
    practice.checkAnswer('picture-backpack');
    practice.selectOption('picture-backpack', 'backpack');
  });
  expect(practice.answers).toHaveLength(1);
  expect(practice.answer?.selectedOptionId).toBe('book');
  expect(practice.answer?.isCorrect).toBe(false);
  expect(practice.correctCount).toBe(0);
});

it('ignores stale selection, check and advance events from a previous question', async () => {
  await act(async () => practice.selectOption('picture-backpack', 'backpack'));
  await act(async () => practice.checkAnswer('picture-backpack'));
  await act(async () => {
    practice.advance('picture-backpack');
    practice.advance('picture-backpack');
    practice.selectOption('picture-backpack', 'book');
    practice.checkAnswer('picture-backpack');
  });
  expect(practice.question?.id).toBe('picture-book');
  expect(practice.selectedOptionId).toBeNull();
  expect(practice.answers).toHaveLength(1);
});

it('finishes only after the last checked answer is advanced and reports the first-attempt score', async () => {
  for (const [questionId, optionId] of [
    ['picture-backpack', 'book'],
    ['picture-book', 'book'],
    ['picture-pencil', 'pencil'],
  ] as const) {
    await act(async () => practice.selectOption(questionId, optionId));
    await act(async () => practice.checkAnswer(questionId));
    expect(practice.isComplete).toBe(false);
    await act(async () => practice.advance(questionId));
  }
  expect(practice.isComplete).toBe(true);
  expect(practice.question).toBeUndefined();
  expect(practice.correctCount).toBe(2);
  expect(practice.total).toBe(3);
  expect(
    practice.answers
      .filter((answer) => !answer.isCorrect)
      .map((answer) => answer.word.id),
  ).toEqual(['backpack']);
});

it('starts a fresh attempt without carrying over a previous answer or selection', async () => {
  await act(async () => practice.selectOption('picture-backpack', 'backpack'));
  await act(async () => practice.checkAnswer('picture-backpack'));
  await act(async () => practice.advance('picture-backpack'));
  await act(async () => practice.restart());
  expect(practice.question?.id).toBe('picture-backpack');
  expect(practice.selectedOptionId).toBeNull();
  expect(practice.answers).toEqual([]);
  expect(practice.correctCount).toBe(0);
});
