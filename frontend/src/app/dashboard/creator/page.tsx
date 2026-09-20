'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Sparkles, Send, BrainCircuit, Play, 
  RefreshCw, Cpu, Code, HelpCircle, FileText, Trash2, BookOpen, Flame, Zap
} from 'lucide-react';

export default function ProblemCreatorPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [selectedLangTab, setSelectedLangTab] = useState('python');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const SUGGESTED_PROMPTS = [
    {
      title: "Google: Longest Subarray with Sum K",
      text: "Given an array of integers nums and an integer k, find the length of the longest subarray with a sum equal to k. If no such subarray exists, return 0."
    },
    {
      title: "Meta: Valid Parentheses with wildcards",
      text: "Given a string containing characters '(', ')', and '*', where '*' can represent either a single '(' or a single ')' or an empty string, determine if the string is logically valid."
    },
    {
      title: "Netflix: Maximum Stack Design",
      text: "Design a max stack data structure that supports push, pop, top, peekMax, and popMax operations. popMax should remove and return the maximum element currently in the stack."
    }
  ];

  const handleCreateProblem = async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setCreatedResult(null);

    const statuses = [
      "AI Coach is analyzing description...",
      "Extracting examples and algorithmic inputs...",
      "Drafting language starter boilerplates...",
      "Synthesizing edge case test targets...",
      "Registering problem in PostgreSQL schema...",
      "Seeding Redis cached buffers..."
    ];

    let statusIdx = 0;
    setStatusText(statuses[0]);
    const statusInterval = setInterval(() => {
      if (statusIdx < statuses.length - 1) {
        statusIdx++;
        setStatusText(statuses[statusIdx]);
      }
    }, 1500);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/problems/ai-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) {
        throw new Error(`AI synthesis failed: Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCreatedResult(data);
      } else {
        throw new Error("Failed to initialize problem schemas.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during synthesis.");
    } finally {
      clearInterval(statusInterval);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f8f5ed] text-[#17263a] font-sans selection:bg-amber-500/30 selection:text-amber-900">
      <div className="flex h-full">
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[#e8e1d3] bg-[#fffdf8] p-6 lg:flex">
          <div className="space-y-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2.5 px-1 text-left"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-300 text-white shadow-lg shadow-amber-500/20"><Flame className="h-5 w-5 fill-white" /></span><span className="text-xl font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span></button>
            <nav className="space-y-1.5">
              <button onClick={() => router.push('/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><ArrowLeft className="h-4 w-4 text-slate-400" /><span>Journey</span></button>
              <button onClick={() => router.push('/library')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><BookOpen className="h-4 w-4 text-slate-400" /><span>Problem Library</span></button>
              <button className="relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-[#9b5416]"><span className="absolute inset-0 rounded-xl border border-[#f7d786] bg-[#fff0c9] shadow-sm" /><Sparkles className="relative z-10 h-4 w-4 text-[#e67b1f]" /><span className="relative z-10">Creator</span></button>
              <button onClick={() => router.push('/interview-arena')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><Zap className="h-4 w-4 text-slate-400" /><span>Practice</span></button>
            </nav>
          </div>
          <div className="space-y-3.5"><div className="space-y-3 rounded-2xl border border-[#e8e1d3] bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-xs font-semibold text-slate-700"><span className="flex items-center gap-2"><Flame className="h-4 w-4 fill-amber-500 text-amber-500" />7 Day Streak</span><span className="rounded-full border border-[#f6d89b] bg-[#fff1d5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c56a17]">Active</span></div><div className="flex items-center justify-between border-t border-[#eee7da] pt-2.5 text-xs text-slate-500"><span>Creation mode</span><span className="font-mono text-sm font-bold text-[#d97717]">AI</span></div></div><div className="flex items-center justify-between rounded-2xl border border-[#e8e1d3] bg-white p-2.5"><div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-xs font-black text-slate-950">P</div><span className="text-xs font-bold text-slate-700">Pattern learner</span></div><span className="h-2 w-2 rounded-full bg-emerald-400" /></div></div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between border-b border-[#e8e1d3] bg-[#fffdf8]/90 px-5 py-4 backdrop-blur-xl sm:px-8"><div><h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-[#17263a]"><Sparkles className="h-5 w-5 text-[#e67b1f]" />AI Problem Creator</h1><p className="text-xs font-medium text-slate-400">Turn an interview idea into a complete practice problem</p></div><button onClick={() => router.push('/dashboard')} className="hidden items-center gap-1.5 rounded-xl border border-[#e3d8c8] bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-[#fffaf0] sm:flex"><ArrowLeft className="h-4 w-4" />Dashboard</button></header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-16 pt-5 sm:px-8 sm:pt-7">
          <div className="mx-auto max-w-5xl space-y-8 animate-fadeIn">
        {/* Introduction */}
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-[#17263a]">
            Interview Problem Creator
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            Paste a question you received in a real technical interview, or write out a custom challenge. The AI Orchestrator will instantly construct the descriptions, optimal targets, examples, boilerplates, and private verification test cases.
          </p>
        </div>

        {/* Suggestion Pills */}
        {!createdResult && !isLoading && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">Suggested Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SUGGESTED_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.text);
                    handleCreateProblem(p.text);
                  }}
                  className="group relative cursor-pointer rounded-2xl border border-[#e8e1d3] bg-[#fffdf8] p-4 text-left shadow-sm transition duration-200 hover:border-amber-400 hover:shadow-md"
                >
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-[#17263a] transition group-hover:text-[#a85b17]">
                    <BrainCircuit className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-amber-500" />
                    {p.title}
                  </h4>
                  <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-500">
                    {p.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Creator Workspace Grid */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* Main Input Textarea Card */}
          {!createdResult && (
            <div className="space-y-4 rounded-2xl border border-[#e8e1d3] bg-[#fffdf8] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">Paste Problem Description</label>
                <span className="font-mono text-[10px] text-slate-400">{prompt.length} chars</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                placeholder="Example: Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane and an integer k, return the k closest points to the origin (0, 0)..."
                className="h-48 w-full resize-none rounded-xl border border-[#e4dbcf] bg-white p-4 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Cpu className="h-3.5 w-3.5 text-slate-300" />
                  <span>Uses Groq / Gemini API analysis models.</span>
                </div>
                <button
                  onClick={() => handleCreateProblem(prompt)}
                  disabled={isLoading || !prompt.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 text-xs font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-300 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>Synthesize Spec</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Loading Animation Layer */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-[#e8e1d3] bg-[#fffdf8] p-12 text-center shadow-sm">
              <RefreshCw className="w-10 h-10 text-amber-600 animate-spin" />
              <h3 className="text-lg font-black text-[#17263a]">Assembling Algorithmic Model</h3>
              <p className="max-w-sm text-sm text-slate-500 animate-pulse">
                {statusText}
              </p>
            </div>
          )}

          {/* Error Message Screen */}
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* Created Output Review Spec Sheet */}
          {createdResult && (
            <div className="space-y-0 overflow-hidden rounded-2xl border border-[#e8e1d3] bg-[#fffdf8] shadow-md animate-scaleUp">
              
              {/* Review Header Banner */}
              <div className="flex flex-col justify-between gap-4 bg-[#17263a] p-6 text-white md:flex-row md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                      Seed Success
                    </span>
                    <span className="font-mono text-xs text-slate-400">ID: {createdResult.problemId}</span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight">{createdResult.problemTitle}</h2>
                </div>

                <button
                  onClick={() => router.push(`/workspace/${createdResult.problemId}`)}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-300 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  Practice in Arena
                </button>
              </div>

              {/* Specs Grid */}
              <div className="space-y-6 p-5 md:p-8">
                
                {/* Meta Complexity Chips */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#e8e1d3] bg-[#f8f5ed] p-3.5">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Difficulty</span>
                    <span className="text-xs font-bold text-slate-700">{createdResult.difficulty}</span>
                  </div>
                  <div className="rounded-xl border border-[#e8e1d3] bg-[#f8f5ed] p-3.5">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Topic Classification</span>
                    <span className="text-xs font-bold capitalize text-slate-700">{createdResult.topic}</span>
                  </div>
                  <div className="rounded-xl border border-[#e8e1d3] bg-[#f8f5ed] p-3.5">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Target Time Limit</span>
                    <span className="text-xs font-bold text-slate-700">{createdResult.optimalTime}</span>
                  </div>
                  <div className="rounded-xl border border-[#e8e1d3] bg-[#f8f5ed] p-3.5">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Target Space Limit</span>
                    <span className="text-xs font-bold text-slate-700">{createdResult.optimalSpace}</span>
                  </div>
                </div>

                {/* Description Markdown Panel */}
                <div className="space-y-2 border-b border-[#EFECE6] pb-6">
                  <h3 className="text-xs uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    Problem Description
                  </h3>
                  <div className="text-stone-600 text-sm leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-xl border border-stone-100">
                    {createdResult.generatedSpec.description}
                  </div>
                </div>

                {/* Examples Column */}
                <div className="space-y-3 border-b border-[#EFECE6] pb-6">
                  <h3 className="text-xs uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                    Generated Example Sets
                  </h3>
                  <div className="space-y-2.5">
                    {createdResult.generatedSpec.examples?.map((ex: any, i: number) => (
                      <div key={i} className="border border-[#EFECE6] rounded-xl p-4 space-y-2 text-xs bg-stone-50">
                        <div className="font-bold text-stone-700">Example {i + 1}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                          <div>
                            <span className="text-stone-400">Input: </span>
                            <span className="text-stone-700">{ex.input}</span>
                          </div>
                          <div>
                            <span className="text-stone-400">Output: </span>
                            <span className="text-stone-700">{ex.output}</span>
                          </div>
                        </div>
                        {ex.explanation && (
                          <div className="text-stone-500 italic pt-1">
                            <span className="font-semibold text-stone-600 not-italic">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Starter Code Tabs */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-stone-400" />
                    Starter Boilerplates
                  </h3>

                  {/* Tabs Selector Bar */}
                  <div className="flex gap-1.5 border-b border-[#EFECE6] pb-2">
                    {createdResult.generatedSpec.starterCodes?.map((sc: any) => (
                      <button
                        key={sc.language}
                        onClick={() => setSelectedLangTab(sc.language)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase transition cursor-pointer select-none ${
                          selectedLangTab === sc.language
                            ? 'bg-amber-600 text-stone-50 shadow-xs'
                            : 'text-stone-400 hover:text-stone-850 hover:bg-stone-100'
                        }`}
                      >
                        {sc.language === 'cpp' ? 'C++' : sc.language}
                      </button>
                    ))}
                  </div>

                  {/* Boilerplate Display Box */}
                  <div className="relative font-mono text-[11px] p-4 bg-stone-900 text-stone-200 rounded-xl overflow-x-auto shadow-inner border border-stone-950">
                    <pre className="whitespace-pre">
                      {createdResult.generatedSpec.starterCodes?.find((sc: any) => sc.language === selectedLangTab)?.boilerplate}
                    </pre>
                  </div>
                </div>

                {/* Reset or Delete & Regenerate button */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <button
                    onClick={async () => {
                      if (!createdResult?.problemId) return;
                      const confirmed = window.confirm(
                        `⚠️ Are you 100% sure you want to delete this problem?\n\nWarning: Deleting will permanently remove it from the database and you will need to regenerate it afterwards.`
                      );
                      if (!confirmed) return;

                      try {
                        const token = localStorage.getItem('token');
                        await fetch(`${apiUrl}/problems/${createdResult.problemId}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setCreatedResult(null);
                        setPrompt('');
                      } catch (e) {
                        console.error('Delete failed', e);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete & Regenerate with AI</span>
                  </button>

                  <button
                    onClick={() => {
                      setCreatedResult(null);
                      setPrompt('');
                    }}
                    className="text-xs font-bold text-stone-400 hover:text-stone-850 transition uppercase tracking-wider"
                  >
                    Seed Another Problem
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
        </div>
          </main>
        </div>
      </div>
    </div>
  );
}
