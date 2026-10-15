import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

const SPEECH_LANGUAGE = 'en-US';
const SPEECH_PITCH = 1;
const SPEECH_RATE = 0.95;

export function usePronunciation(word?: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const pronounce = useCallback(async () => {
    const trimmedWord = word?.trim();

    if (!trimmedWord) {
      return;
    }

    try {
      await Speech.stop();
      setIsSpeaking(true);
      Speech.speak(trimmedWord, {
        language: SPEECH_LANGUAGE,
        onDone: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onError: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onStopped: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        pitch: SPEECH_PITCH,
        rate: SPEECH_RATE,
      });
    } catch (error) {
      if (isMountedRef.current) {
        setIsSpeaking(false);
      }
      console.error('[PronunciationButton] Failed to pronounce word', error);
    }
  }, [word]);

  return { isSpeaking, pronounce };
}
