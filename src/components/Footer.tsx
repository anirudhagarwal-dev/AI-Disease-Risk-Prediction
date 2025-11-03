import React from 'react';
import { Heart, Mail, Phone, Shield, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

const Footer = () => {
  const { language } = useLanguage();
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">HealthPredict AI</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              {getTranslation(language, 'footer.description')}
            </p>
            <div className="flex items-center space-x-2 text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {getTranslation(language, 'footer.disclaimer')}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{getTranslation(language, 'footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li><a href="/chatbots" className="text-gray-300 hover:text-white transition-colors">{getTranslation(language, 'nav.chatbots')}</a></li>
              <li><a href="/vaccination" className="text-gray-300 hover:text-white transition-colors">{getTranslation(language, 'nav.vaccination')}</a></li>
              <li><a href="/whatsapp-sms" className="text-gray-300 hover:text-white transition-colors">{getTranslation(language, 'nav.whatsapp')}</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">{getTranslation(language, 'nav.about')}</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{getTranslation(language, 'footer.contact')}</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300 text-sm">agarwal.anirudh2006@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300 text-sm">+91 8527870864</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-gray-300 text-sm">{getTranslation(language, 'footer.dataEncrypted')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              {getTranslation(language, 'common.copyright')}
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{getTranslation(language, 'footer.privacy')}</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{getTranslation(language, 'footer.terms')}</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{getTranslation(language, 'footer.accessibility')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;