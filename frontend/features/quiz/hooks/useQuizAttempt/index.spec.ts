import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { useQuizAttempt } from '.';

type Feedback = { isCorrect: boolean; explanation: string };
type Attempt = ReturnType<typeof useQuizAttempt<Feedback>>;
type CheckSelection = Parameters<Attempt['submitAnswer']>[0];

let root: Root;
let attempt: Attempt;

function Probe() {
  attempt = useQuizAttempt<Feedback>();
  return null;
}

beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
beforeEach(async () => {
  root = createRoot();
  await act(async () => root.render(createElement(Probe)));
});
afterEach(async () => {
  await act(async () => root.unmount());
});

it('keeps a failed selection for retry and ignores repeated taps while checking', async () => {
  const checkSelection = jest.fn<void, Parameters<CheckSelection>>();
  await act(async () => {
    attempt.selectOption('rain');
  });
  await act(async () => {
    attempt.submitAnswer(checkSelection);
    attempt.submitAnswer(checkSelection);
    attempt.selectOption('sun');
  });
  expect(checkSelection).toHaveBeenCalledTimes(1);
  expect(attempt.isSubmitting).toBe(true);
  expect(attempt.selectedOptionIds).toEqual(['rain']);

  await act(async () => checkSelection.mock.calls[0][1].onSettled());
  expect(attempt.isSubmitting).toBe(false);
  expect(attempt.answer).toBeNull();
  await act(async () => attempt.submitAnswer(checkSelection));
  const [selection, callbacks] = checkSelection.mock.calls[1];
  expect(selection).toEqual(['rain']);

  const feedback = { isCorrect: true, explanation: 'It was raining.' };
  await act(async () => {
    callbacks.onSuccess(feedback);
    callbacks.onSuccess(feedback);
    callbacks.onSettled();
  });
  expect(attempt.answer).toEqual(feedback);
  expect(attempt.correctCount).toBe(1);

  await act(async () => {
    attempt.advance();
    attempt.advance();
  });
  expect(attempt.questionIndex).toBe(1);
  expect(attempt.selectedOptionIds).toEqual([]);
  expect(attempt.answer).toBeNull();
  expect(attempt.correctCount).toBe(1);

  await act(async () => attempt.restart());
  expect(attempt.questionIndex).toBe(0);
  expect(attempt.correctCount).toBe(0);
});

it('toggles multiple selections and replaces the choice in single-selection mode', async () => {
  await act(async () => {
    attempt.selectOption('a', true);
    attempt.selectOption('b', true);
    attempt.selectOption('a', true);
  });
  expect(attempt.selectedOptionIds).toEqual(['b']);

  await act(async () => {
    attempt.selectOption('a');
    attempt.selectOption('c');
  });
  expect(attempt.selectedOptionIds).toEqual(['c']);
});
