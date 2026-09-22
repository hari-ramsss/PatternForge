'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Brain,
  RotateCw,
  Search,
  Plus,
  Sparkles,
  Clock,
  Flame,
  ArrowLeft,
  RefreshCw,
  Zap,
} from 'lucide-react';
import PatternForgeNavigation from '../../components/PatternForgeNavigation';

interface PatternCard {
  id: string;
  problemTitle: string;
  patternName: string;
  clues: string;
  invariants: string;
  codeSnippet: string;
  optimalTime: string;
  optimalSpace: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  isDue: boolean;
}

export default function PatternLibraryPage() {
  const router = useRouter();
  const [cards, setCards] = useState<PatternCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due' | 'struggled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New card form state
  const [newProblemTitle, setNewProblemTitle] = useState('');
  const [newPatternName, setNewPatternName] = useState('');
  const [newClues, setNewClues] = useState('');
  const [newInvariants, setNewInvariants] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const fetchCards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/cards?filter=${filter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (err) {
      console.error('Failed to fetch pattern cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [filter]);

  const toggleFlip = (id: string) => {
    setFlippedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReviewCard = async (id: string, rating: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/cards/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCards((prev) =>
          prev.map((c) => (c.id === id ? { ...updated, isDue: new Date(updated.dueDate) <= new Date() } : c))
        );
        // Flip back to front after rating
        setFlippedCardIds((prev) => ({ ...prev, [id]: false }));
      }
    } catch (err) {
      console.error('Failed to submit card review:', err);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblemTitle.trim() || !newPatternName.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemTitle: newProblemTitle,
          patternName: newPatternName,
          clues: newClues,
          invariants: newInvariants,
          codeSnippet: newCodeSnippet,
        }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewProblemTitle('');
        setNewPatternName('');
        setNewClues('');
        setNewInvariants('');
        setNewCodeSnippet('');
        fetchCards();
      }
    } catch (err) {
      console.error('Failed to create card:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.problemTitle.toLowerCase().includes(query) ||
      c.patternName.toLowerCase().includes(query) ||
      c.clues.toLowerCase().includes(query) ||
      c.invariants.toLowerCase().includes(query)
    );
  });

  const dueCount = cards.filter((c) => c.isDue).length;
  const masteredCount = cards.filter((c) => c.repetitions >= 3).length;

  return (
    <div className="h-screen overflow-hidden bg-[#f8f5ed] text-[#17263a] font-sans selection:bg-amber-500/30 selection:text-amber-900">
      <div className="flex h-full">
        <PatternForgeNavigation statusLabel="Memory cards" statusValue={String(cards.length)} />
        <aside className="hidden">
          <div className="space-y-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2.5 px-1 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-b-4 border-orange-600/40 bg-gradient-to-tr from-orange-500 to-amber-300 text-white"><Flame className="h-5 w-5 fill-white" /></span>
              <span className="text-xl font-black tracking-tight text-[#17263a]">Pattern<span className="text-[#e67b1f]">Forge</span></span>
            </button>
            <nav className="space-y-1.5">
              <button onClick={() => router.push('/dashboard')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><ArrowLeft className="h-4 w-4 text-slate-400" /><span>Journey</span></button>
              <button className="relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#9b5416]"><span className="absolute inset-0 -z-0 rounded-2xl border-2 border-b-4 border-[#f0cd7a] bg-[#fff0c9]" /><BookOpen className="relative z-10 h-4 w-4 text-[#e67b1f]" /><span className="relative z-10">Pattern Library</span></button>
              <button onClick={() => router.push('/interview-arena')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><Zap className="h-4 w-4 text-slate-400" /><span>Practice</span></button>
              <button onClick={() => router.push('/mistakes')} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 transition hover:bg-[#fff8e9] hover:text-slate-800"><Brain className="h-4 w-4 text-slate-400" /><span>Insights</span></button>
            </nav>
          </div>
          <div className="space-y-3.5">
            <div className="space-y-3 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-white p-4"><div className="flex items-center justify-between text-xs font-semibold text-slate-700"><span className="flex items-center gap-2"><Flame className="h-4 w-4 fill-amber-500 text-amber-500" />7 Day Streak</span><span className="rounded-full border-2 border-[#f6d89b] bg-[#fff1d5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c56a17]">Active</span></div><div className="flex items-center justify-between border-t-2 border-[#eee7da] pt-2.5 text-xs text-slate-500"><span>Memory cards</span><span className="font-mono text-sm font-bold text-[#d97717]">{cards.length}</span></div></div>
            <div className="flex items-center justify-between rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-white p-2.5"><div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-full border-2 border-b-4 border-amber-600/50 bg-gradient-to-tr from-amber-500 to-amber-300 text-xs font-black text-slate-950">P</div><span className="max-w-[120px] truncate text-xs font-bold text-slate-700">Pattern learner</span></div><span className="h-2 w-2 rounded-full bg-emerald-400" /></div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16 lg:pt-0">
          <header className="flex shrink-0 items-center justify-between border-b-2 border-[#e8e1d3] bg-[#fffdf8]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div><h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-[#17263a]"><BookOpen className="h-5 w-5 text-[#e67b1f]" />Pattern Library</h1><p className="text-xs font-medium text-slate-400">Build durable recall for the patterns you are learning</p></div>
            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5 rounded-2xl border-2 border-b-4 border-amber-600/70 bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-950 transition-all active:translate-y-[2px] active:border-b-2"><Plus className="h-4 w-4" /><span className="hidden sm:inline">New Pattern Card</span></button>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-16 pt-5 sm:px-8 sm:pt-7">
            {/* Banner Summary Header */}
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-5 md:flex-row">
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-xl font-black tracking-tight text-[#17263a]">Spaced Repetition Memory Board</h1>
                <p className="max-w-xl text-xs leading-relaxed text-slate-500">
                  Review pattern cards before memory decay occurs. Our SuperMemo-2 algorithm schedules optimal recall intervals based on your ratings.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="block text-2xl font-black text-[#e67b1f]">{dueCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Today</span>
                </div>
                <div className="h-8 w-px bg-stone-200"></div>
                <div className="text-center">
                  <span className="block text-2xl font-black text-emerald-600">{masteredCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mastered</span>
                </div>
                <div className="h-8 w-px bg-stone-200"></div>
                <div className="text-center">
                  <span className="block text-2xl font-black text-[#17263a]">{cards.length}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cards</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'all'
                    ? 'bg-[#fff0c9] text-[#9b5416] border-2 border-b-4 border-[#f7d786]'
                    : 'border-2 border-b-4 border-[#e8e1d3] bg-white text-slate-600 hover:text-slate-900 active:translate-y-[2px] active:border-b-2'
                    }`}
                >
                  All Cards ({cards.length})
                </button>
                <button
                  onClick={() => setFilter('due')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filter === 'due'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-2 border-b-4 border-amber-600/70'
                    : 'border-2 border-b-4 border-[#e8e1d3] bg-white text-slate-600 hover:text-slate-900 active:translate-y-[2px] active:border-b-2'
                    }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Due Today ({dueCount})</span>
                </button>
                <button
                  onClick={() => setFilter('struggled')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filter === 'struggled'
                    ? 'bg-rose-500 text-white border-2 border-b-4 border-rose-700'
                    : 'border-2 border-b-4 border-[#e8e1d3] bg-white text-slate-600 hover:text-slate-900 active:translate-y-[2px] active:border-b-2'
                    }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Struggled</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patterns or clues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e1d3] bg-white py-2 pl-9 pr-3 text-xs outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* 3D Flip Card Gallery Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-amber-600 w-8 h-8" />
                <p className="text-sm font-semibold text-slate-500">Loading pattern cards...</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="mx-auto max-w-6xl space-y-3 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-12 text-center text-slate-500">
                <Brain className="mx-auto h-10 w-10 animate-bounce text-slate-400" />
                <h3 className="text-base font-black text-[#17263a]">No pattern cards found</h3>
                <p className="mx-auto max-w-sm text-xs text-slate-500">
                  No flashcards match your current filter. Click &ldquo;New Pattern Card&rdquo; to create custom study cards!
                </p>
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2">
                {filteredCards.map((card) => {
                  const isFlipped = !!flippedCardIds[card.id];

                  return (
                    <div
                      key={card.id}
                      className="w-full h-[420px]"
                      style={{ perspective: '1000px' }}
                    >
                      <div
                        className="relative w-full h-full"
                        style={{
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                      >
                        {/* ================= FRONT SIDE ================= */}
                        <div
                          className="absolute inset-0 flex flex-col justify-between rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-5 transition"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          <div className="space-y-3.5">
                            {/* Header Badges */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                                {card.problemTitle}
                              </span>
                              {card.isDue ? (
                                <span className="text-[10px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                  <Clock className="w-3 h-3" /> Due Today
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-500 font-mono font-semibold bg-stone-100 px-2 py-0.5 rounded-full">
                                  Rep: {card.repetitions}d • Interval: {card.interval}d
                                </span>
                              )}
                            </div>

                            {/* Pattern Name */}
                            <h3 className="text-xl font-black leading-snug tracking-tight text-[#17263a]">
                              {card.patternName}
                            </h3>

                            {/* Observation Clues */}
                            <div className="rounded-xl border border-[#e8e1d3] bg-[#f8f5ed] p-4 text-xs leading-relaxed text-slate-700">
                              <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#a85b17]">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                Pattern Recognition Clues
                              </span>
                              {card.clues}
                            </div>
                          </div>

                          {/* Bottom Footer Actions */}
                          <div className="flex items-center justify-between border-t border-[#eee7da] pt-3">
                            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                              <span>Time: <strong className="font-bold text-slate-800">{card.optimalTime}</strong></span>
                              <span>Space: <strong className="font-bold text-slate-800">{card.optimalSpace}</strong></span>
                            </div>

                            <button
                              onClick={() => toggleFlip(card.id)}
                              className="flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#0b1524] bg-[#17263a] px-3.5 py-1.5 text-xs font-bold text-amber-300 transition-all active:translate-y-[2px] active:border-b-2 hover:bg-[#243750]"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Flip for Insights</span>
                            </button>
                          </div>
                        </div>

                        {/* ================= BACK SIDE ================= */}
                        <div
                          className="absolute inset-0 bg-[#1A1A18] border-2 border-b-4 border-stone-800 text-stone-200 rounded-2xl p-6 flex flex-col justify-between"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                          }}
                        >
                          <div className="space-y-3.5 overflow-y-auto pr-1">
                            {/* Header bar */}
                            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                                <Brain className="w-3.5 h-3.5 text-amber-400" />
                                <span>Deep Structural Invariants & Insights</span>
                              </div>
                              <button
                                onClick={() => toggleFlip(card.id)}
                                className="text-xs text-stone-400 hover:text-stone-100 flex items-center gap-1 font-sans font-semibold"
                              >
                                <RotateCw className="w-3 h-3" /> Flip Back
                              </button>
                            </div>

                            {/* Core Invariant Breakdown */}
                            <div className="p-3 bg-[#242422] border border-stone-800 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                Core Invariant & Strategy
                              </span>
                              <p className="text-xs text-stone-200 font-sans leading-relaxed">
                                {card.invariants}
                              </p>
                            </div>

                            {/* Complexity & Pitfalls Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-lg">
                                <span className="text-[9px] text-stone-500 font-mono block uppercase">Time Complexity</span>
                                <span className="font-mono text-amber-400 font-bold">{card.optimalTime}</span>
                              </div>
                              <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-lg">
                                <span className="text-[9px] text-stone-500 font-mono block uppercase">Space Auxiliary</span>
                                <span className="font-mono text-purple-400 font-bold">{card.optimalSpace}</span>
                              </div>
                            </div>

                            {/* Code Snippet Box */}
                            {card.codeSnippet && (
                              <div className="space-y-1">
                                <span className="text-[9px] text-stone-400 font-mono block uppercase font-bold">
                                  Optimal Implementation Snippet
                                </span>
                                <pre className="bg-[#10100F] border border-stone-800 rounded-xl p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-28 leading-snug">
                                  <code>{card.codeSnippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>

                          {/* SuperMemo-2 Recall Rating Bar */}
                          <div className="border-t border-stone-800 pt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                              <span>Ease Factor: <strong className="text-amber-400">{card.easeFactor.toFixed(2)}</strong></span>
                              <span>Rate Retention (SuperMemo-2)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => handleReviewCard(card.id, 1)}
                                className="py-1.5 bg-rose-950/70 hover:bg-rose-900 border-2 border-b-4 border-rose-800/80 text-rose-300 rounded-xl text-xs font-bold transition-all text-center active:translate-y-[2px] active:border-b-2"
                              >
                                🔴 Struggled (1d)
                              </button>
                              <button
                                onClick={() => handleReviewCard(card.id, 3)}
                                className="py-1.5 bg-amber-950/70 hover:bg-amber-900 border-2 border-b-4 border-amber-800/80 text-amber-300 rounded-xl text-xs font-bold transition-all text-center active:translate-y-[2px] active:border-b-2"
                              >
                                🟢 Remembered (6d)
                              </button>
                              <button
                                onClick={() => handleReviewCard(card.id, 5)}
                                className="py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border-2 border-b-4 border-emerald-800/80 text-emerald-300 rounded-xl text-xs font-bold transition-all text-center active:translate-y-[2px] active:border-b-2"
                              >
                                ⚡ Easy (14d)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Custom Pattern Card Creation Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg space-y-4 rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-6 font-sans">
              <div className="flex items-center justify-between border-b border-[#eee7da] pb-3">
                <h3 className="flex items-center gap-2 text-lg font-black text-[#17263a]">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>Create Pattern Card</span>
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateCard} className="space-y-3.5 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Problem Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Two Sum or Sliding Window Maximum"
                    value={newProblemTitle}
                    onChange={(e) => setNewProblemTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#e4dbcf] bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Pattern Technique Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dynamic Sliding Window or Prefix XOR Frequency Map"
                    value={newPatternName}
                    onChange={(e) => setNewPatternName(e.target.value)}
                    className="w-full rounded-xl border border-[#e4dbcf] bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Observation Clues</label>
                  <textarea
                    placeholder="Describe key triggers or intuition clues..."
                    value={newClues}
                    onChange={(e) => setNewClues(e.target.value)}
                    className="h-16 w-full resize-none rounded-xl border border-[#e4dbcf] bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Structural Invariants</label>
                  <textarea
                    placeholder="Detail mathematical rules or algorithmic invariants..."
                    value={newInvariants}
                    onChange={(e) => setNewInvariants(e.target.value)}
                    className="h-16 w-full resize-none rounded-xl border border-[#e4dbcf] bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Reference Code Snippet</label>
                  <textarea
                    placeholder="Paste Python/JS reference solution snippet..."
                    value={newCodeSnippet}
                    onChange={(e) => setNewCodeSnippet(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 text-emerald-400 font-mono rounded-xl px-3 py-2 outline-none h-20 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#eee7da] pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3.5 py-1.5 font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl border-2 border-b-4 border-amber-600/70 bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-1.5 font-extrabold uppercase tracking-wide text-slate-950 transition-all active:translate-y-[2px] active:border-b-2 hover:from-amber-400 hover:to-amber-300"
                  >
                    {isSubmitting ? 'Saving Card...' : 'Create Pattern Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
