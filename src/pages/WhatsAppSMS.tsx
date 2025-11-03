import React, { useState, useEffect } from 'react';
import { MessageCircle, Smartphone, Send, Shield, Zap, Globe, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { API_BASE as API_BASE_URL } from '../services/config';

const WhatsAppSMS = () => {
  const { language } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  

  // QR feature removed
  useEffect(() => {}, []);

  const handleSMSSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/sms/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          language,
          services: ['health_alerts', 'vaccination_reminders', 'health_tips']
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubscribed(true);
        setTimeout(() => setIsSubscribed(false), 5000);
        setPhoneNumber('');
      } else {
        setErrorMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error: any) {
      console.error('SMS subscription error:', error);
      setErrorMessage('Unable to connect to server. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Smartphone,
      titleKey: 'whatsapp.feature.basicPhones',
      descKey: 'whatsapp.feature.basicPhonesDesc',
      color: 'blue'
    },
    {
      icon: MessageCircle,
      titleKey: 'whatsapp.feature.integration',
      descKey: 'whatsapp.feature.integrationDesc',
      color: 'green'
    },
    {
      icon: Globe,
      titleKey: 'whatsapp.feature.multilingual',
      descKey: 'whatsapp.feature.multilingualDesc',
      color: 'purple'
    },
    {
      icon: Shield,
      titleKey: 'whatsapp.feature.privacy',
      descKey: 'whatsapp.feature.privacyDesc',
      color: 'red'
    }
  ];

  const smsServices = [
    'whatsapp.service.vaccinationReminders',
    'whatsapp.service.outbreakAlerts',
    'whatsapp.service.healthTips',
    'whatsapp.service.emergencyAdvisories',
    'whatsapp.service.medicationReminders',
    'whatsapp.service.appointmentNotifications'
  ];

  const whatsappServices = [
    'whatsapp.service.interactiveChatbots',
    'whatsapp.service.imageConsultations',
    'whatsapp.service.voiceMessages',
    'whatsapp.service.documentSharing',
    'whatsapp.service.groupCampaigns',
    'whatsapp.service.personalizedPlans'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <MessageCircle className="h-16 w-16 mx-auto mb-6 text-green-200" />
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {getTranslation(language, 'whatsapp.title')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
                {getTranslation(language, 'whatsapp.subtitle')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {getTranslation(language, 'whatsapp.features.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {getTranslation(language, 'whatsapp.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={
                  feature.color === 'blue' ? 'w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4' :
                  feature.color === 'green' ? 'w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4' :
                  feature.color === 'purple' ? 'w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4' :
                  feature.color === 'red' ? 'w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4' :
                  'w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4'
                }>
                  <feature.icon className={
                    feature.color === 'blue' ? 'h-6 w-6 text-blue-600' :
                    feature.color === 'green' ? 'h-6 w-6 text-green-600' :
                    feature.color === 'purple' ? 'h-6 w-6 text-purple-600' :
                    feature.color === 'red' ? 'h-6 w-6 text-red-600' :
                    'h-6 w-6 text-gray-600'
                  } />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {getTranslation(language, feature.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {getTranslation(language, feature.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Section (QR removed) */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {getTranslation(language, 'whatsapp.whatsapp.title')}
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                {getTranslation(language, 'whatsapp.whatsapp.subtitle')}
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900">{getTranslation(language, 'whatsapp.services.title')}:</h3>
                {whatsappServices.map((service, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{getTranslation(language, service)}</span>
                  </div>
                ))}
              </div>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const message = "Hello HealthPredict AI! I want to start using your health services. Please help me get started with:\n\n1. General health guidance\n2. Mental health support\n3. Image analysis for medical concerns\n4. Vaccination reminders\n5. Health outbreak alerts\n\nThank you!";
                  // Use your WhatsApp number
                  const whatsappUrl = `https://wa.me/918527870864?text=${encodeURIComponent(message)}`;
                  
                  window.open(whatsappUrl, '_blank');
                }}
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MessageCircle className="mr-3 h-6 w-6" />
                {getTranslation(language, 'whatsapp.startChat')}
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SMS Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-blue-600 text-white rounded-3xl p-8"
            >
              <div className="text-center">
                <Smartphone className="h-16 w-16 mx-auto mb-6 text-blue-200" />
                <h3 className="text-2xl font-bold mb-4">{getTranslation(language, 'whatsapp.basicPhones')}</h3>
                <p className="text-blue-100 mb-6">
                  {getTranslation(language, 'whatsapp.noInternet')}
                </p>
                
                <div className="bg-blue-700 rounded-xl p-4 mb-6">
                  <p className="text-blue-100 text-sm mb-2">{getTranslation(language, 'whatsapp.sampleSMS')}</p>
                  <div className="bg-white text-gray-900 rounded p-3 text-sm">
                    "{getTranslation(language, 'whatsapp.sampleMessage')}"
                  </div>
                </div>

                <div className="text-left">
                  <h4 className="font-semibold mb-3">{getTranslation(language, 'whatsapp.servicesInclude')}</h4>
                  <div className="space-y-2">
                    {smsServices.map((service, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-blue-200 flex-shrink-0" />
                        <span className="text-blue-100 text-sm">{getTranslation(language, service)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {getTranslation(language, 'whatsapp.sms.title')}
              </h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                {getTranslation(language, 'whatsapp.sms.subtitle')}
              </p>

              <form onSubmit={handleSMSSubscription} className="space-y-6">
                <div>
                  <label htmlFor="sms-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {getTranslation(language, 'vaccination.alerts.phone')}
                  </label>
                  <input
                    type="tel"
                    id="sms-phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="consent"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600">
                    {getTranslation(language, 'whatsapp.consent.label')}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {getTranslation(language, 'whatsapp.subscribing')}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      {getTranslation(language, 'whatsapp.subscribe')}
                    </>
                  )}
                </button>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <span className="text-red-800 text-sm">{errorMessage}</span>
                  </motion.div>
                )}

                {isSubscribed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">
                      {getTranslation(language, 'whatsapp.subscribed')}
                    </span>
                  </motion.div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Info Card Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl p-8 text-center"
          >
            <Smartphone className="h-16 w-16 mx-auto mb-6 text-orange-100" />
            <h2 className="text-3xl font-bold mb-4">
              {getTranslation(language, 'whatsapp.info.title')}
            </h2>
            <p className="text-xl mb-6 text-orange-100 leading-relaxed">
              {getTranslation(language, 'whatsapp.info.subtitle')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/20 rounded-xl p-4">
                <h3 className="font-semibold mb-2">{getTranslation(language, 'whatsapp.info.basicSupport')}</h3>
                <p className="text-orange-100 text-sm">{getTranslation(language, 'whatsapp.info.basicSupportDesc')}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <h3 className="font-semibold mb-2">{getTranslation(language, 'whatsapp.info.regionalLanguages')}</h3>
                <p className="text-orange-100 text-sm">{getTranslation(language, 'whatsapp.info.regionalLanguagesDesc')}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <h3 className="font-semibold mb-2">{getTranslation(language, 'whatsapp.info.privacy')}</h3>
                <p className="text-orange-100 text-sm">{getTranslation(language, 'whatsapp.info.privacyDesc')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default WhatsAppSMS;