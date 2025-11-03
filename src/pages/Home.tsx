import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Brain, Mic, Globe, Shield, Bell, Smartphone, Users, TrendingUp, CheckCircle, MapPin, Activity, Heart, Cross } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

const Home = () => {
  const { language } = useLanguage();
  
  const chatbots = [
    {
      icon: MessageCircle,
      titleKey: 'chatbot.general',
      descKey: 'home.chatbot.general.desc',
      emoji: '🩺',
      link: '/general-health-bot'
    },
    {
      icon: Brain,
      titleKey: 'chatbot.mental', 
      descKey: 'home.chatbot.mental.desc',
      emoji: '🧠',
      link: '/mental-health-bot'
    },
    {
      icon: Mic,
      titleKey: 'chatbot.imageVoice',
      descKey: 'home.chatbot.imageVoice.desc',
      emoji: '🎤🖼️',
      link: '/image-voice-bot'
    }
  ];

  const features = [
    {
      icon: Globe,
      titleKey: 'home.feature.multilingual',
      descKey: 'home.feature.multilingualDesc'
    },
    {
      icon: Shield,
      titleKey: 'home.feature.govtDb',
      descKey: 'home.feature.govtDbDesc'
    },
    {
      icon: Bell,
      titleKey: 'home.feature.vaccination',
      descKey: 'home.feature.vaccinationDesc'
    },
    {
      icon: Smartphone,
      titleKey: 'home.feature.smsWhatsapp',
      descKey: 'home.feature.smsWhatsappDesc'
    }
  ];

  const stats = [
    { number: '80%', labelKey: 'home.stats.accuracy', icon: CheckCircle },
    { number: '20%', labelKey: 'home.stats.rural', icon: TrendingUp },
    { number: '8+', labelKey: 'home.stats.languages', icon: Globe },
    { number: '24/7', labelKey: 'home.stats.availability', icon: Bell }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              {getTranslation(language, 'home.hero.title')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl mb-4 text-blue-100 max-w-3xl mx-auto"
            >
              {getTranslation(language, 'home.hero.subtitle1')}
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg mb-8 text-blue-200 max-w-3xl mx-auto"
            >
              {getTranslation(language, 'home.hero.subtitle2')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/disease-risk-prediction"
                  className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {getTranslation(language, 'home.hero.cta1')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/patient-dashboard"
                  className="inline-flex items-center border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
                >
                  {getTranslation(language, 'home.hero.cta2')}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chatbots Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getTranslation(language, 'home.diseaseRisk.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {getTranslation(language, 'home.diseaseRisk.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Activity,
                titleKey: 'home.diseaseRisk.diabetes',
                descKey: 'home.diseaseRisk.diabetesDesc',
                emoji: '🩺',
                link: '/disease-risk-prediction'
              },
              {
                icon: Heart,
                titleKey: 'home.diseaseRisk.heartFailure',
                descKey: 'home.diseaseRisk.heartFailureDesc',
                emoji: '❤️',
                link: '/disease-risk-prediction'
              },
              {
                icon: Cross,
                titleKey: 'home.diseaseRisk.cancer',
                descKey: 'home.diseaseRisk.cancerDesc',
                emoji: '🔬',
                link: '/disease-risk-prediction'
              }
            ].map((bot, index) => (
              <motion.div
                key={bot.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 group hover:border-blue-300"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{bot.emoji}</div>
                  <bot.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {getTranslation(language, bot.titleKey)}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {getTranslation(language, bot.descKey)}
                  </p>
                  <Link
                    to={bot.link}
                    className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors group-hover:scale-105 transform duration-200"
                  >
                    {getTranslation(language, 'home.diseaseRisk.assessNow')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getTranslation(language, 'home.features.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {getTranslation(language, 'home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-blue-600" />
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

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {getTranslation(language, 'home.stats.title')}
            </h2>
            <p className="text-xl text-blue-100">
              {getTranslation(language, 'home.stats.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100">
                  {getTranslation(language, stat.labelKey)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {getTranslation(language, 'home.cta.title')}
          </h2>
          <p className="text-xl mb-8 text-green-100">
              {getTranslation(language, 'home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/chatbots"
              className="inline-flex items-center bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {getTranslation(language, 'home.cta.tryChatbots')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/find-doctors"
              className="inline-flex items-center border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              {getTranslation(language, 'home.cta.findDoctors')}
              <MapPin className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;