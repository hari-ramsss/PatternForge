'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  Volume2,
  ArrowLeft,
  BookOpen,
  Sparkles,
  RefreshCw,
  Building2,
} from 'lucide-react';

interface OaReportData {
  company: string;
  problemTitle: string;
  hiringVerdict: 'STRONG HIRE' | 'HIRE' | 'LEAN HIRE' | 'NEEDS PRACTICE';
  overallScore: number;
  accuracyScore: number;
  efficiencyScore: number;
  codeQualityScore: number;
  vocalScore: number;
  summaryFeedback: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  recommendedTopics: string[];
}

export default function OaReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<OaReportData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('last_oa_report');
      if (stored) {
        try {
          setReport(JSON.parse(stored));
        } catch (e) {
          // Ignore parse error
        }
      }
    }
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-sans text-stone-600">
        <div className="bg-white border border-[#EFECE6] p-8 rounded-2xl shadow-sm text-center space-y-4 max-w-sm">
          <Award className="w-10 h-10 text-amber-600 mx-auto animate-bounce" />
          <h3 className="font-serif text-lg font-bold text-stone-900">No Assessment Session Found</h3>
          <p className="text-xs text-stone-500">Launch a corporate assessment from the Technical Online Assessment Arena to generate an evaluation report.</p>
          <button
            onClick={() => router.push('/interview-arena')}
            className="w-full py-2.5 bg-stone-900 text-amber-400 font-bold rounded-xl text-xs uppercase tracking-wider"
          >
            Go to Assessment Arena
          </button>
        </div>
      </div>
    );
  }

  const getVerdictBadgeClass = (verdict: string) => {
    switch (verdict) {
      case 'STRONG HIRE':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'HIRE':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'LEAN HIRE':
        return 'bg-amber-500 text-white border-amber-600';
      default:
        return 'bg-rose-600 text-white border-rose-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900 pb-16">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#EFECE6] bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/interview-arena')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Arena</span>
          </button>
          <div className="h-4 w-px bg-stone-300"></div>
          <span className="font-serif text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span>Technical Evaluation Report Card</span>
          </span>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 rounded-xl text-xs font-bold transition shadow-xs"
        >
          Return to Dashboard
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        {/* Banner Hiring Decision Card */}
        <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-stone-500 font-mono">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>{report.company} Corporate Technical Online Assessment</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">{report.problemTitle}</h1>
            <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
              Automated AI candidate evaluation based on runtime correctness, Big-O efficiency curves, code cleanliness, and vocal reasoning transcript.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Hiring Decision Verdict</span>
            <span className={`px-4 py-2 rounded-2xl font-serif text-lg font-bold shadow-md uppercase tracking-wider border ${getVerdictBadgeClass(report.hiringVerdict)}`}>
              {report.hiringVerdict}
            </span>
            <span className="text-xs font-mono font-bold text-stone-700">Candidate Score: {report.overallScore}/100</span>
          </div>
        </div>

        {/* 4 Performance Metric Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] shadow-2xs space-y-1 text-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Accuracy Pass Rate</span>
            <span className="text-2xl font-mono font-bold text-emerald-600">{report.accuracyScore}%</span>
            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${report.accuracyScore}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] shadow-2xs space-y-1 text-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Big-O Efficiency</span>
            <span className="text-2xl font-mono font-bold text-amber-600">{report.efficiencyScore}%</span>
            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${report.efficiencyScore}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] shadow-2xs space-y-1 text-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Code Quality</span>
            <span className="text-2xl font-mono font-bold text-purple-600">{report.codeQualityScore}%</span>
            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${report.codeQualityScore}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] shadow-2xs space-y-1 text-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Vocal Communication</span>
            <span className="text-2xl font-mono font-bold text-blue-600">{report.vocalScore}%</span>
            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${report.vocalScore}%` }}></div>
            </div>
          </div>
        </div>

        {/* AI Summary Feedback Commentary */}
        <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-xs space-y-4 font-sans">
          <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">
            Detailed Evaluator Analysis
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed font-sans">{report.summaryFeedback}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Strengths */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Candidate Strengths
              </span>
              <ul className="space-y-1 text-xs text-emerald-900 font-sans list-disc list-inside">
                {report.keyStrengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Areas for Technical Growth
              </span>
              <ul className="space-y-1 text-xs text-amber-900 font-sans list-disc list-inside">
                {report.keyWeaknesses.map((weak, idx) => (
                  <li key={idx}>{weak}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actionable Recommended Practice Queue */}
        <div className="bg-stone-900 text-stone-200 border border-stone-800 rounded-2xl p-6 shadow-md space-y-3 font-sans">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-base font-bold text-white">Recommended Growth Modules</h3>
          </div>
          <p className="text-xs text-stone-400">
            Based on this assessment report, practice drills in these categories to elevate your rank for upcoming interviews:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {report.recommendedTopics.map((topic, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-stone-800 text-amber-400 border border-stone-700 rounded-xl text-xs font-semibold font-mono"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
