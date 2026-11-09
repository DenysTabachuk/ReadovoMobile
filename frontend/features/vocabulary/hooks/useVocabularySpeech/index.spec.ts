import { act, createElement, useEffect } from 'react';
import { createRoot, type Root } from 'test-renderer';
import * as Speech from 'expo-speech';
import { useVocabularySpeech } from '.';

type ProbeProps = { cardId: string };

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => (() => void) | void) =>
    useEffect(callback, [callback]),
}));
jest.mock('expo-speech', () => ({
  stop: jest.fn().mockResolvedValue(undefined),
  speak: jest.fn(),
}));

let root: Root;
let speech: ReturnType<typeof useVocabularySpeech>;

function Probe({ cardId }: ProbeProps) {
  speech = useVocabularySpeech(cardId);
  return null;
}

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(async () => {
  jest.clearAllMocks();
  jest.mocked(Speech.stop).mockResolvedValue(undefined);
  root = createRoot();
  await act(async () => root.render(createElement(Probe, { cardId: 'book' })));
});
afterEach(async () => {
  await act(async () => root.unmount());
});

it('speaks English text and clears playback after the native completion callback', async () => {
  await act(async () => speech.pronounce('Book'));
  expect(Speech.speak).toHaveBeenCalledWith(
    'Book',
    expect.objectContaining({ language: 'en-US' }),
  );
  expect(speech.speakingText).toBe('Book');
  await act(async () =>
    jest.mocked(Speech.speak).mock.calls[0]?.[1]?.onDone?.(),
  );
  expect(speech.speakingText).toBeNull();
});

it('ignores callbacks from an older utterance when playing the example', async () => {
  await act(async () => speech.pronounce('Book'));
  const previousOptions = jest.mocked(Speech.speak).mock.calls[0]?.[1];
  await act(async () => speech.pronounce('This book is about animals.'));
  await act(async () => previousOptions?.onStopped?.());
  expect(speech.speakingText).toBe('This book is about animals.');
});

it('cancels queued playback when the card changes before native stop resolves', async () => {
  let finishStop: () => void = () => {};
  jest.mocked(Speech.stop).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishStop = resolve;
      }),
  );
  let pendingPlayback: Promise<void> = Promise.resolve();
  await act(async () => {
    pendingPlayback = speech.pronounce('Book');
  });
  await act(async () =>
    root.render(createElement(Probe, { cardId: 'pencil' })),
  );
  await act(async () => {
    finishStop();
    await pendingPlayback;
  });
  expect(Speech.speak).not.toHaveBeenCalled();
  expect(speech.speakingText).toBeNull();
});

it('stops playback on unmount and does not resume a queued request', async () => {
  let finishStop: () => void = () => {};
  jest.mocked(Speech.stop).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishStop = resolve;
      }),
  );
  const pendingPlayback = speech.pronounce('Book');
  await act(async () => root.unmount());
  finishStop();
  await pendingPlayback;
  expect(Speech.stop).toHaveBeenCalledTimes(2);
  expect(Speech.speak).not.toHaveBeenCalled();
});

it('exposes device speech failure and allows a subsequent retry', async () => {
  jest
    .mocked(Speech.stop)
    .mockRejectedValueOnce(new Error('Speech unavailable'));
  await act(async () => speech.pronounce('Book'));
  expect(speech.hasSpeechError).toBe(true);
  expect(speech.speakingText).toBeNull();
  await act(async () => speech.pronounce('Book'));
  expect(speech.hasSpeechError).toBe(false);
  expect(speech.speakingText).toBe('Book');
});
