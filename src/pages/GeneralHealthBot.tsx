import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, MessageCircle, User, Bot, AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';
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
}

const GeneralHealthBot = () => {
  const { language } = useLanguage();
  
  const getWelcomeMessage = () => {
    const welcome = getTranslation(language, 'chatbot.welcome.general');
    const disclaimer = getTranslation(language, 'chatbot.welcome.disclaimer');
    const emergency = getTranslation(language, 'chatbot.emergency');
    return `${welcome}\n\n⚠️ ${disclaimer} ${emergency}`;
  };
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getWelcomeMessage(),
      sender: 'bot',
      timestamp: new Date(),
      sources: ['Google Gemini AI', 'Medical Knowledge Base']
    }
  ]);
  
  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => [{
      ...prev[0],
      text: getWelcomeMessage()
    }, ...prev.slice(1)]);
  }, [language]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
      const basePrompt = `You are a helpful medical assistant. Please provide accurate, evidence-based health information. Always remind users to consult healthcare professionals for serious concerns.\n\nUser question: ${currentInput}`;
      const healthPrompt = addLanguageToPrompt(basePrompt, language);

      const response = await sendChatMessage(healthPrompt, chatHistory, { model: 'gemini-1.5-flash' });

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
        sources: ['Google Gemini AI', 'Medical Knowledge Base']
      };

      setMessages(prev => [...prev, botResponse]);
      // Persist chat history to backend (best-effort)
      try {
        const { getOrCreateAnonUserId } = await import('../utils/user');
        const { logChat } = await import('../services/api');
        const userId = getOrCreateAnonUserId();
        await logChat({ user_id: userId, bot_type: 'general', message: currentInput, response });
      } catch (e) {
        console.warn('Failed to save chat history:', e);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm having trouble connecting to the AI service right now.\n\nError: ${errorMessage}\n\nPlease check:\n• Your internet connection\n• API key configuration\n• Try again in a moment\n\nFor medical emergencies:\n• Call 108 (National Emergency)\n• Call 102 (Medical Emergency)\n• Visit nearest hospital`,
        sender: 'bot',
        timestamp: new Date(),
        sources: ['System Error']
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
        alert('Voice recognition error. Please try again.');
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
      utterance.rate = 0.9;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-6 shadow-2xl"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MessageCircle className="h-7 w-7" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {getTranslation(language, 'chatbot.header.general')}
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </h1>
              <p className="text-blue-100 text-sm font-medium">
                {getTranslation(language, 'chatbot.poweredBy')}
              </p>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end space-x-2 text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full">
              <span>🔒</span>
              <span>{getTranslation(language, 'chatbot.secure')}</span>
            </div>
            <div className="flex items-center justify-end space-x-2 text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full">
              <span>🤖</span>
              <span>{getTranslation(language, 'chatbot.aiPowered')}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Chat Container */}
      <div className="max-w-4xl mx-auto p-6">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100 h-[650px] flex flex-col overflow-hidden"
        >
          
          {/* Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-transparent">
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
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                    }`}>
                      {message.sender === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </motion.div>
                    
                    <motion.div 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className={`rounded-2xl p-4 shadow-md ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300/50">
                          <div className="flex items-center space-x-1 mb-2">
                            <ExternalLink className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600 font-semibold">{getTranslation(language, 'chatbot.sources')}</span>
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
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {message.sender === 'bot' && (
                          <button
                            onClick={() => isSpeaking ? stopSpeaking() : handleTextToSpeech(message.text)}
                            className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            {isSpeaking ? 
                              <VolumeX className="h-3 w-3 text-gray-600" /> : 
                              <Volume2 className="h-3 w-3 text-gray-600" />
                            }
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Enhanced Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center space-x-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-md"
                  >
                    <Bot className="h-5 w-5 text-blue-600" />
                  </motion.div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-blue-500 rounded-full"
                        ></motion.div>
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-purple-500 rounded-full"
                        ></motion.div>
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-pink-500 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{getTranslation(language, 'chatbot.typing')}</span>
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
                  placeholder={getTranslation(language, 'chatbot.placeholder')}
                  className="w-full px-5 py-4 pr-14 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleVoiceInput}
                  disabled={isListening}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </motion.button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                💡 {getTranslation(language, 'chatbot.try')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Emergency Notice */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-red-800 text-sm font-medium">{getTranslation(language, 'chatbot.emergencyContacts')}</p>
              <p className="text-red-700 text-xs">
                {getTranslation(language, 'chatbot.emergencyNumbers')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm text-center">
            ⚠️ {getTranslation(language, 'chatbot.disclaimerFull')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneralHealthBot;