import { useState, useCallback, useEffect } from 'react';
import { textToSpeech } from '../services/googleAI';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, languageCode?: string) => Promise<void>;
  stop: () => void;
  error: string | null;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, languageCode: string = 'en-US') => {
    try {
      setError(null);
      setIsSpeaking(true);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageCode;
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
          setError('Speech synthesis error');
          setIsSpeaking(false);
        };
        speechSynthesis.speak(utterance);
      } else {
        const audioContent = await textToSpeech(text, languageCode);
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);

        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setError('Audio playback error');
          setIsSpeaking(false);
        };

        await audio.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Text-to-speech failed');
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    error,
  };
};
