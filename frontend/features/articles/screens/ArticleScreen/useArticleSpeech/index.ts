import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { type ArticleBlock } from '@/features/articles/api';

import { getBlockIndexFromTokenKey } from '../utils';
import { createArticleSpeechChunks } from './utils/createArticleSpeechChunks';
import { createPlayableChunk } from './utils/createPlayableChunk';
import { findWordIndexAtChar } from './utils/findWordIndexAtChar';
import { getGlobalWordIndex } from './utils/getGlobalWordIndex';

type ArticleSpeechStatus = 'idle' | 'paused' | 'playing';

type SpeechBoundary = { charIndex: number };

type StopReason = 'pause' | 'reset' | 'stop' | null;

const ACTIVE_TOKEN_UPDATE_INTERVAL_MS = 300;
const ARTICLE_SPEECH_LANGUAGE = 'en-US';
const ARTICLE_SPEECH_RATE = 0.92;

/**
 * Coordinates native speech across article chunks and highlights the active word.
 * Pausing uses native support on iOS and resumes from the saved word elsewhere.
 * Changing chunks or unmounting stops speech; session IDs ignore stale callbacks.
 * Stopping or finishing playback resets progress and the active word.
 *
 * @param blocks - Article blocks to read; missing or wordless content cannot play.
 * @returns Playback status, progress, active token, availability, a play/pause
 * action, and asynchronous restart/stop actions.
 * @example
 * // Inside a component or another hook:
 * const speech = useArticleSpeech(blocks);
 * speech.togglePlayPause();
 * // Starts playback when idle and readable words exist.
 */
export function useArticleSpeech(blocks?: ArticleBlock[]) {
  const chunks = useMemo(() => createArticleSpeechChunks(blocks), [blocks]);
  const [activeTokenKey, setActiveTokenKey] = useState<string | undefined>();
  const [status, setStatus] = useState<ArticleSpeechStatus>('idle');
  const activeTokenKeyRef = useRef<string | undefined>(undefined);
  const chunkIndexRef = useRef(0);
  const lastActiveTokenUpdateAtRef = useRef(0);
  const wordIndexRef = useRef(0);
  const sessionIdRef = useRef(0);
  const stopReasonRef = useRef<StopReason>(null);

  const totalWords = useMemo(
    () => chunks.reduce((sum, chunk) => sum + chunk.words.length, 0),
    [chunks],
  );
  const currentGlobalWordIndex = getGlobalWordIndex(
    chunks,
    chunkIndexRef.current,
    wordIndexRef.current,
  );
  const progress = totalWords > 0 ? currentGlobalWordIndex / totalWords : 0;
  const canSpeak = totalWords > 0;

  const resetSpeechState = useCallback(() => {
    chunkIndexRef.current = 0;
    wordIndexRef.current = 0;
    activeTokenKeyRef.current = undefined;
    lastActiveTokenUpdateAtRef.current = 0;
    setActiveTokenKey(undefined);
    setStatus('idle');
  }, []);

  const publishActiveTokenKey = useCallback(
    (tokenKey: string, force = false) => {
      if (activeTokenKeyRef.current === tokenKey) {
        return;
      }

      const now = Date.now();
      const isNextTokenInDifferentBlock =
        getBlockIndexFromTokenKey(activeTokenKeyRef.current) !==
        getBlockIndexFromTokenKey(tokenKey);

      activeTokenKeyRef.current = tokenKey;

      if (
        force ||
        isNextTokenInDifferentBlock ||
        now - lastActiveTokenUpdateAtRef.current >=
          ACTIVE_TOKEN_UPDATE_INTERVAL_MS
      ) {
        lastActiveTokenUpdateAtRef.current = now;
        setActiveTokenKey(tokenKey);
      }
    },
    [],
  );

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
      publishActiveTokenKey(firstWord.tokenKey, true);
      setStatus('playing');

      Speech.speak(playableChunk.text, {
        language: ARTICLE_SPEECH_LANGUAGE,
        onBoundary: ({ charIndex }: SpeechBoundary) => {
          if (sessionIdRef.current !== sessionId) {
            return;
          }

          const nextWordIndex = findWordIndexAtChar(
            playableChunk.words,
            charIndex,
          );
          const nextWord = playableChunk.words[nextWordIndex];

          if (!nextWord) {
            return;
          }

          wordIndexRef.current = wordIndex + nextWordIndex;
          publishActiveTokenKey(nextWord.tokenKey);
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

          if (
            stopReasonRef.current === 'reset' ||
            stopReasonRef.current === 'stop'
          ) {
            stopReasonRef.current = null;
            resetSpeechState();
          }
        },
        pitch: 1,
        rate: ARTICLE_SPEECH_RATE,
      });
    },
    [chunks, publishActiveTokenKey, resetSpeechState],
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
