import { validateApiKey, handleApiError, sanitizeUserInput } from '../utils/apiHelpers';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// Use model-appropriate endpoints (Generative Language API)
// Default text model: basic/fast per user request
const GEMINI_TEXT_MODEL = 'gemini-2.0-flash-exp';
const GEMINI_VISION_MODEL = 'gemini-2.0-flash-exp'; // Same model handles both text and images
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';
const GEMINI_API_VERSION = 'v1beta';
const GEMINI_TEXT_URL = `${GEMINI_API_BASE}/${GEMINI_API_VERSION}/models/${GEMINI_TEXT_MODEL}:generateContent`;
const GEMINI_VISION_URL = `${GEMINI_API_BASE}/${GEMINI_API_VERSION}/models/${GEMINI_VISION_MODEL}:generateContent`;

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

export const sendChatMessage = async (
  message: string,
  history: ChatMessage[] = [],
  options?: { model?: string; language?: string }
): Promise<string> => {
  try {
    if (!GOOGLE_API_KEY) {
      console.error('Google API Key is missing. Please check your environment variables.');
      throw new Error('API Key not configured. Please set VITE_GOOGLE_API_KEY in your environment variables (Vercel Settings → Environment Variables).');
    }

    const sanitizedMessage = sanitizeUserInput(message);
    console.log('Sending message to Gemini API:', sanitizedMessage.substring(0, 50) + '...');

    // Add language instruction if specified
    const languageInstruction = options?.language && options.language !== 'English' 
      ? `Please respond in ${options.language} language. ` 
      : '';
    
    const finalMessage = languageInstruction + sanitizedMessage;

    const contents = [
      ...history,
      {
        role: 'user' as const,
        parts: [{ text: finalMessage }]
      }
    ];

    const requestBody = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const modelsToTry = [
      options?.model || GEMINI_TEXT_MODEL,
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    let lastError: any;
    for (const model of modelsToTry) {
      const url = `${GEMINI_API_BASE}/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
      const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `API request failed: ${response.status}`;
        
        // Check for HTTP referrer restriction (403 error)
        if (response.status === 403 && errorData?.error?.code === 403) {
          const referrerError = errorData.error.details?.find((d: any) => d.reason === 'API_KEY_HTTP_REFERRER_BLOCKED');
          if (referrerError) {
            const domain = referrerError.metadata?.httpReferrer || 'your domain';
            errorMessage = `API Key HTTP Referrer Restriction: Your domain ${domain} is not allowed. Please add it to Google Cloud Console → APIs & Services → Credentials → Your API Key → Application restrictions → HTTP referrers. Add: https://healthpredict-ai.vercel.app/*`;
          }
        }
        
        lastError = new Error(errorMessage);
        // Try next model on 404
        if (response.status === 404) continue;
        throw lastError;
      }

      const data: GeminiResponse = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        lastError = new Error('No response candidates returned from API');
        continue;
      }
      const responseText = data.candidates[0]?.content?.parts[0]?.text;
      if (!responseText) {
        lastError = new Error('Empty response from API');
        continue;
      }
      return responseText;
    }
    throw lastError || new Error('Failed to get response from all models');
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with AI service');
  }
};

export const analyzeImage = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    if (!GOOGLE_API_KEY) {
      throw new Error('API Key not configured');
    }

    const sanitizedPrompt = sanitizeUserInput(prompt);
    console.log('Analyzing image with Gemini Vision API');

    const modelsToTry = [GEMINI_VISION_MODEL, 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-pro-vision'];
    let lastError: any;
    for (const model of modelsToTry) {
      const url = `${GEMINI_API_BASE}/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: sanitizedPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(`Image analysis failed: ${response.status} - ${JSON.stringify(errorData)}`);
        if (response.status === 404) continue;
        throw lastError;
      }

      const data: GeminiResponse = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text;
      if (!responseText) {
        lastError = new Error('Empty response from image analysis');
        continue;
      }
      return responseText;
    }
    throw lastError || new Error('Failed to analyze image with available models');
  } catch (error) {
    console.error('Image Analysis Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze image');
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
};

export const textToSpeech = async (text: string, languageCode: string = 'en-US'): Promise<string> => {
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode,
            ssmlGender: 'NEUTRAL',
          },
          audioConfig: {
            audioEncoding: 'MP3',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Text-to-speech failed: ${response.status}`);
    }

    const data = await response.json();
    return data.audioContent;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw error;
  }
};

export const getLanguageCode = (language: string): string => {
  const languageMap: Record<string, string> = {
    'English': 'en',
    'हिन्दी': 'hi',
    'বাংলা': 'bn',
    'தமிழ்': 'ta',
    'తెలుగు': 'te',
    'ગુજરાતી': 'gu',
    'ಕನ್ನಡ': 'kn',
    'മലയാളം': 'ml',
  };
  return languageMap[language] || 'en';
};
