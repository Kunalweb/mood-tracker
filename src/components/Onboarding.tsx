import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Brain, Moon, Sun, Pill } from 'lucide-react';

interface OnboardingProps {
  onComplete: (user: any) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    has_mental_illness: false,
    mood_disorder: ''
  });
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const payload = event.data.payload;
        
        // Check if user already exists
        try {
          const res = await fetch(`/api/users/${payload.email}`);
          if (res.ok) {
            const existingUser = await res.json();
            onComplete(existingUser);
            return;
          }
        } catch (e) {
          // User doesn't exist, proceed to fill form
        }

        setFormData(prev => ({
          ...prev,
          name: payload.name,
          email: payload.email
        }));
        setIsGoogleAuth(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to initialize Google Sign In. Please check your configuration.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
        }),
      });
      const data = await response.json();
      if (data.id) {
        onComplete(data);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-20 p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
    >
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-200">
          <Brain className="w-8 h-8 text-white" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Welcome</h2>
      <p className="text-center text-slate-500 mb-8">Let's set up your mood tracker</p>
      
      {!isGoogleAuth && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue manually</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            readOnly={isGoogleAuth}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            readOnly={isGoogleAuth}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
          <input
            type="number"
            required
            min="1"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={formData.age}
            onChange={e => setFormData({...formData, age: e.target.value})}
          />
        </div>

        <div className="flex items-center space-x-3 py-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            id="mental_illness"
            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            checked={formData.has_mental_illness}
            onChange={e => setFormData({...formData, has_mental_illness: e.target.checked})}
          />
          <label htmlFor="mental_illness" className="text-sm font-medium text-slate-700 cursor-pointer">
            Do you have a mental illness?
          </label>
        </div>

        {formData.has_mental_illness && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <label className="block text-sm font-medium text-slate-700 mb-1">Which mood disorder?</label>
            <select
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={formData.mood_disorder}
              onChange={e => setFormData({...formData, mood_disorder: e.target.value})}
            >
              <option value="">Select a disorder</option>
              <option value="Depression">Major Depressive Disorder</option>
              <option value="Bipolar">Bipolar Disorder</option>
              <option value="Anxiety">Anxiety Disorder</option>
              <option value="Other">Other</option>
            </select>
          </motion.div>
        )}

        <button
          type="submit"
          className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 mt-6"
        >
          {isGoogleAuth ? 'Complete Setup' : 'Get Started'}
        </button>
      </form>
    </motion.div>
  );
}
