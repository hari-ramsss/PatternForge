'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame,
  AlertTriangle,
  Brain,
  ArrowLeft,
  RefreshCw,
  Award,
  BookOpen,
  Zap,
} from 'lucide-react';

interface MistakeData {
  totalSubmissionsAnalyzed: number;
  mistakeCategories: Record<string, number>;
  recentVerdictHistory: Array<{ company: string; verdict: string; score: number; date: string }>;
}

export default function MistakesDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MistakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setApiError(false);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setApiError(true);
          return;
        }
        const res = await fetch(`${apiUrl}/mistakes/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setApiError(true);
          return;
        }
        const result = await res.json();
        setData(result);
      } catch {
        setApiError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiUrl]);

  return (
    <div className="h-screen overflow-hidden bg-[#f8f5ed] text-[#17263a] font-sans selection:bg-amber-500/30 selection:text-amber-900">
      <div className="flex h-full">
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r-2 border-[#e8e1d3] bg-[#fffdf8] p-6 lg:flex">
          <div className="space-y-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2.5 px-1 text-left"><span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-b-4 border-orange-600/40 bg-gradient-to-tr from-orange-500 to-amber-300 text-white"><Flame className="h-5 w-5 fill-white" /></span><span className="text-xl font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span></button>
            <nav className="space-y-1.5">
              <button onClick={() => router.push('/dashboard')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><ArrowLeft className="h-4 w-4 text-slate-400" /><span>Journey</span></button>
              <button onClick={() => router.push('/library')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><BookOpen className="h-4 w-4 text-slate-400" /><span>Pattern Library</span></button>
              <button onClick={() => router.push('/interview-arena')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><Zap className="h-4 w-4 text-slate-400" /><span>Practice</span></button>
              <button className="relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#9b5416]"><span className="absolute inset-0 rounded-2xl border-2 border-b-4 border-[#f0cd7a] bg-[#fff0c9]" /><Brain className="relative z-10 h-4 w-4 text-[#e67b1f]" /><span className="relative z-10">Insights</span></button>
            </nav>
          </div>
          <div className="space-y-3.5"><div className="space-y-3 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-white p-4"><div className="flex items-center justify-between text-xs font-semibold text-slate-700"><span className="flex items-center gap-2"><Flame className="h-4 w-4 fill-amber-500 text-amber-500" />7 Day Streak</span><span className="rounded-full border-2 border-[#f6d89b] bg-[#fff1d5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c56a17]">Active</span></div><div className="flex items-center justify-between border-t-2 border-[#eee7da] pt-2.5 text-xs text-slate-500"><span>Focus area</span><span className="font-mono text-sm font-bold text-[#d97717]">Insights</span></div></div><div className="flex items-center justify-between rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-white p-2.5"><div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-full border-2 border-b-4 border-amber-600/50 bg-gradient-to-tr from-amber-500 to-amber-300 text-xs font-black text-slate-950">P</div><span className="text-xs font-bold text-slate-700">Pattern learner</span></div><span className="h-2 w-2 rounded-full bg-emerald-400" /></div></div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between border-b-2 border-[#e8e1d3] bg-[#fffdf8]/90 px-5 py-4 backdrop-blur-xl sm:px-8"><div><h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-[#17263a]"><Brain className="h-5 w-5 text-[#e67b1f]" />Mistake Intelligence</h1><p className="text-xs font-medium text-slate-400">Turn failed attempts into a sharper practice plan</p></div><button onClick={() => router.push('/interview-arena')} className="hidden items-center gap-1.5 rounded-2xl border-2 border-b-4 border-amber-600/70 bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-950 transition-all active:translate-y-[2px] active:border-b-2 sm:flex"><Award className="h-4 w-4" />Launch Assessment</button></header>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-16 pt-5 sm:px-8 sm:pt-7">
            {/* Banner */}
            <div className="mx-auto max-w-5xl space-y-2 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-5">
              <h1 className="text-xl font-black tracking-tight text-[#17263a]">Telemetry & Mistake Intelligence</h1>
              <p className="max-w-xl text-xs leading-relaxed text-slate-500">
                Aggregates runtime execution errors, failed boundary test cases, and time-out events to diagnose your top algorithmic vulnerabilities.
              </p>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-amber-600 w-8 h-8" />
                <p className="text-sm font-serif text-stone-500">Analyzing telemetry logs...</p>
              </div>
            ) : apiError ? (
              <div className="space-y-3 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-white p-8 text-center text-xs text-slate-500">
                <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
                <h3 className="text-base font-black text-[#17263a]">Analytics are temporarily unavailable</h3>
                <p>Start the backend API and try again to load your mistake intelligence.</p>
                <button onClick={() => window.location.reload()} className="rounded-xl border-2 border-b-4 border-[#0b1524] bg-[#17263a] px-4 py-2 text-xs font-bold text-amber-300 transition-all active:translate-y-[2px] active:border-b-2">Retry analytics</button>
              </div>
            ) : !data ? (
              <div className="mx-auto max-w-5xl rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-8 text-center text-xs text-slate-500">
                No mistake telemetry logged yet. Complete practice drills or Online Assessments to generate analytics!
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top Frequency Breakdown Cards */}
                <div className="space-y-3">
                  <h3 className="text-base font-black tracking-tight text-[#17263a]">Vulnerability Distribution</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(data.mistakeCategories).map(([category, count], idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-4"
                      >
                        <div className="space-y-1">
                          <span className="block text-sm font-black text-[#17263a]">{category}</span>
                          <span className="text-[11px] text-slate-500">Recorded {count} occurrences across sessions</span>
                        </div>
                        <span className="rounded-lg border-2 border-[#f6d89b] bg-[#fff1d5] px-3 py-1 text-xs font-mono font-bold text-[#a85b17]">
                          {count} Errors
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corporate Assessment History */}
                <div className="rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-5 font-sans">
                  <h3 className="border-b-2 border-[#eee7da] pb-2 text-base font-black text-[#17263a]">
                    Recent Corporate Online Assessment History
                  </h3>

                  <div className="space-y-3">
                    {data.recentVerdictHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl border-2 border-[#e8e1d3] bg-[#f8f5ed] p-3.5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-amber-600" />
                          <div>
                            <strong className="block text-sm font-black text-[#17263a]">{item.company} Online Assessment</strong>
                            <span className="text-[11px] text-slate-500">{item.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-700">{item.score}/100</span>
                          <span
                            className={`px-3 py-1 rounded-full font-serif text-xs font-bold uppercase tracking-wider ${item.verdict === 'STRONG HIRE'
                                ? 'bg-emerald-500 text-white'
                                : item.verdict === 'HIRE'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                          >
                            {item.verdict}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
