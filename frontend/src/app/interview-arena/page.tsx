'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Mic,
  Play,
  ArrowLeft,
  Zap,
  Award,
  Lock,
  BookOpen,
  Brain,
  Flame,
} from 'lucide-react';

interface CorporateOa {
  id: string;
  company: string;
  logo: string;
  badgeColor: string;
  durationMinutes: number;
  drillsCount: number;
  description: string;
  targetProblemId: string;
  targetProblemTitle: string;
  vocalMandatory: boolean;
}

const CORPORATE_OAS: CorporateOa[] = [
  {
    id: 'google-oa',
    company: 'Google',
    logo: '🔍',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    durationMinutes: 45,
    drillsCount: 2,
    description: 'Strict algorithmic optimization assessment testing O(N) boundary invariants, memory allocations, and edge case guards.',
    targetProblemId: 'two-sum',
    targetProblemTitle: 'Single-Pass Complement Invariants',
    vocalMandatory: false,
  },
  {
    id: 'amazon-oa',
    company: 'Amazon',
    logo: '📦',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    durationMinutes: 45,
    drillsCount: 2,
    description: 'Technical evaluation & Leadership Principles reasoning. Spoken vocal thought process is evaluated.',
    targetProblemId: 'valid-anagram',
    targetProblemTitle: 'Frequency Map Balance Check',
    vocalMandatory: true,
  },
  {
    id: 'meta-oa',
    company: 'Meta',
    logo: '♾️',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    durationMinutes: 35,
    drillsCount: 2,
    description: 'High-speed coding sprint mode emphasizing rapid execution, clean syntax, and zero compilation mistakes.',
    targetProblemId: 'contains-duplicate',
    targetProblemTitle: 'Duplicate Detection Invariants',
    vocalMandatory: false,
  },
  {
    id: 'microsoft-oa',
    company: 'Microsoft',
    logo: '🪟',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    durationMinutes: 45,
    drillsCount: 2,
    description: 'Algorithmic design assessment covering prefix sums, arrays, and sliding window boundaries.',
    targetProblemId: 'subarray-sums-divisible-by-k',
    targetProblemTitle: 'Prefix Remainder Frequency Sweep',
    vocalMandatory: false,
  },
];

