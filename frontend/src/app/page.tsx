'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Flame, User, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f8f5ed] text-[#17263a] flex items-center justify-center px-4 py-10 font-sans selection:bg-amber-500/30 selection:text-amber-900">
      <div className="w-full max-w-md min-w-0 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-6 md:p-8 flex flex-col">

        {/* Brand Header — same logo as the dashboard sidebar */}
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-b-4 border-orange-600/40 bg-gradient-to-tr from-orange-500 to-amber-300 text-white"><Flame className="h-6 w-6 fill-white" /></span>
            <span className="text-3xl font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span>
          </div>
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            Structured Thinking-First DSA Arena
          </p>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className={isLogin ? 'space-y-5' : 'space-y-4'}>
          {errorMsg && (
            <div className="rounded-2xl border-2 border-b-4 border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700 break-words">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Email Address</label>
            <div className="relative min-w-0">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@patternforge.com"
                className="w-full min-w-0 rounded-xl border-2 border-[#e8e1d3] bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 placeholder-slate-300 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Password</label>
            <div className="relative min-w-0">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full min-w-0 rounded-xl border-2 border-[#e8e1d3] bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 placeholder-slate-300 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Registration fields fallback */}
          {!isLogin && (
            <div className="min-w-0 space-y-3.5 rounded-2xl border-2 border-[#eee7da] bg-[#fff8e9] p-3.5">
              <div className="min-w-0 space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9b5416] block">Target Companies</label>
                <div className="relative min-w-0">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={targetCompanies}
                    onChange={(e) => setTargetCompanies(e.target.value)}
                    placeholder="Google, Meta, Microsoft"
                    className="w-full min-w-0 rounded-xl border-2 border-[#f0e4c8] bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9b5416] block">Language</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full min-w-0 rounded-xl border-2 border-[#f0e4c8] bg-white px-2.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 cursor-pointer"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9b5416] block">Days to Interview</label>
                  <input
                    type="number"
                    value={daysToInterview}
                    onChange={(e) => setDaysToInterview(e.target.value)}
                    className="w-full min-w-0 rounded-xl border-2 border-[#f0e4c8] bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl border-2 border-b-4 border-amber-600/70 bg-gradient-to-r from-amber-500 to-amber-400 py-3 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wide text-slate-950 transition-all active:translate-y-[2px] active:border-b-2 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 disabled:active:translate-y-0"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            {!isLoading && <ArrowRight className="w-4 h-4 shrink-0" />}
          </button>
        </form>

        {/* Form Toggle */}
        <div className="text-center mt-6 text-xs font-bold text-slate-500 border-t-2 border-[#eee7da] pt-5">
          {isLogin ? (
            <p>
              New to PatternForge?{' '}
              <button onClick={() => setIsLogin(false)} className="font-extrabold uppercase tracking-wide text-[#e67b1f] hover:text-[#c95f0c] hover:underline">
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)} className="font-extrabold uppercase tracking-wide text-[#e67b1f] hover:text-[#c95f0c] hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
