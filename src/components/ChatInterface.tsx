import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, User, Bot, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, ChatMessage as APIChatMessage } from '../services/googleAI';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
}

interface ChatInterfaceProps {
  systemPrompt: string;
  welcomeMessage: Message;
  placeholder?: string;
  botName?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  systemPrompt,
  welcomeMessage,
  placeholder = 'Type your message...',
  botName = 'AI Assistant',
}) => {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<APIChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef<boolean>(true);
  const isUserScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isListening, transcript, startListening, error: speechError } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  const scrollToBottom = (force = false) => {
    if (force || shouldAutoScrollRef.current) {
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          // Scroll the container itself, not the entire page
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const checkIfNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 150; // pixels from bottom
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < threshold;
    
    shouldAutoScrollRef.current = isNearBottom;
    return isNearBottom;
  };

  const handleScroll = () => {
    if (isUserScrollingRef.current) {
      checkIfNearBottom();
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set user scrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    }
  };

  const handleWheel = () => {
    isUserScrollingRef.current = true;
  };

  const handleTouchMove = () => {
    isUserScrollingRef.current = true;
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    // Check initial position
    checkIfNearBottom();
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMove);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Don't auto-scroll on every message change - only when explicitly needed
  // Auto-scroll is now only triggered in handleSendMessage

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    // Enable auto-scroll when user sends a message
    shouldAutoScrollRef.current = true;
    isUserScrollingRef.current = false;
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);
    // Scroll after user message is added
    setTimeout(() => scrollToBottom(true), 100);

    try {
      const fullPrompt = `${systemPrompt}\n\nUser: ${currentInput}`;
      const response = await sendChatMessage(fullPrompt, chatHistory);

      const newChatHistory: APIChatMessage[] = [
        ...chatHistory,
        { role: 'user', parts: [{ text: currentInput }] },
        { role: 'model', parts: [{ text: response }] },
      ];
      setChatHistory(newChatHistory);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        sources: ['Google Gemini AI'],
      };

      // Enable auto-scroll when bot responds
      shouldAutoScrollRef.current = true;
      isUserScrollingRef.current = false;
      setMessages((prev) => [...prev, botResponse]);
      // Scroll after message is added
      setTimeout(() => scrollToBottom(true), 200);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date(),
        sources: ['System Error'],
      };
      // Enable auto-scroll when error response is shown
      shouldAutoScrollRef.current = true;
      isUserScrollingRef.current = false;
      setMessages((prev) => [...prev, errorResponse]);
      // Scroll after message is added
      setTimeout(() => scrollToBottom(true), 200);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) return;
    startListening('en-US');
  };

  const handleTextToSpeech = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text, 'en-US');
    }
  };

  return (
    <div className="flex flex-col h-full">
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
              <div
                className={`flex items-start space-x-2 max-w-[85%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`rounded-2xl p-3 ${
                    message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <span className="text-xs text-gray-500">Sources: {message.sources.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {message.sender === 'bot' && (
                      <button
                        onClick={() => handleTextToSpeech(message.text)}
                        className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {isSpeaking ? (
                          <VolumeX className="h-3 w-3 text-gray-600" />
                        ) : (
                          <Volume2 className="h-3 w-3 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl p-3">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 text-gray-400 animate-spin" />
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        {speechError && (
          <div className="mb-2 text-xs text-red-600">
            {speechError}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={placeholder}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`absolute right-3 top-3 p-1 rounded-full transition-colors ${
                isListening ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
