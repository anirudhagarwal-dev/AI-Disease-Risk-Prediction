import type { Language } from '../contexts/LanguageContext';
import { languageNames } from './translations';

export const getLanguageInstruction = (language: Language): string => {
  if (language === 'en') return '';
  
  const langName = languageNames[language];
  return `IMPORTANT: You must respond ONLY in ${langName} language. Do not use English. Translate your entire response to ${langName}.\n\n`;
};

export const addLanguageToPrompt = (prompt: string, language: Language): string => {
  const instruction = getLanguageInstruction(language);
  return instruction + prompt;
};

// Helper function to convert language code to browser-compatible format (e.g., 'hi' -> 'hi-IN')
export const getBrowserLanguageCode = (language: Language): string => {
  const languageMap: Record<Language, string> = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'bn': 'bn-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'gu': 'gu-IN',
    'kn': 'kn-IN',
    'ml': 'ml-IN',
  };
  return languageMap[language] || 'en-US';
};

