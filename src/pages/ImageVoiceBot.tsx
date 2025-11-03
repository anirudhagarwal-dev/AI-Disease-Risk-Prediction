import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Camera, Upload, User, Bot, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, analyzeImage, ChatMessage } from '../services/googleAI';
import { useLanguage } from '../contexts/LanguageContext';
import { addLanguageToPrompt, getBrowserLanguageCode } from '../utils/languageHelper';
import { getTranslation } from '../utils/translations';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
  sources?: string[];
  action?: any;
  isTyping?: boolean;
}

const ImageVoiceBot = () => {
  const { language: appLanguage } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      sources: ['Google Gemini AI', 'Vision API']
    }
  ]);
  
  // Set initial welcome message based on language
  useEffect(() => {
    const welcomeText = `${getTranslation(appLanguage, 'chatbot.welcome.imageVoice')}\n\n⚠️ ${getTranslation(appLanguage, 'chatbot.welcome.disclaimer')} ${getTranslation(appLanguage, 'chatbot.emergency')}`;
    setMessages([{
      id: '1',
      text: welcomeText,
      sender: 'bot',
      timestamp: new Date(),
      sources: ['Google Gemini AI', 'Vision API']
    }]);
  }, [appLanguage]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [language, setLanguage] = useState('en-US');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'हिन्दी' },
    { code: 'bn-IN', name: 'বাংলা' },
    { code: 'ta-IN', name: 'தமிழ்' },
    { code: 'te-IN', name: 'తెలుగు' },
    { code: 'gu-IN', name: 'ગુજરાતી' },
    { code: 'kn-IN', name: 'ಕನ್ನಡ' },
    { code: 'ml-IN', name: 'മലയാളം' }
  ];

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
    if (!inputText.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText || getTranslation(appLanguage, 'chatbot.imageVoice.imageUploaded'),
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    const currentImage = selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      let response: string;

      if (currentImage) {
        const base64Image = currentImage.split(',')[1];
        const basePrompt = currentInput || 'Analyze this medical image. Describe what you see and provide any relevant health information.';
        const prompt = addLanguageToPrompt(basePrompt, appLanguage);
        response = await analyzeImage(base64Image, prompt);
      } else {
        const basePrompt = `You are a helpful medical assistant. Provide accurate health information.\n\nUser question: ${currentInput}`;
        const prompt = addLanguageToPrompt(basePrompt, appLanguage);
        response = await sendChatMessage(prompt, chatHistory, { model: 'gemini-1.5-flash' });

        const newChatHistory: ChatMessage[] = [
          ...chatHistory,
          { role: 'user', parts: [{ text: currentInput }] },
          { role: 'model', parts: [{ text: response }] }
        ];
        setChatHistory(newChatHistory);
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        sources: currentImage ? ['Google Gemini AI (multimodal)'] : ['Google Gemini AI']
      };

      setMessages(prev => [...prev, botResponse]);
      // Persist chat history (text path only)
      try {
        if (!currentImage) {
          const { getOrCreateAnonUserId } = await import('../utils/user');
          const { logChat } = await import('../services/api');
          const userId = getOrCreateAnonUserId();
          await logChat({ user_id: userId, bot_type: 'image_voice', message: currentInput, response });
        }
      } catch (e) {
        console.warn('Failed to save chat history:', e);
      }
      
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getTranslation(appLanguage, 'chatbot.imageVoice.errorMessage'),
        sender: 'bot',
        timestamp: new Date(),
        sources: ['System Error']
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(getTranslation(appLanguage, 'chatbot.imageVoice.goodImage4') + '. ' + getTranslation(appLanguage, 'chatbot.imageVoice.placeholder'));
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(getTranslation(appLanguage, 'chatbot.imageVoice.imageAlt'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getBrowserLanguageCode(appLanguage);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.error('Speech recognition error:', event.error);
        alert(getTranslation(appLanguage, 'chatbot.voiceNotSupported'));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert(getTranslation(appLanguage, 'chatbot.voiceNotSupported'));
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getBrowserLanguageCode(appLanguage);
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      alert(getTranslation(appLanguage, 'chatbot.ttsNotSupported'));
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{getTranslation(appLanguage, 'chatbot.imageVoice.title')}</h1>
              <p className="text-purple-100 text-sm">{getTranslation(appLanguage, 'chatbot.imageVoice.subtitle')}</p>
            </div>
          </div>
          
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-sm text-white"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-gray-900">
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    
                    <div className={`rounded-2xl p-3 ${
                      message.sender === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-gray-800 border border-purple-100'
                    }`}>
                      {message.image && (
                        <div className="mb-3">
                          <img 
                            src={message.image} 
                            alt={getTranslation(appLanguage, 'chatbot.imageVoice.imageAlt')} 
                            className="max-w-64 max-h-64 rounded-lg object-cover border border-gray-200"
                          />
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-300">
                          <div className="flex items-center space-x-1 mb-1">
                            <ExternalLink className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">{getTranslation(appLanguage, 'chatbot.sources')}</span>
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
                          message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {message.sender === 'bot' && (
                          <button
                            onClick={() => isSpeaking ? stopSpeaking() : handleTextToSpeech(message.text)}
                            className="ml-2 p-1 rounded-full hover:bg-purple-100 transition-colors"
                          >
                            {isSpeaking ? 
                              <VolumeX className="h-3 w-3 text-purple-600" /> : 
                              <Volume2 className="h-3 w-3 text-purple-600" />
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
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-purple-600">
                        {selectedImage ? getTranslation(appLanguage, 'chatbot.imageVoice.imageAnalysis') : getTranslation(appLanguage, 'chatbot.imageVoice.processingVoice')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="border-t border-gray-200 p-4">
              <div className="relative inline-block">
                <img 
                  src={selectedImage} 
                  alt={getTranslation(appLanguage, 'chatbot.imageVoice.selectedImage')} 
                  className="max-w-32 max-h-32 rounded-lg object-cover border border-gray-300"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{getTranslation(appLanguage, 'chatbot.imageVoice.imageReady')}</p>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
                title={getTranslation(appLanguage, 'chatbot.imageVoice.uploadButton')}
              >
                <Upload className="h-4 w-4" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={getTranslation(appLanguage, 'chatbot.imageVoice.placeholder')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleVoiceInput}
                  disabled={isListening}
                  className={`absolute right-3 top-3 p-1 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-100 text-red-600' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={getTranslation(appLanguage, 'chatbot.imageVoice.voiceTitle').replace('{language}', languages.find(l => l.code === language)?.name || '')}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={(!inputText.trim() && !selectedImage) || isTyping}
                className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                📸 {getTranslation(appLanguage, 'chatbot.imageVoice.hint').replace('{language}', languages.find(l => l.code === language)?.name || '')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Usage Guidelines */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📋 {getTranslation(appLanguage, 'chatbot.imageVoice.guidelinesTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p className="font-medium mb-1">✅ {getTranslation(appLanguage, 'chatbot.imageVoice.goodImages')}</p>
              <ul className="text-xs space-y-1">
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.goodImage1')}</li>
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.goodImage2')}</li>
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.goodImage3')}</li>
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.goodImage4')}</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">❌ {getTranslation(appLanguage, 'chatbot.imageVoice.avoidTitle')}</p>
              <ul className="text-xs space-y-1">
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.avoid1')}</li>
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.avoid2')}</li>
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.avoid3')}</li>
                <li>• {getTranslation(appLanguage, 'chatbot.imageVoice.avoid4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-orange-800 text-sm font-medium">{getTranslation(appLanguage, 'chatbot.imageVoice.medicalDisclaimer')}</p>
              <p className="text-orange-700 text-xs">
                {getTranslation(appLanguage, 'chatbot.imageVoice.disclaimerFull')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageVoiceBot;