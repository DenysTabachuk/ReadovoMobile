import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { useVocabularyPractice } from '.';
import {
  createVocabularyPractice,
  createVocabularyFeedback,
} from '../../../../testing/practiceFixtures';

let root: Root;
let practice: ReturnType<typeof useVocabularyPractice>;
const questions = createVocabularyPractice().questions;
function Probe() {
  practice = useVocabularyPractice(questions);
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

it('requires a valid selection and server feedback before advancing', async () => {
  await act(async () => {
    practice.selectOption('exercise-1', 'unknown');
    practice.advance('exercise-1');
  });
  expect(practice.selectedOptionId).toBeNull();
  expect(practice.answers).toEqual([]);
  await act(async () => practice.selectOption('exercise-1', 'word-1'));
  await act(async () => practice.advance('exercise-1'));
  expect(practice.questionIndex).toBe(0);
});
it('records remote feedback once, locks checked choices and scores the first attempt', async () => {
  await act(async () => practice.selectOption('exercise-1', 'word-2'));
  const feedback = createVocabularyFeedback(0, 'word-2');
  await act(async () => {
    practice.recordAnswer(feedback);
    practice.recordAnswer(feedback);
    practice.selectOption('exercise-1', 'word-1');
  });
  expect(practice.answers).toHaveLength(1);
  expect(practice.correctCount).toBe(0);
  expect(practice.answer).toEqual(feedback);
  expect(practice.selectedOptionId).toBe('word-2');
});
it('ignores stale question events and feedback for a different submitted choice', async () => {
  await act(async () => practice.selectOption('exercise-1', 'word-1'));
  await act(async () =>
    practice.recordAnswer(createVocabularyFeedback(0, 'word-2')),
  );
  expect(practice.answers).toEqual([]);
  await act(async () =>
    practice.recordAnswer(createVocabularyFeedback(0, 'word-1')),
  );
  await act(async () => practice.advance('exercise-1'));
  await act(async () => {
    practice.recordAnswer(createVocabularyFeedback(0, 'word-1'));
    practice.selectOption('exercise-1', 'word-2');
    practice.advance('exercise-1');
  });
  expect(practice.question?.id).toBe('exercise-2');
  expect(practice.selectedOptionId).toBeNull();
  expect(practice.answers).toHaveLength(1);
});
it('finishes all formats and restarts with no feedback or score', async () => {
  for (let index = 0; index < 3; index += 1) {
    const id = `exercise-${index + 1}`;
    const option = `word-${index + 1}`;
    await act(async () => practice.selectOption(id, option));
    await act(async () =>
      practice.recordAnswer(createVocabularyFeedback(index, option)),
    );
    await act(async () => practice.advance(id));
  }
  expect(practice.isComplete).toBe(true);
  expect(practice.correctCount).toBe(3);
  await act(async () => practice.restart());
  expect(practice.questionIndex).toBe(0);
  expect(practice.answers).toEqual([]);
  expect(practice.selectedOptionId).toBeNull();
});
