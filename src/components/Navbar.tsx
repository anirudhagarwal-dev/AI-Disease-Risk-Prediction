import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, User, Heart, MessageSquare, Shield, Phone, AlertTriangle, LayoutDashboard, Bell, Stethoscope, Info, Mail, Grid } from 'lucide-react';
import LoginModal from './LoginModal';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown } from 'lucide-react';
import { getTranslation, languageNames } from '../utils/translations';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const location = useLocation();
  const servicesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
      if (isUserMenuOpen && !(event.target as HTMLElement).closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Main navigation items (always visible) - with icons
  const mainNavigationFirst = [
    { name: 'nav.diseaseRisk', href: '/disease-risk-prediction', icon: AlertTriangle },
    { name: 'nav.patientDashboard', href: '/patient-dashboard', icon: LayoutDashboard },
    { name: 'nav.clinicianAlerts', href: '/clinician-alerts', icon: Bell },
  ];

  const mainNavigationLast = [
    { name: 'nav.about', href: '/about', icon: Info },
    { name: 'nav.contact', href: '/contact', icon: Mail },
  ];

  // Services dropdown items
  const servicesItems = [
    { name: 'nav.findDoctors', href: '/find-doctors', icon: Stethoscope },
    { name: 'nav.chatbots', href: '/chatbots', icon: MessageSquare },
    { name: 'nav.vaccination', href: '/vaccination', icon: Shield },
    { name: 'nav.whatsapp', href: '/whatsapp-sms', icon: Phone },
  ];

  const languageOptions: Array<{ code: Language; name: string }> = [
    { code: 'en', name: languageNames.en },
    { code: 'hi', name: languageNames.hi },
    { code: 'bn', name: languageNames.bn },
    { code: 'ta', name: languageNames.ta },
    { code: 'te', name: languageNames.te },
    { code: 'gu', name: languageNames.gu },
    { code: 'kn', name: languageNames.kn },
    { code: 'ml', name: languageNames.ml },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isServicesActive = servicesItems.some(item => location.pathname === item.href);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50" key={language}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-16 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1.5 hover:opacity-80 transition-opacity flex-shrink-0 ml-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HealthPredict AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center ml-4">
            {/* First navigation items with icons */}
            {mainNavigationFirst.map((item) => {
              const Icon = item.icon;
              const translatedText = getTranslation(language, item.name);
              return (
                <Link
                  key={`${item.name}-${language}`}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span key={`${item.name}-text-${language}`}>{translatedText}</span>
                </Link>
              );
            })}

            {/* Services Dropdown */}
            <div className="relative" ref={servicesRef}>
              <button
                onClick={() => {
                  setIsServicesOpen(!isServicesOpen);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                  isServicesActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Grid className="h-4 w-4" />
                <span>{getTranslation(language, 'nav.services')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {isServicesOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  {servicesItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsServicesOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{getTranslation(language, item.name)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Last navigation items with icons */}
            {mainNavigationLast.map((item) => {
              const Icon = item.icon;
              const translatedText = getTranslation(language, item.name);
              return (
                <Link
                  key={`${item.name}-${language}`}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span key={`${item.name}-text-${language}`}>{translatedText}</span>
                </Link>
              );
            })}

          </div>

          {/* Right side controls */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0 ml-2">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languageOptions.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Auth Area */}
            {isAuthenticated ? (
              <div className="relative user-menu">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsServicesOpen(false);
                  }}
                  className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  title={user?.email || 'User menu'}
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {(user as any)?.name || user?.email?.split('@')[0] || 'User'}
                  </span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                    <div className="pb-3 mb-3 border-b">
                      <div className="text-sm font-semibold">{getTranslation(language, 'common.signedIn')}</div>
                      <div className="text-sm text-gray-600 break-all">{user?.email}</div>
                    </div>
                    <Link to="/patient-dashboard" onClick={() => setIsUserMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm mb-1">{getTranslation(language, 'nav.patientDashboard')}</Link>
                    <Link to="/disease-risk-prediction" onClick={() => setIsUserMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm mb-1">{getTranslation(language, 'nav.diseaseRisk')}</Link>
                    <button onClick={logout} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm">{getTranslation(language, 'common.logout')}</button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>{getTranslation(language, 'common.login')}</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* First Navigation Items */}
            {mainNavigationFirst.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{getTranslation(language, item.name)}</span>
                </Link>
              );
            })}

            {/* Services Section */}
            <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Grid className="h-4 w-4" />
                <span>{getTranslation(language, 'nav.services')}</span>
              </div>
              {servicesItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors mb-1 ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{getTranslation(language, item.name)}</span>
                  </Link>
                );
              })}
            </div>

            {/* Last Navigation Items */}
            {mainNavigationLast.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{getTranslation(language, item.name)}</span>
                </Link>
              );
            })}
            
            <div className="px-3 py-2 space-y-3 border-t border-gray-200 mt-2 pt-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full appearance-none bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languageOptions.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="font-semibold">{getTranslation(language, 'common.signedIn')}</div>
                    <div className="text-gray-600 break-all">{user?.email}</div>
                  </div>
                  <button onClick={logout} className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">{getTranslation(language, 'common.logout')}</button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{getTranslation(language, 'common.login')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;