import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Brain, User, Heart, AlertTriangle, Phone, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, ChatMessage } from '../services/googleAI';
import { useLanguage } from '../contexts/LanguageContext';
import { addLanguageToPrompt, getBrowserLanguageCode } from '../utils/languageHelper';
import { getTranslation } from '../utils/translations';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
  action?: any;
  isTyping?: boolean;
  isEmergency?: boolean;
}

const MentalHealthBot = () => {
  const { language } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      sources: ['Google Gemini AI', 'Mental Health Resources']
    }
  ]);
  
  // Set initial welcome message based on language
  useEffect(() => {
    const welcomeText = `${getTranslation(language, 'chatbot.welcome.mental')}\n\n⚠️ ${getTranslation(language, 'chatbot.welcome.disclaimer')} ${getTranslation(language, 'chatbot.emergency')}`;
    setMessages([{
      id: '1',
      text: welcomeText,
      sender: 'bot',
      timestamp: new Date(),
      sources: ['Google Gemini AI', 'Mental Health Resources']
    }]);
  }, [language]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      // Scroll the container itself, not the entire page
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Only scroll when new messages are added
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      const basePrompt = `You are a compassionate mental health support assistant. Provide empathetic, supportive responses. If the user mentions self-harm or suicide, urgently recommend professional help and crisis hotlines. Always be kind and understanding.\n\nUser message: ${currentInput}`;
      const mentalHealthPrompt = addLanguageToPrompt(basePrompt, language);

      const response = await sendChatMessage(mentalHealthPrompt, chatHistory, { model: 'gemini-1.5-flash' });

      const isEmergency = /\b(suicide|kill myself|end my life|hurt myself|self-harm)\b/i.test(currentInput);

      if (isEmergency) {
        setEmergencyTriggered(true);
      }

      const newChatHistory: ChatMessage[] = [
        ...chatHistory,
        { role: 'user', parts: [{ text: currentInput }] },
        { role: 'model', parts: [{ text: response }] }
      ];
      setChatHistory(newChatHistory);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        sources: ['Google Gemini AI', 'Mental Health Resources'],
        isEmergency
      };

      setMessages(prev => [...prev, botResponse]);
      // Persist chat history (best-effort)
      try {
        const { getOrCreateAnonUserId } = await import('../utils/user');
        const { logChat } = await import('../services/api');
        const userId = getOrCreateAnonUserId();
        await logChat({ user_id: userId, bot_type: 'mental', message: currentInput, response });
      } catch (e) {
        console.warn('Failed to save chat history:', e);
      }
      
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getTranslation(language, 'chatbot.mental.errorMessage'),
        sender: 'bot',
        timestamp: new Date(),
        sources: ['Emergency Protocols']
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getBrowserLanguageCode(language);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        alert(getTranslation(language, 'chatbot.voiceNotSupported'));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert(getTranslation(language, 'chatbot.voiceNotSupported'));
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getBrowserLanguageCode(language);
      utterance.rate = 0.8; // Slower, more calming pace
      utterance.pitch = 0.9; // Slightly lower, more soothing
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      alert(getTranslation(language, 'chatbot.ttsNotSupported'));
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{getTranslation(language, 'chatbot.mental.title')}</h1>
              <p className="text-green-100 text-sm">{getTranslation(language, 'chatbot.mental.subtitle')}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-green-200">💙 {getTranslation(language, 'chatbot.mental.confidential')}</div>
            <div className="text-xs text-green-200">🤖 Google Gemini AI</div>
          </div>
        </div>
      </div>

      {/* Emergency Alert */}
      {emergencyTriggered && (
        <div className="bg-red-600 text-white p-4">
          <div className="max-w-4xl mx-auto flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <p className="font-semibold">{getTranslation(language, 'chatbot.mental.emergencyActivated')}</p>
              <p className="text-sm">{getTranslation(language, 'chatbot.mental.emergencyMessage')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
          
          {/* Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-green-600 text-white' 
                        : message.isEmergency
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {message.sender === 'user' ? <User className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                    </div>
                    
                    <div className={`rounded-2xl p-3 ${
                      message.sender === 'user'
                        ? 'bg-green-600 text-white'
                        : message.isEmergency
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-green-50 text-gray-800 border border-green-100'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-300">
                          <div className="flex items-center space-x-1 mb-1">
                            <ExternalLink className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">{getTranslation(language, 'chatbot.sources')}</span>
                          </div>
                          {message.sources.map((source, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              • {source}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {message.sender === 'bot' && (
                          <button
                            onClick={() => isSpeaking ? stopSpeaking() : handleTextToSpeech(message.text)}
                            className="ml-2 p-1 rounded-full hover:bg-green-100 transition-colors"
                          >
                            {isSpeaking ? 
                              <VolumeX className="h-3 w-3 text-green-600" /> : 
                              <Volume2 className="h-3 w-3 text-green-600" />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-green-600">{getTranslation(language, 'chatbot.mental.listening')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={getTranslation(language, 'chatbot.mental.placeholder')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={handleVoiceInput}
                  disabled={isListening}
                  className={`absolute right-3 top-3 p-1 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-100 text-red-600' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                💚 {getTranslation(language, 'chatbot.mental.try')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Resources */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Phone className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">🆘 {getTranslation(language, 'chatbot.mental.crisisResources')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-red-700">
              <p className="font-medium">{getTranslation(language, 'chatbot.mental.suicidePrevention')}</p>
              <p>📞 9152987821</p>
            </div>
            <div className="text-red-700">
              <p className="font-medium">{getTranslation(language, 'chatbot.mental.kiranMentalHealth')}</p>
              <p>📞 1800-599-0019</p>
            </div>
            <div className="text-red-700">
              <p className="font-medium">{getTranslation(language, 'chatbot.mental.vandrevalaFoundation')}</p>
              <p>📞 9999666555</p>
            </div>
          </div>
          <p className="text-red-600 text-xs mt-2">
            {getTranslation(language, 'chatbot.mental.crisisMessage')}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm text-center">
            💙 {getTranslation(language, 'chatbot.mental.disclaimerFull')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthBot;