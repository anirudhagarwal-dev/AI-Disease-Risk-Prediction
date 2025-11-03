const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROK_API_BASE_URL = 'https://api.x.ai/v1';

interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class GrokService {
  private async callGrokAPI(messages: ChatMessage[]): Promise<string> {
    try {
      if (!GROK_API_KEY) {
        throw new Error('Grok API key not configured. Set VITE_GROK_API_KEY or disable Grok usage.');
      }

      const response = await fetch(`${GROK_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data: GrokResponse = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
    } catch (error) {
      console.error('Grok API Error:', error);
      throw error;
    }
  }

  async getGeneralHealthResponse(userMessage: string): Promise<{ text: string; sources: string[] }> {
    const systemPrompt = `You are a General Health Assistant powered by government health databases and WHO guidelines. You provide evidence-based health information for preventive care.

IMPORTANT GUIDELINES:
- Always mention this is not a substitute for professional medical care
- For emergencies, direct users to contact emergency services (108 in India)
- Provide information based on MoHFW (Ministry of Health and Family Welfare) guidelines
- Include practical home remedies where appropriate
- Always include sources from Indian health authorities
- If user mentions suicide or self-harm, immediately provide crisis helpline numbers

Respond in a caring, professional manner with practical advice. Include relevant sources from Indian health authorities.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await this.callGrokAPI(messages);
      return {
        text: response + '\n\n⚠️ This is not a substitute for professional medical care. For emergencies, contact emergency services immediately.',
        sources: ['MoHFW Guidelines', 'WHO Health Database', 'ICMR Health Protocols']
      };
    } catch (error) {
      throw new Error('Failed to get health guidance. Please try again or consult a healthcare professional.');
    }
  }

  async getMentalHealthResponse(userMessage: string): Promise<{ text: string; sources: string[]; isEmergency?: boolean }> {
    // Check for suicide risk keywords
    const suicideKeywords = ['kill myself', 'end my life', 'want to die', 'suicide', 'not worth living', 'better off dead'];
    const isEmergency = suicideKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

    if (isEmergency) {
      return {
        text: '🚨 I\'m really concerned about you and want to help. You are not alone, and your life has value.\n\n**Immediate Help:**\n• National Suicide Prevention: 9152987821\n• KIRAN Mental Health: 1800-599-0019\n• Vandrevala Foundation: 9999666555\n\n**Right Now:**\n• Stay with someone you trust\n• Remove any means of self-harm\n• Go to the nearest hospital emergency room\n\n💙 You matter, and there are people who want to help you through this.',
        sources: ['National Suicide Prevention Program', 'NIMHANS Crisis Guidelines'],
        isEmergency: true
      };
    }

    const systemPrompt = `You are a Mental Health Support Assistant providing emotional support and coping strategies. You are empathetic, non-judgmental, and supportive.

IMPORTANT GUIDELINES:
- Always acknowledge and validate the user's feelings
- Provide evidence-based coping strategies
- Direct users to professional help when appropriate
- Never provide medical diagnosis or prescribe medications
- Be warm, empathetic, and supportive in tone
- Include crisis helpline numbers if user seems in distress
- This is not a substitute for professional mental health care

Focus on emotional support, coping strategies, and encouraging professional help when needed. Respond with compassion and understanding.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await this.callGrokAPI(messages);
      return {
        text: response + '\n\n⚠️ This is not a substitute for professional mental health care. Consider speaking with a counselor or therapist for personalized support.',
        sources: ['National Mental Health Program', 'WHO Mental Health Guidelines', 'NIMHANS Mental Health Resources'],
        isEmergency: false
      };
    } catch (error) {
      throw new Error('I\'m having trouble connecting right now. If you\'re in crisis, please reach out to KIRAN Mental Health: 1800-599-0019');
    }
  }

  async getImageVoiceResponse(userMessage: string, hasImage: boolean = false): Promise<{ text: string; sources: string[] }> {
    const systemPrompt = `You are an Image & Voice Assistant for medical image analysis and multilingual voice support.

IMPORTANT GUIDELINES:
- For medical images: Provide general observations but always recommend professional medical examination
- Never provide definitive medical diagnosis from images
- Always emphasize the need for professional medical consultation
- Include wound care basics, skin condition general care
- For voice inputs: Respond to health queries with evidence-based information
- This is not a substitute for professional medical diagnosis

${hasImage ? 
  'The user has uploaded an image for analysis. Provide general guidance about what to look for and when to seek medical care, but never attempt to diagnose.' : 
  'Respond to the user\'s voice/text health query with helpful information.'
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: hasImage ? `I've uploaded an image for medical analysis: ${userMessage}` : userMessage }
    ];

    try {
      const response = await this.callGrokAPI(messages);
      return {
        text: response + '\n\n⚠️ This analysis is for informational purposes only. Professional medical examination is essential for accurate diagnosis.',
        sources: ['Medical Image Analysis Guidelines', 'WHO Visual Health Standards', 'Dermatology Guidelines India']
      };
    } catch (error) {
      throw new Error('Failed to analyze the request. For urgent medical concerns, please contact a healthcare professional immediately.');
    }
  }
}

export const grokService = new GrokService();