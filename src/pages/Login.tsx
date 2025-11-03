import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = mode === 'login' ? await login(email, password) : await signup(email, password);
    if (!ok) setError('Invalid credentials or server unavailable');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-1">Welcome to HealthPredict AI</h1>
        <p className="text-sm text-gray-500 mb-6">{mode === 'login' ? 'Login to continue' : 'Create your account'}</p>

        <div className="flex space-x-2 mb-6">
          <button className={`flex-1 py-2 rounded ${mode==='login'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={() => setMode('login')}>Login</button>
          <button className={`flex-1 py-2 rounded ${mode==='signup'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="w-full border rounded px-3 py-2" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required className="w-full border rounded px-3 py-2" placeholder="********" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 font-semibold">{mode==='login'?'Login':'Create Account'}</button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;


