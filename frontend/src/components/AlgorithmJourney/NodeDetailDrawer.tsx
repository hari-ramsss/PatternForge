'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Check, Sparkles, Play, AlertTriangle, Target, BookOpen, ChevronRight, RefreshCw } from 'lucide-react';
import type { JourneyNode } from './JourneyNodeCard';

interface NodeDetailDrawerProps {
  node: JourneyNode | null;
  onClose: () => void;
  onStartPractice: (slug: string) => void;
  onGenerateAiProblem: (patternTitle: string, subtopicTitle?: string) => void;
  isGeneratingAi: boolean;
}

const SubtopicIcon = ({ index }: { index: number }) => index === 0
  ? <Check className="text-emerald-500" size={17} />
  : index === 1
    ? <Zap className="fill-amber-500 text-amber-500" size={17} />
    : index === 2
      ? <Target className="text-sky-500" size={17} />
      : <AlertTriangle className="text-rose-500" size={17} />;

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({ node, onClose, onStartPractice, onGenerateAiProblem, isGeneratingAi }) => {
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  if (!node) return null;

  const selectedSubtopic = node.subtopics.find((subtopic) => subtopic.id === selectedSubtopicId);
  const firstProblem = selectedSubtopic?.problems?.[0]?.slug ?? node.defaultSlug;

  return (
    <motion.aside initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 48, opacity: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 32 }} className="fixed right-0 top-[4.75rem] z-40 flex h-[calc(100%-4.75rem)] w-full flex-col overflow-y-auto border-l-2 border-[#e8e1d3] bg-[#fffdf8] p-4 sm:w-[420px] sm:p-5 lg:relative lg:top-0 lg:h-full lg:w-[420px] lg:shrink-0">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b-2 border-[#eee7da] pb-3"><span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Core patterns <ChevronRight className="inline" size={13} /> <span className="text-slate-800 normal-case tracking-normal">{node.title}</span></span><button onClick={onClose} className="rounded-xl border-2 border-b-4 border-slate-200 p-1.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700" aria-label="Close details"><X size={16} /></button></div>
        <div className="flex gap-3"><span className="grid h-15 w-15 shrink-0 place-items-center rounded-full border-4 border-b-8 border-[#f0cd7a] bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Zap size={27} fill="white" /></span><div><h3 className="text-2xl font-black tracking-tight text-[#17263a]">{node.title}</h3><p className="mt-1 text-sm leading-snug text-slate-500">{node.description}</p></div></div>
        <div><div className="mb-2 flex items-end justify-between text-sm font-bold text-slate-600"><span>Mastery</span><span className="text-2xl text-[#e67b1f]">{node.masteryPct}%</span></div><div className="h-4 overflow-hidden rounded-full border-2 border-[#eee9df] bg-[#eee9df]"><motion.div initial={{ width: 0 }} animate={{ width: `${node.masteryPct}%` }} transition={{ duration: .65 }} className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" /></div></div>
        <p className="text-sm font-medium leading-relaxed text-slate-600">{node.bottleneck ?? 'Build a reliable mental model before increasing difficulty.'}</p>
        <div className="rounded-2xl border-2 border-b-4 border-[#bfe4c8] bg-[#ebf9ed] p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-[#217c50]">Key learning focus</p><p className="mt-2 text-xs leading-relaxed text-[#39715b]">{node.bottleneck ?? 'Master each curated skill before moving to the next pattern.'}</p></div>
        <section><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-extrabold text-[#17263a]">Subtopics</h4><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Curated skill path</span></div><div className="space-y-2.5">{node.subtopics.map((subtopic, index) => <div key={subtopic.id} className="space-y-2"><button onClick={() => setSelectedSubtopicId(selectedSubtopicId === subtopic.id ? null : subtopic.id)} aria-expanded={selectedSubtopicId === subtopic.id} className={`group flex w-full items-center justify-between rounded-2xl border-2 p-3 text-left transition-all active:translate-y-[2px] active:border-b-2 ${selectedSubtopicId === subtopic.id ? 'border-b-4 border-amber-400 bg-[#fff8e9] shadow-[0_2px_0_rgba(240,205,122,0.45)]' : 'border-b-4 border-[#eee7da] bg-white hover:border-[#dfd2bf] hover:bg-[#fffaf0] hover:shadow-[0_2px_0_rgba(240,205,122,0.35)] active:border-b-2'}`}><span className="flex items-center gap-3"><span className="transition-transform group-hover:scale-110"><SubtopicIcon index={index} /></span><span><span className="block text-sm font-bold text-slate-800 transition-colors group-hover:text-[#17263a]">{subtopic.title}</span><span className="text-xs text-slate-500">{subtopic.problemCount} exercises</span></span></span><span className="flex items-center gap-2 text-sm font-black text-slate-700">{subtopic.masteryPct}%<ChevronRight size={17} className={`text-slate-400 transition-transform duration-200 ${selectedSubtopicId === subtopic.id ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} /></span></button>{selectedSubtopicId === subtopic.id && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-2xl border-2 border-b-4 border-[#e9dfcf] bg-white"><div className="flex items-center justify-between gap-2 border-b-2 border-[#eee7da] px-3 py-2.5"><p className="min-w-0 truncate text-xs font-extrabold text-slate-700">{subtopic.title} problems</p><button onClick={() => onGenerateAiProblem(node.title, subtopic.title)} disabled={isGeneratingAi} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#a85b17] disabled:opacity-60">{isGeneratingAi ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}Generate new problem</button></div><div className="space-y-1 p-2">{subtopic.problems && subtopic.problems.length > 0 ? subtopic.problems.map((problem) => <button key={problem.slug} onClick={() => onStartPractice(problem.slug)} className="group/problem flex w-full items-center justify-between gap-2 rounded-xl border-2 border-transparent px-2 py-1.5 text-left transition-all hover:border-amber-300 hover:bg-[#fff8e9] active:translate-y-[1px] active:bg-[#fff3d6]"><span className="flex min-w-0 items-center gap-2"><Play size={12} className="shrink-0 text-amber-500 opacity-0 transition-all group-hover/problem:opacity-100" fill="currentColor" /><span className="min-w-0 truncate text-xs font-semibold text-slate-600 transition-colors group-hover/problem:text-[#17263a]">{problem.title}</span></span><span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide transition-colors ${problem.difficulty === 'EASY' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 group-hover/problem:border-emerald-400' : problem.difficulty === 'HARD' ? 'border-rose-200 bg-rose-50 text-rose-700 group-hover/problem:border-rose-400' : 'border-amber-200 bg-amber-50 text-amber-700 group-hover/problem:border-amber-400'}`}>{problem.difficulty}</span></button>) : <p className="px-2 py-2 text-xs font-medium text-slate-400">No problems here yet — generate one to start practicing.</p>}</div></motion.div>}</div>)}</div></section>
        <div className="space-y-2.5 border-t-2 border-[#eee7da] pt-4"><button onClick={() => onStartPractice(firstProblem)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-orange-600/70 bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-black uppercase tracking-wide text-white transition-all hover:from-amber-300 hover:to-orange-400 active:translate-y-[2px] active:border-b-2"><Play size={17} fill="white" />Continue learning</button><div className="grid grid-cols-2 gap-2.5"><button onClick={() => onGenerateAiProblem(node.title, selectedSubtopic?.title)} disabled={isGeneratingAi || !selectedSubtopic} className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-b-4 border-[#eadcc7] bg-white py-2.5 text-xs font-extrabold uppercase tracking-wide text-[#9a5618] disabled:opacity-50">{isGeneratingAi ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}Generate practice</button><button onClick={() => onStartPractice(firstProblem)} className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-b-4 border-[#eadcc7] bg-white py-2.5 text-xs font-extrabold uppercase tracking-wide text-slate-600"><BookOpen size={15} />Problem set</button></div></div>
      </div>
    </motion.aside>
  );
};

export default NodeDetailDrawer;
