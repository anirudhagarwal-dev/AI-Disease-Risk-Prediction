import { MessageCircle, Brain, Mic, ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

const Chatbots = () => {
  const { language } = useLanguage();
  const chatbots = [
    {
      id: 1,
      icon: MessageCircle,
      titleKey: 'chatbot.general',
      emoji: '🩺',
      descKey: 'chatbot.general.desc',
      featureKeys: [
        'chatbot.general.feature1',
        'chatbot.general.feature2',
        'chatbot.general.feature3',
        'chatbot.general.feature4'
      ],
      deployUrl: '/general-health-bot',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      icon: Brain,
      titleKey: 'chatbot.mental',
      emoji: '🧠',
      descKey: 'chatbot.mental.desc',
      featureKeys: [
        'chatbot.mental.feature1',
        'chatbot.mental.feature2',
        'chatbot.mental.feature3',
        'chatbot.mental.feature4'
      ],
      deployUrl: '/mental-health-bot',
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 3,
      icon: Mic,
      titleKey: 'chatbot.imageVoice',
      emoji: '🎤🖼️',
      descKey: 'chatbot.imageVoice.desc',
      featureKeys: [
        'chatbot.imageVoice.feature1',
        'chatbot.imageVoice.feature2',
        'chatbot.imageVoice.feature3',
        'chatbot.imageVoice.feature4'
      ],
      deployUrl: '/image-voice-bot',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  const commonFeatures = [
    {
      icon: Zap,
      titleKey: 'chatbot.aiResponses',
      descKey: 'chatbot.aiDesc'
    },
    {
      icon: Shield,
      titleKey: 'chatbot.securePrivate',
      descKey: 'chatbot.secureDesc'
    },
    {
      icon: Clock,
      titleKey: 'chatbot.alwaysAvailable',
      descKey: 'chatbot.availableDesc'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          border: 'hover:border-blue-300',
          button: 'bg-blue-600 hover:bg-blue-700',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'green':
        return {
          border: 'hover:border-green-300',
          button: 'bg-green-600 hover:bg-green-700',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800'
        };
      case 'purple':
        return {
          border: 'hover:border-purple-300',
          button: 'bg-purple-600 hover:bg-purple-700',
          icon: 'text-purple-600',
          badge: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          border: 'hover:border-blue-300',
          button: 'bg-blue-600 hover:bg-blue-700',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              {getTranslation(language, 'chatbot.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto"
            >
              {getTranslation(language, 'chatbot.subtitle')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Common Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {getTranslation(language, 'chatbot.whyUse')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {commonFeatures.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getTranslation(language, feature.titleKey)}
                </h3>
                <p className="text-gray-600">
                  {getTranslation(language, feature.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chatbots Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {chatbots.map((bot, index) => {
              const colors = getColorClasses(bot.color);
              
              return (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${colors.border} hover:shadow-xl transition-all duration-300 overflow-hidden`}
                >
                  <div className={`bg-gradient-to-r ${bot.gradient} p-8 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{bot.emoji}</div>
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{getTranslation(language, bot.titleKey)}</h3>
                          <div className="flex items-center space-x-2">
                            <bot.icon className="h-5 w-5" />
                            <span className="text-white/90">{getTranslation(language, 'chatbot.poweredByGemini')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        {getTranslation(language, 'chatbot.available247')}
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                      {getTranslation(language, bot.descKey)}
                    </p>

                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-4">{getTranslation(language, 'chatbot.keyFeatures')}:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bot.featureKeys.map((featureKey, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full bg-${bot.color}-500`}></div>
                            <span className="text-gray-700">{getTranslation(language, featureKey)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <a
                        href={bot.deployUrl}
                        className={`inline-flex items-center justify-center ${colors.button} text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg`}
                      >
                        {getTranslation(language, 'chatbot.useNow')}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            {getTranslation(language, 'chatbot.needHelp')}
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            {getTranslation(language, 'chatbot.helpDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              {getTranslation(language, 'chatbot.contactSupport')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a
              href="#faq"
              className="inline-flex items-center border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              {getTranslation(language, 'chatbot.viewFAQ')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Chatbots;