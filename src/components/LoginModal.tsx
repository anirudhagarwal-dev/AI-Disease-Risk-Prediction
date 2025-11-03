import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { API_BASE } from '../services/config';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  // Fallback to provided client ID if env is missing, so the button is not blocked
  const GOOGLE_CLIENT_ID = (import.meta.env as any).VITE_GOOGLE_CLIENT_ID || '807419033377-n8pk7na0rkde16vhi0prdn6vhag445j4.apps.googleusercontent.com';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const { login, signup, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (isOpen && GOOGLE_CLIENT_ID && window.google) {
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (response.credential) {
            setIsLoading(true);
            try {
              // Decode JWT token client-side to get user info (works without backend)
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const userInfo = JSON.parse(jsonPayload);
              const userData = {
                id: userInfo.sub || `google_${userInfo.email}`,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
              };

              // Try backend first, fallback to client-side auth
              try {
                const res = await fetch(`${API_BASE}/api/auth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: response.credential })
                });
                if (res.ok) {
                  const data = await res.json();
                  await loginWithGoogle(data.token, data.user);
                  onClose();
                  return;
                }
              } catch (backendErr) {
                // Backend not available - use client-side auth
                console.log('Backend not available, using client-side auth');
              }

              // Client-side authentication (works without backend)
              await loginWithGoogle(`google_token_${userData.id}`, userData);
              onClose();
            } catch (err: any) {
              console.error('Google login error:', err);
              const errorMsg = err?.message || 'Failed to process Google sign-in';
              alert(`Failed to sign in with Google: ${errorMsg}`);
            } finally {
              setIsLoading(false);
            }
          }
        },
      });

      // Render Google Sign-In button
      if (googleButtonRef.current && !googleButtonRef.current.hasChildNodes()) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
        });
      }
    }
  }, [isOpen, GOOGLE_CLIENT_ID]);

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      return;
    }
    if (!window.google) {
      alert('Google Identity Services not loaded. Please refresh the page.');
      return;
    }
    // Trigger Google Sign-In popup
    window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          setIsLoading(true);
            try {
            // Get user info from Google
            const userRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`);
            if (!userRes.ok) throw new Error('Failed to fetch user info from Google');
            const userInfo = await userRes.json();
            
            const userData = {
              id: userInfo.id || `google_${userInfo.email}`,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture
            };

            // Try backend first, fallback to client-side auth
            try {
              const res = await fetch(`${API_BASE}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  email: userData.email,
                  name: userData.name,
                  picture: userData.picture,
                  access_token: tokenResponse.access_token
                })
              });
              if (res.ok) {
                const data = await res.json();
                await loginWithGoogle(data.token, data.user);
                onClose();
                return;
              }
            } catch (backendErr) {
              // Backend not available - use client-side auth
              console.log('Backend not available, using client-side auth');
            }

            // Client-side authentication (works without backend)
            await loginWithGoogle(`google_token_${userData.id}`, userData);
            onClose();
          } catch (err: any) {
            console.error('Google login error:', err);
            const errorMsg = err?.message || 'Failed to process Google sign-in';
            alert(`Failed to sign in with Google: ${errorMsg}`);
          } finally {
            setIsLoading(false);
          }
        } else if (tokenResponse.error) {
          console.error('Google OAuth error:', tokenResponse.error);
          alert(`Google authentication error: ${tokenResponse.error}`);
          setIsLoading(false);
        }
      },
    }).requestAccessToken();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const ok = await login(formData.email, formData.password);
    setIsLoading(false);
    if (ok) onClose();
  };

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpSent) {
      setIsLoading(true);
      // Simulate OTP sending
      setTimeout(() => {
        setIsLoading(false);
        setIsOtpSent(true);
      }, 2000);
    } else {
      setIsLoading(true);
      // Simulate OTP verification
      setTimeout(() => {
        setIsLoading(false);
        // Mock: create an account based on phone
        signup(`${formData.phone}@phone.local`, 'otp');
        onClose();
      }, 2000);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', phone: '', password: '', otp: '' });
    setIsOtpSent(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Welcome to HealthPredict AI</h2>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                Sign in to access personalized health features
              </p>
            </div>

            <div className="p-6">
              {/* Google Login Button */}
              {GOOGLE_CLIENT_ID && window.google ? (
                <div ref={googleButtonRef} className="mb-6"></div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-2"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>
              )}

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Login Method Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => {
                    setLoginMethod('email');
                    resetForm();
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                    loginMethod === 'email'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </button>
                <button
                  onClick={() => {
                    setLoginMethod('phone');
                    resetForm();
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                    loginMethod === 'phone'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </button>
              </div>

              {/* Email Login Form */}
              {loginMethod === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      'Sign in with Email'
                    )}
                  </button>
                </form>
              )}

              {/* Phone Login Form */}
              {loginMethod === 'phone' && (
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isOtpSent}
                    />
                  </div>

                  {isOtpSent && (
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        id="otp"
                        name="otp"
                        value={formData.otp}
                        onChange={handleInputChange}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={6}
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        OTP sent to {formData.phone}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        {isOtpSent ? getTranslation(language, 'common.verifying') : getTranslation(language, 'common.sendingOTP')}
                      </>
                    ) : (
                      isOtpSent ? getTranslation(language, 'common.verifyOTP') : getTranslation(language, 'common.sendOTP')
                    )}
                  </button>

                  {isOtpSent && (
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      className="w-full text-blue-600 py-2 text-sm font-medium hover:text-blue-700 transition-colors"
                    >
                      {getTranslation(language, 'common.changePhone')}
                    </button>
                  )}
                </form>
              )}

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  {getTranslation(language, 'common.agreeTerms')}{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">{getTranslation(language, 'footer.terms')}</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">{getTranslation(language, 'footer.privacy')}</a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;