import { useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { useCallback, useRef, useState } from 'react';

const PRONUNCIATION_LANGUAGE = 'en-US';
const PRONUNCIATION_RATE = 0.9;

/**
 * Plays one word or example with device speech and ignores stale native callbacks.
 * Changing cards or leaving the screen invalidates requests and stops playback.
 * @param cardId - Identity of the displayed card; changing it cancels speech.
 * @returns Playback text, failure state and an action to speak English text.
 * @example
 * const { pronounce } = useVocabularySpeech('book');
 * void pronounce('Book'); // Speaks the word in US English while the card is active.
 */
export function useVocabularySpeech(cardId: string) {
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [hasSpeechError, setHasSpeechError] = useState(false);
  const requestIdRef = useRef(0);
  const isActiveRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isActiveRef.current = true;
      setSpeakingText(null);
      setHasSpeechError(false);
      return () => {
        isActiveRef.current = false;
        requestIdRef.current += 1;
        void Speech.stop().catch(() => undefined);
      };
    }, [cardId]),
  );

  const pronounce = useCallback(async (text: string) => {
    if (!isActiveRef.current || !text.trim()) return;
    const requestId = ++requestIdRef.current;
    const isCurrentRequest = () =>
      isActiveRef.current && requestIdRef.current === requestId;
    const finish = () => {
      if (isCurrentRequest()) setSpeakingText(null);
    };
    const fail = () => {
      if (isCurrentRequest()) {
        setSpeakingText(null);
        setHasSpeechError(true);
      }
    };

    try {
      await Speech.stop();
      if (!isCurrentRequest()) return;
      setHasSpeechError(false);
      setSpeakingText(text);
      Speech.speak(text, {
        language: PRONUNCIATION_LANGUAGE,
        rate: PRONUNCIATION_RATE,
        onDone: finish,
        onStopped: finish,
        onError: fail,
      });
    } catch {
      fail();
    }
  }, []);

  return { speakingText, hasSpeechError, pronounce };
}
