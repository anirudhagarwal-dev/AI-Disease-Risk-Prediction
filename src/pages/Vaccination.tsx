import React, { useState } from 'react';
import { Shield, Calendar, Bell, Search, AlertTriangle, CheckCircle, Clock, Smartphone, MessageCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { API_BASE } from '../services/config';

const Vaccination = () => {
  const { language } = useLanguage();
  const [aadhaarId, setAadhaarId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSearching(false);
    setShowResults(true);
  };

  const mockVaccinationData = {
    name: "Rajesh Kumar",
    aadhaar: "XXXX-XXXX-1234",
    age: 35,
    completed: [
      { vaccine: "COVID-19 (Dose 1)", date: "2021-06-15", center: "PHC Bangalore" },
      { vaccine: "COVID-19 (Dose 2)", date: "2021-09-20", center: "PHC Bangalore" },
      { vaccine: "COVID-19 Booster", date: "2022-03-10", center: "CHC Delhi" }
    ],
    upcoming: [
      { vaccine: "Annual Flu Shot", dueDate: "2025-02-15", center: "Recommended" },
      { vaccine: "Hepatitis B Booster", dueDate: "2025-06-20", center: "To be scheduled" }
    ]
  };

  const getOutbreakAlerts = () => [
    {
      id: 1,
      type: "warning",
      title: getTranslation(language, 'vaccination.alert.dengue.title'),
      description: getTranslation(language, 'vaccination.alert.dengue.desc'),
      date: "2025-01-15",
      severity: "Medium",
      severityKey: 'vaccination.priority.medium'
    },
    {
      id: 2,
      type: "info",
      title: getTranslation(language, 'vaccination.alert.flu.title'),
      description: getTranslation(language, 'vaccination.alert.flu.desc'),
      date: "2025-01-10",
      severity: "Low",
      severityKey: 'vaccination.priority.low'
    },
    {
      id: 3,
      type: "error",
      title: getTranslation(language, 'vaccination.alert.covid.title'),
      description: getTranslation(language, 'vaccination.alert.covid.desc'),
      date: "2025-01-12",
      severity: "High",
      severityKey: 'vaccination.priority.high'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'border-red-200 bg-red-50';
      case 'Medium': return 'border-yellow-200 bg-yellow-50';
      case 'Low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'Medium': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Low': return <Bell className="h-5 w-5 text-blue-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleSMSSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/sms/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          language,
          services: ['vaccination_reminders', 'health_alerts', 'vaccination_drive_alerts']
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubscribed(true);
        setSuccessMessage(getTranslation(language, 'vaccination.alerts.success'));
        setPhoneNumber('');
        setTimeout(() => {
          setIsSubscribed(false);
          setSuccessMessage('');
        }, 8000);
      } else {
        setErrorMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error: any) {
      console.error('SMS subscription error:', error);
      setErrorMessage(`Unable to connect to server.\n\nTo start the backend:\n1. Open a terminal in the project root\n2. Run: cd server && node server-simple.cjs\n\nOr double-click: start-backend.bat`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppAlert = () => {
    if (!phoneNumber.trim()) {
      setErrorMessage(getTranslation(language, 'vaccination.alerts.enterPhone'));
      return;
    }

    const message = `Hello HealthPredict AI! I want to subscribe to vaccination reminders and health alerts. Please send me notifications for:\n\n1. Vaccination reminders and due dates\n2. Vaccination drive announcements\n3. Health outbreak alerts\n4. Important vaccination updates\n\nMy phone number: ${phoneNumber}\n\nThank you!`;
    const whatsappUrl = `https://wa.me/918527870864?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    setSuccessMessage(getTranslation(language, 'vaccination.alerts.whatsappSuccess'));
    setIsSubscribed(true);
    setTimeout(() => {
      setIsSubscribed(false);
      setSuccessMessage('');
    }, 5000);
  };

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
              <Shield className="h-16 w-16 mx-auto mb-6 text-green-200" />
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {getTranslation(language, 'vaccination.title')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
                {getTranslation(language, 'vaccination.subtitle')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vaccination Status Checker */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {getTranslation(language, 'vaccination.checkStatus')}
              </h2>
              <p className="text-gray-600">
                {getTranslation(language, 'vaccination.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="mb-6">
                <label htmlFor="aadhaar" className="block text-sm font-medium text-gray-700 mb-2">
                  {getTranslation(language, 'vaccination.aadhaarLabel')}
                </label>
                <input
                  type="text"
                  id="aadhaar"
                  value={aadhaarId}
                  onChange={(e) => setAadhaarId(e.target.value)}
                  placeholder={getTranslation(language, 'vaccination.aadhaarPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSearching || aadhaarId.length < 12}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    {getTranslation(language, 'vaccination.searching')}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    {getTranslation(language, 'vaccination.checkButton')}
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Vaccination Results */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Patient Info */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{getTranslation(language, 'vaccination.patientInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">{getTranslation(language, 'vaccination.name')}</span>
                    <p className="text-lg font-semibold text-gray-900">{mockVaccinationData.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">{getTranslation(language, 'vaccination.aadhaar')}</span>
                    <p className="text-lg font-semibold text-gray-900">{mockVaccinationData.aadhaar}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">{getTranslation(language, 'vaccination.age')}</span>
                    <p className="text-lg font-semibold text-gray-900">{mockVaccinationData.age} {getTranslation(language, 'vaccination.years')}</p>
                  </div>
                </div>
              </div>

              {/* Completed Vaccinations */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  {getTranslation(language, 'vaccination.completed')}
                </h3>
                <div className="space-y-4">
                  {mockVaccinationData.completed.map((vaccine, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{vaccine.vaccine}</h4>
                        <p className="text-sm text-gray-600">{vaccine.center}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{vaccine.date}</p>
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {getTranslation(language, 'vaccination.completedLabel')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Vaccinations */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  {getTranslation(language, 'vaccination.upcoming')}
                </h3>
                <div className="space-y-4">
                  {mockVaccinationData.upcoming.map((vaccine, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{vaccine.vaccine}</h4>
                        <p className="text-sm text-gray-600">{vaccine.center}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{vaccine.dueDate}</p>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {getTranslation(language, 'vaccination.dueSoon')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Outbreak Alerts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {getTranslation(language, 'vaccination.alerts.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {getTranslation(language, 'vaccination.alerts.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {getOutbreakAlerts().map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`border-l-4 rounded-lg p-6 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(alert.severity)}
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {getTranslation(language, alert.severityKey)} {getTranslation(language, 'vaccination.priority')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{alert.date}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {alert.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {alert.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Alert Subscription */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {getTranslation(language, 'vaccination.alerts.subscribe.title')}
            </h2>
            <p className="text-gray-300 text-lg">
              {getTranslation(language, 'vaccination.alerts.subscribe.subtitle')}
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8">
            <form onSubmit={handleSMSSubscription} className="max-w-md mx-auto">
              {/* Success Message */}
              {isSubscribed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-900/50 border border-green-600 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <p className="text-green-200 text-sm">
                      {successMessage || 'Successfully subscribed to SMS alerts!'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubscribed(false);
                      setSuccessMessage('');
                    }}
                    className="text-green-400 hover:text-green-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center flex-1">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-200 text-sm">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('')}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  {getTranslation(language, 'vaccination.alerts.phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={getTranslation(language, 'vaccination.alerts.phonePlaceholder')}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber.trim()}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      {getTranslation(language, 'vaccination.alerts.subscribing')}
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-5 w-5" />
                      {getTranslation(language, 'vaccination.alerts.sms')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppAlert}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {getTranslation(language, 'vaccination.alerts.whatsapp')}
                </button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-blue-900/50 rounded-lg">
              <p className="text-blue-200 text-sm text-center">
                🔒 {getTranslation(language, 'vaccination.alerts.privacy')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Vaccination;