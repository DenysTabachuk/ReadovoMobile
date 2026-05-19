import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { type ArticleBlock } from '@/api/wikipedia';

import {
  createArticleSpeechChunks,
  type ArticleSpeechChunk,
  type ArticleSpeechWord,
} from './speechParts';

type ArticleSpeechStatus = 'idle' | 'paused' | 'playing';

type StopReason = 'pause' | 'reset' | 'stop' | null;

export function useArticleSpeech(blocks?: ArticleBlock[]) {
  const chunks = useMemo(() => createArticleSpeechChunks(blocks), [blocks]);
  const [activeTokenKey, setActiveTokenKey] = useState<string | undefined>();
  const [status, setStatus] = useState<ArticleSpeechStatus>('idle');
  const chunkIndexRef = useRef(0);
  const wordIndexRef = useRef(0);
  const sessionIdRef = useRef(0);
  const stopReasonRef = useRef<StopReason>(null);

  const totalWords = useMemo(
    () => chunks.reduce((sum, chunk) => sum + chunk.words.length, 0),
    [chunks],
  );
  const currentGlobalWordIndex = useMemo(
    () => getGlobalWordIndex(chunks, chunkIndexRef.current, wordIndexRef.current),
    [chunks, activeTokenKey],
  );
  const progress = totalWords > 0 ? currentGlobalWordIndex / totalWords : 0;
  const canSpeak = totalWords > 0;

  const resetSpeechState = useCallback(() => {
    chunkIndexRef.current = 0;
    wordIndexRef.current = 0;
    setActiveTokenKey(undefined);
    setStatus('idle');
  }, []);

  const speakFrom = useCallback(
    (chunkIndex: number, wordIndex: number) => {
      const chunk = chunks[chunkIndex];
      const firstWord = chunk?.words[wordIndex];

      if (!chunk || !firstWord) {
        resetSpeechState();
        return;
      }

      const sessionId = sessionIdRef.current;
      const playableChunk = createPlayableChunk(chunk, wordIndex);

      chunkIndexRef.current = chunkIndex;
      wordIndexRef.current = wordIndex;
      setActiveTokenKey(firstWord.tokenKey);
      setStatus('playing');

      Speech.speak(playableChunk.text, {
        language: 'en-US',
        onBoundary: ({ charIndex }: { charIndex: number }) => {
          if (sessionIdRef.current !== sessionId) {
            return;
          }

          const nextWordIndex = findWordIndexAtChar(playableChunk.words, charIndex);
          const nextWord = playableChunk.words[nextWordIndex];

          if (!nextWord) {
            return;
          }

          wordIndexRef.current = wordIndex + nextWordIndex;
          setActiveTokenKey(nextWord.tokenKey);
        },
        onDone: () => {
          if (sessionIdRef.current !== sessionId) {
            return;
          }

          const nextChunkIndex = chunkIndex + 1;

          if (chunks[nextChunkIndex]) {
            speakFrom(nextChunkIndex, 0);
            return;
          }

          resetSpeechState();
        },
        onError: (error) => {
          if (sessionIdRef.current !== sessionId) {
            return;
          }

          console.error('[ArticleSpeech] Failed to speak article text', error);
          resetSpeechState();
        },
        onStopped: () => {
          if (sessionIdRef.current !== sessionId) {
            return;
          }

          if (stopReasonRef.current === 'pause') {
            stopReasonRef.current = null;
            return;
          }

          if (stopReasonRef.current === 'reset' || stopReasonRef.current === 'stop') {
            stopReasonRef.current = null;
            resetSpeechState();
          }
        },
        pitch: 1,
        rate: 0.92,
      });
    },
    [chunks, resetSpeechState],
  );

  const stop = useCallback(async () => {
    sessionIdRef.current += 1;
    stopReasonRef.current = 'stop';
    await Speech.stop();
    resetSpeechState();
  }, [resetSpeechState]);

  const restart = useCallback(async () => {
    if (!canSpeak) {
      return;
    }

    sessionIdRef.current += 1;
    stopReasonRef.current = 'reset';
    await Speech.stop();
    sessionIdRef.current += 1;
    stopReasonRef.current = null;
    speakFrom(0, 0);
  }, [canSpeak, speakFrom]);

  const pause = useCallback(async () => {
    if (status !== 'playing') {
      return;
    }

    setStatus('paused');
    stopReasonRef.current = 'pause';

    try {
      if (Platform.OS === 'ios') {
        await Speech.pause();
        return;
      }
    } catch {
      // Android and some runtimes do not support native pause; stop keeps the saved word index.
    }

    await Speech.stop();
  }, [status]);

  const play = useCallback(async () => {
    if (!canSpeak) {
      return;
    }

    if (status === 'playing') {
      return;
    }

    if (status === 'paused' && Platform.OS === 'ios') {
      try {
        await Speech.resume();
        setStatus('playing');
        return;
      } catch {
        // Fall through to restarting from the saved word when native resume is unavailable.
      }
    }

    sessionIdRef.current += 1;
    stopReasonRef.current = null;
    speakFrom(chunkIndexRef.current, wordIndexRef.current);
  }, [canSpeak, speakFrom, status]);

  const togglePlayPause = useCallback(() => {
    if (status === 'playing') {
      void pause();
      return;
    }

    void play();
  }, [pause, play, status]);

  useEffect(() => {
    sessionIdRef.current += 1;
    stopReasonRef.current = 'reset';
    void Speech.stop();
    resetSpeechState();
  }, [chunks, resetSpeechState]);

  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      void Speech.stop();
    };
  }, []);

  return {
    activeTokenKey,
    canSpeak,
    progress,
    restart,
    status,
    stop,
    togglePlayPause,
  };
}

function createPlayableChunk(
  chunk: ArticleSpeechChunk,
  startWordIndex: number,
): ArticleSpeechChunk {
  const firstWord = chunk.words[startWordIndex];

  if (!firstWord) {
    return chunk;
  }

  const charOffset = firstWord.charStart;
  const words = chunk.words.slice(startWordIndex).map((word) => ({
    ...word,
    charEnd: word.charEnd - charOffset,
    charStart: word.charStart - charOffset,
  }));

  return {
    text: chunk.text.slice(charOffset),
    words,
  };
}

function findWordIndexAtChar(words: ArticleSpeechWord[], charIndex: number): number {
  const exactIndex = words.findIndex(
    (word) => word.charStart <= charIndex && charIndex < word.charEnd,
  );

  if (exactIndex >= 0) {
    return exactIndex;
  }

  const nextIndex = words.findIndex((word) => word.charStart >= charIndex);

  if (nextIndex >= 0) {
    return nextIndex;
  }

  return words.length - 1;
}

function getGlobalWordIndex(
  chunks: ArticleSpeechChunk[],
  chunkIndex: number,
  wordIndex: number,
): number {
  const previousWords = chunks
    .slice(0, chunkIndex)
    .reduce((sum, chunk) => sum + chunk.words.length, 0);

  return previousWords + wordIndex;
}