export default function InterviewArenaPage() {
  const router = useRouter();
  const [selectedOa, setSelectedOa] = useState<CorporateOa>(CORPORATE_OAS[0]);
  const [enableVoiceAi, setEnableVoiceAi] = useState(true);

  const handleStartAssessment = () => {
    // Navigate to workspace with OA parameters in query string
    const url = `/workspace/${selectedOa.targetProblemId}?oa=true&company=${encodeURIComponent(
      selectedOa.company
    )}&duration=${selectedOa.durationMinutes}&voice=${enableVoiceAi}`;
    router.push(url);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f8f5ed] text-[#17263a] font-sans selection:bg-amber-500/30 selection:text-amber-900">
      <div className="flex h-full">
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[#e8e1d3] bg-[#fffdf8] p-6 lg:flex">
          <div className="space-y-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2.5 px-1 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-300 text-white shadow-lg shadow-amber-500/20"><Flame className="h-5 w-5 fill-white" /></span>
              <span className="text-xl font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span>
            </button>
            <nav className="space-y-1.5">
              <button onClick={() => router.push('/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><ArrowLeft className="h-4 w-4 text-slate-400" /><span>Journey</span></button>
              <button onClick={() => router.push('/library')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><BookOpen className="h-4 w-4 text-slate-400" /><span>Pattern Library</span></button>
              <button className="relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-[#9b5416]"><span className="absolute inset-0 -z-0 rounded-xl border border-[#f7d786] bg-[#fff0c9] shadow-sm" /><Zap className="relative z-10 h-4 w-4 text-[#e67b1f]" /><span className="relative z-10">Practice</span></button>
              <button onClick={() => router.push('/mistakes')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><Brain className="h-4 w-4 text-slate-400" /><span>Insights</span></button>
            </nav>
          </div>
          <div className="space-y-3.5"><div className="space-y-3 rounded-2xl border border-[#e8e1d3] bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-xs font-semibold text-slate-700"><span className="flex items-center gap-2"><Flame className="h-4 w-4 fill-amber-500 text-amber-500" />7 Day Streak</span><span className="rounded-full border border-[#f6d89b] bg-[#fff1d5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c56a17]">Active</span></div><div className="flex items-center justify-between border-t border-[#eee7da] pt-2.5 text-xs text-slate-500"><span>Assessment mode</span><span className="font-mono text-sm font-bold text-[#d97717]">OA</span></div></div><div className="flex items-center justify-between rounded-2xl border border-[#e8e1d3] bg-white p-2.5"><div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-xs font-black text-slate-950">P</div><span className="text-xs font-bold text-slate-700">Pattern learner</span></div><span className="h-2 w-2 rounded-full bg-emerald-400" /></div></div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between border-b border-[#e8e1d3] bg-[#fffdf8]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div><h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-[#17263a]"><Building2 className="h-5 w-5 text-[#e67b1f]" />Interview Arena</h1><p className="text-xs font-medium text-slate-400">Practice under the pressure of a real technical screen</p></div>
            <button onClick={() => router.push('/dashboard')} className="hidden items-center gap-1.5 rounded-xl border border-[#e3d8c8] bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-[#fffaf0] sm:flex"><ArrowLeft className="h-4 w-4" />Dashboard</button>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-16 pt-5 sm:px-8 sm:pt-7">
            {/* Banner */}
            <div className="mx-auto max-w-5xl space-y-3 rounded-2xl border border-[#e8e1d3] bg-[#fffdf8] p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-600" />
                <h1 className="text-xl font-black tracking-tight text-[#17263a]">Company Technical Coding Assessments</h1>
              </div>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-500">
                Simulate realistic corporate Online Assessments (OAs). Hint locks, strict time constraints, and AI candidate report cards with hiring decision verdicts (*Strong Hire*, *Hire*, *Lean Hire*, *Needs Practice*).
              </p>
            </div>

            {/* Assessment Card Selectors */}
            <div className="mx-auto max-w-5xl space-y-4">
              <h3 className="text-base font-black tracking-tight text-[#17263a]">Select Corporate Assessment Environment</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CORPORATE_OAS.map((oa) => {
                  const isSelected = selectedOa.id === oa.id;

                  return (
                    <div
                      key={oa.id}
                      onClick={() => setSelectedOa(oa)}
                      className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${isSelected
                          ? 'bg-[#fffdf8] border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                          : 'bg-white border-[#e8e1d3] hover:border-[#d9cba8] shadow-sm'
                        }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{oa.logo}</span>
                            <h4 className="text-lg font-black tracking-tight text-[#17263a]">{oa.company} OA</h4>
                          </div>
                          <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${oa.badgeColor}`}>
                            {oa.durationMinutes} Min Test
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-500">{oa.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#eee7da] pt-3 text-[11px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-amber-600" /> Hints & Solutions Locked
                        </span>
                        {oa.vocalMandatory && (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <Mic className="w-3.5 h-3.5 text-amber-600" /> Voice AI Evaluation
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assessment Settings Box */}
            <div className="mx-auto max-w-5xl space-y-4 rounded-2xl border border-[#e8e1d3] bg-[#fffdf8] p-5 font-sans shadow-sm">
              <h3 className="border-b border-[#eee7da] pb-2 text-base font-black text-[#17263a]">
                Assessment Session Configurator ({selectedOa.company} OA)
              </h3>

              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <strong className="block font-bold text-[#17263a]">Enable Real-Time Vocal Reasoning (Voice AI)</strong>
                  <p className="text-[11px] text-slate-500">
                    Transcribes spoken explanations during coding and incorporates communication clarity into your AI Report Card score.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableVoiceAi}
                  onChange={(e) => setEnableVoiceAi(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStartAssessment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-300"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch {selectedOa.company} Technical Online Assessment ({selectedOa.durationMinutes} Min)</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
