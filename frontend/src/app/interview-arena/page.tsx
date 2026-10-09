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
import PatternForgeNavigation from '../../components/PatternForgeNavigation';

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
    description: 'Timed coding practice focused on efficient solutions, edge cases, and careful use of memory.',
    targetProblemId: 'two-sum',
    targetProblemTitle: 'Two Sum',
    vocalMandatory: false,
  },
  {
    id: 'amazon-oa',
    company: 'Amazon',
    logo: '📦',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    durationMinutes: 45,
    drillsCount: 2,
    description: 'Practice coding while explaining your approach, with questions inspired by Amazon interviews.',
    targetProblemId: 'valid-anagram',
    targetProblemTitle: 'Valid Anagram',
    vocalMandatory: true,
  },
  {
    id: 'meta-oa',
    company: 'Meta',
    logo: '♾️',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    durationMinutes: 35,
    drillsCount: 2,
    description: 'Fast-paced coding practice focused on clear solutions and thorough testing.',
    targetProblemId: 'contains-duplicate',
    targetProblemTitle: 'Contains Duplicate',
    vocalMandatory: false,
  },
  {
    id: 'microsoft-oa',
    company: 'Microsoft',
    logo: '🪟',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    durationMinutes: 45,
    drillsCount: 2,
    description: 'Practice array problems using prefix sums and sliding windows.',
    targetProblemId: 'subarray-sums-divisible-by-k',
    targetProblemTitle: 'Subarray Sums Divisible by K',
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
        <PatternForgeNavigation statusLabel="Practice mode" statusValue="Timed" />
        <aside className="hidden">
          <div className="space-y-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2.5 px-1 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-b-4 border-orange-600/40 bg-gradient-to-tr from-orange-500 to-amber-300 text-white"><Flame className="h-5 w-5 fill-white" /></span>
              <span className="text-xl font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span>
            </button>
            <nav className="space-y-1.5">
              <button onClick={() => router.push('/dashboard')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><ArrowLeft className="h-4 w-4 text-slate-400" /><span>Journey</span></button>
              <button onClick={() => router.push('/library')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><BookOpen className="h-4 w-4 text-slate-400" /><span>Pattern Library</span></button>
              <button className="relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#9b5416]"><span className="absolute inset-0 -z-0 rounded-2xl border-2 border-b-4 border-[#f0cd7a] bg-[#fff0c9]" /><Zap className="relative z-10 h-4 w-4 text-[#e67b1f]" /><span className="relative z-10">Practice</span></button>
              <button onClick={() => router.push('/mistakes')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><Brain className="h-4 w-4 text-slate-400" /><span>Insights</span></button>
            </nav>
          </div>
          <div className="space-y-3.5"><div className="space-y-3 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-white p-4"><div className="flex items-center justify-between text-xs font-semibold text-slate-700"><span className="flex items-center gap-2"><Flame className="h-4 w-4 fill-amber-500 text-amber-500" />7 Day Streak</span><span className="rounded-full border-2 border-[#f6d89b] bg-[#fff1d5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c56a17]">Active</span></div><div className="flex items-center justify-between border-t-2 border-[#eee7da] pt-2.5 text-xs text-slate-500"><span>Assessment mode</span><span className="font-mono text-sm font-bold text-[#d97717]">OA</span></div></div><div className="flex items-center justify-between rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-white p-2.5"><div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-full border-2 border-b-4 border-amber-600/50 bg-gradient-to-tr from-amber-500 to-amber-300 text-xs font-black text-slate-950">P</div><span className="text-xs font-bold text-slate-700">Pattern learner</span></div><span className="h-2 w-2 rounded-full bg-emerald-400" /></div></div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16 lg:pt-0">
          <header className="flex shrink-0 items-center justify-between border-b-2 border-[#e8e1d3] bg-[#fffdf8]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div><h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-[#17263a]"><Building2 className="h-5 w-5 text-[#e67b1f]" />Interview Practice</h1><p className="text-xs font-medium text-slate-400">Practice coding with a timer, like a real interview</p></div>
            <button onClick={() => router.push('/dashboard')} className="hidden items-center gap-1.5 rounded-2xl border-2 border-b-4 border-[#e3d8c8] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-700 transition-all hover:bg-[#fffaf0] active:translate-y-[2px] active:border-b-2 sm:flex"><ArrowLeft className="h-4 w-4" />Dashboard</button>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-16 pt-5 sm:px-8 sm:pt-7">
            {/* Banner */}
            <div className="mx-auto max-w-5xl space-y-3 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-5">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-600" />
                <h1 className="text-xl font-black tracking-tight text-[#17263a]">Company interview practice</h1>
              </div>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-500">
                Try timed coding assessments inspired by company interviews. Hints stay hidden while you solve; afterward, review feedback on your code and approach.
              </p>
            </div>

            {/* Assessment Card Selectors */}
            <div className="mx-auto max-w-5xl space-y-4">
              <h3 className="text-base font-black tracking-tight text-[#17263a]">Choose a company practice set</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CORPORATE_OAS.map((oa) => {
                  const isSelected = selectedOa.id === oa.id;

                  return (
                    <div
                      key={oa.id}
                      onClick={() => setSelectedOa(oa)}
                      className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${isSelected
                        ? 'bg-[#fffdf8] border-2 border-b-4 border-amber-500'
                        : 'bg-white border-2 border-b-4 border-[#e8e1d3] hover:border-[#d9cba8]'
                        }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{oa.logo}</span>
                            <h4 className="text-lg font-black tracking-tight text-[#17263a]">{oa.company} practice</h4>
                          </div>
                          <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${oa.badgeColor}`}>
                            {oa.durationMinutes} min
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-500">{oa.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t-2 border-[#eee7da] pt-3 text-[11px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-amber-600" /> Hints hidden during practice
                        </span>
                        {oa.vocalMandatory && (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <Mic className="w-3.5 h-3.5 text-amber-600" /> Explain your solution aloud
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
              <h3 className="border-b-2 border-[#eee7da] pb-2 text-base font-black text-[#17263a]">
                Assessment options for {selectedOa.company}
              </h3>

              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <strong className="block font-bold text-[#17263a]">Include spoken explanations</strong>
                  <p className="text-[11px] text-slate-500">
                    Your explanation is transcribed while you code and included with your feedback.
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-amber-600/70 bg-gradient-to-r from-amber-500 to-amber-400 py-3 text-sm font-black uppercase tracking-wider text-slate-950 transition-all hover:from-amber-400 hover:to-amber-300 active:translate-y-[2px] active:border-b-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start {selectedOa.company} practice ({selectedOa.durationMinutes} min)</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
