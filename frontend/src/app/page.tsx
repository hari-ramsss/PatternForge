'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Sparkles, Code, User, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration metadata parameters
  const [targetCompanies, setTargetCompanies] = useState('Google, Meta, Apple');
  const [preferredLanguage, setPreferredLanguage] = useState('python');
  const [daysToInterview, setDaysToInterview] = useState('90');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email, password }
        : { 
            email, 
            password, 
            targetCompanies: targetCompanies.split(',').map(s => s.trim()), 
            preferredLanguage, 
            daysToInterview: parseInt(daysToInterview) 
          };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store JWT token
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email || email);

      // Route directly to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error. Make sure the backend is online.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#EFECE6] shadow-xl shadow-stone-200/50 p-8 md:p-10 flex flex-col">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-600 mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">PatternForge AI</h2>
          <p className="text-stone-500 text-sm mt-1">Structured Thinking-First DSA Preparation Arena</p>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-600 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@patternforge.com"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-sm focus:bg-white focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-600 block">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-sm focus:bg-white focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          {/* Registration fields fallback */}
          {!isLogin && (
            <div className="space-y-4 pt-3 border-t border-stone-100">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-600 block">Target Companies (comma separated)</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={targetCompanies}
                    onChange={(e) => setTargetCompanies(e.target.value)}
                    placeholder="Google, Meta, Microsoft"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:bg-white focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-600 block">Preferred Language</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:bg-white focus:border-amber-500 outline-none transition cursor-pointer"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-600 block">Days to Interview</label>
                  <input
                    type="number"
                    value={daysToInterview}
                    onChange={(e) => setDaysToInterview(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:bg-white focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition flex items-center justify-center gap-2 text-sm mt-6"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Form Toggle */}
        <div className="text-center mt-6 text-xs text-stone-500 border-t border-stone-100 pt-5">
          {isLogin ? (
            <p>
              New to PatternForge?{' '}
              <button onClick={() => setIsLogin(false)} className="text-amber-700 font-semibold hover:underline">
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)} className="text-amber-700 font-semibold hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
