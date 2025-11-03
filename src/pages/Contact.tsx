import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, MapPin, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

const Contact = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    feedbackType: 'general'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      feedbackType: 'general'
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      titleKey: 'contact.emailUs',
      details: 'agarwal.anirudh2006@gmail.com',
      descKey: 'contact.emailDesc',
      action: 'mailto:agarwal.anirudh2006@gmail.com'
    },
    {
      icon: Phone,
      titleKey: 'contact.callUs',
      details: '+91 8527870864',
      descKey: 'contact.callDesc',
      action: 'tel:+918527870864'
    },
    {
      icon: MessageSquare,
      titleKey: 'contact.whatsapp',
      details: '+91 8527870864',
      descKey: 'contact.whatsappDesc',
      action: 'https://wa.me/918527870864'
    }
  ];

  const officeInfo = [
    {
      icon: MapPin,
      titleKey: 'contact.officeLocation',
      details: getTranslation(language, 'contact.office.address')
    },
    {
      icon: Clock,
      titleKey: 'contact.workingHours',
      details: getTranslation(language, 'contact.office.hours')
    }
  ];

  const feedbackTypes = [
    { value: 'general', labelKey: 'contact.feedback.general' },
    { value: 'bug', labelKey: 'contact.feedback.bug' },
    { value: 'feature', labelKey: 'contact.feedback.feature' },
    { value: 'improvement', labelKey: 'contact.feedback.improvement' },
    { value: 'partnership', labelKey: 'contact.feedback.partnership' },
    { value: 'technical', labelKey: 'contact.feedback.technical' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <MessageSquare className="h-16 w-16 mx-auto mb-6 text-blue-200" />
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {getTranslation(language, 'contact.title')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                {getTranslation(language, 'contact.subtitle')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {getTranslation(language, 'contact.sendMessage')}
                </h2>

                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">
                      {getTranslation(language, 'contact.success')}
                    </span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation(language, 'contact.name')} *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation(language, 'contact.email')} *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation(language, 'contact.feedbackType')}
                      </label>
                      <select
                        id="feedbackType"
                        name="feedbackType"
                        value={formData.feedbackType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {feedbackTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {getTranslation(language, type.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation(language, 'contact.subject')} *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      {getTranslation(language, 'contact.message')} *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder={getTranslation(language, 'contact.messagePlaceholder')}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {getTranslation(language, 'contact.send')}
                  </button>
                </form>
              </motion.div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {getTranslation(language, 'home.getInTouch')}
                </h3>
                
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <info.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {getTranslation(language, info.titleKey)}
                          </h4>
                          <p className="text-gray-600 mb-2">
                            {getTranslation(language, info.descKey)}
                          </p>
                          <a
                            href={info.action}
                            className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                            target={info.action.startsWith('http') ? '_blank' : '_self'}
                            rel={info.action.startsWith('http') ? 'noopener noreferrer' : ''}
                          >
                            {info.details}
                            {info.action.startsWith('http') && (
                              <ExternalLink className="ml-1 h-4 w-4" />
                            )}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  {officeInfo.map((info, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <info.icon className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">{getTranslation(language, info.titleKey)}:</span>
                        <span className="text-gray-600 ml-2">{info.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Form Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {getTranslation(language, 'contact.survey.title')}
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              {getTranslation(language, 'contact.survey.subtitle')}
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {getTranslation(language, 'contact.survey.topics')}
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      {getTranslation(language, 'contact.survey.topic.experience')}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      {getTranslation(language, 'contact.survey.topic.features')}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      {getTranslation(language, 'contact.survey.topic.languages')}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      {getTranslation(language, 'contact.survey.topic.accessibility')}
                    </li>
                  </ul>
                </div>
                
                <div>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSegY0P3LLsa7BRLRoU0-BjlxrMnOM01OKph7Jr1gjAOkjADzA/viewform?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    {getTranslation(language, 'contact.survey.button')}
                  </a>
                  <p className="text-sm text-gray-500 mt-4">
                    {getTranslation(language, 'contact.survey.time')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {getTranslation(language, 'contact.faq.title')}
            </h2>
            <p className="text-gray-600">
              {getTranslation(language, 'contact.faq.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {getTranslation(language, 'contact.faq.voice.title')}
              </h3>
              <p className="text-gray-600">
                {getTranslation(language, 'contact.faq.voice.answer')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {getTranslation(language, 'contact.faq.security.title')}
              </h3>
              <p className="text-gray-600">
                {getTranslation(language, 'contact.faq.security.answer')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {getTranslation(language, 'contact.faq.languages.title')}
              </h3>
              <p className="text-gray-600">
                {getTranslation(language, 'contact.faq.languages.answer')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;