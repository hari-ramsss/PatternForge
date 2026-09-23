'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Sparkles, Play, BookOpen, ChevronRight, RefreshCw, ArrowUpRight, Search, GitBranch, ListTree, Layers3, ScanSearch, Brackets, Sigma, Gauge, Route, CircleDot } from 'lucide-react';
import type { JourneyNode } from './JourneyNodeCard';

interface NodeDetailDrawerProps {
    node: JourneyNode | null;
    onClose: () => void;
    onStartPractice: (slug: string) => void;
    onGenerateAiProblem: (patternTitle: string, subtopicTitle?: string) => void;
    isGeneratingAi: boolean;
    generationError?: string | null;
}

const SubtopicIcon = ({ title }: { title: string }) => {
    const normalizedTitle = title.toLowerCase();
    const iconClass = 'h-[18px] w-[18px]';
    if (/window|substring|subarray/.test(normalizedTitle)) return <ScanSearch className={`${iconClass} text-amber-600`} />;
    if (/binary search|search|bound|lookup/.test(normalizedTitle)) return <Search className={`${iconClass} text-blue-600`} />;
    if (/tree|traversal|ancestor|path|recursion/.test(normalizedTitle)) return <ListTree className={`${iconClass} text-emerald-600`} />;
    if (/graph|component|connect|edge|bfs|dfs/.test(normalizedTitle)) return <GitBranch className={`${iconClass} text-violet-600`} />;
    if (/stack|parenthes|bracket/.test(normalizedTitle)) return <Brackets className={`${iconClass} text-rose-600`} />;
    if (/heap|priority|top k|median/.test(normalizedTitle)) return <Gauge className={`${iconClass} text-orange-600`} />;
    if (/dynamic|memo|state|knapsack|subsequence/.test(normalizedTitle)) return <Layers3 className={`${iconClass} text-cyan-600`} />;
    if (/sum|prefix|range|difference/.test(normalizedTitle)) return <Sigma className={`${iconClass} text-indigo-600`} />;
    if (/pointer|linked|list|cycle/.test(normalizedTitle)) return <Route className={`${iconClass} text-teal-600`} />;
    return <CircleDot className={`${iconClass} text-slate-500`} />;
};

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({ node, onClose, onStartPractice, onGenerateAiProblem, isGeneratingAi, generationError }) => {
    const [expandedSubtopicId, setExpandedSubtopicId] = useState<string | null>(null);
    if (!node) return null;

    return (
        <motion.aside initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 48, opacity: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 32 }} className="fixed right-0 top-[4.75rem] z-40 flex h-[calc(100%-4.75rem)] w-full flex-col overflow-y-auto border-l-2 border-[#e8e1d3] bg-[#fffdf8] p-4 sm:w-[420px] sm:p-5 lg:relative lg:top-0 lg:h-full lg:w-[420px] lg:shrink-0">
            <div className="space-y-5">
                <div className="flex items-center justify-between border-b-2 border-[#eee7da] pb-3"><span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Core patterns <ChevronRight className="inline" size={13} /> <span className="text-slate-800 normal-case tracking-normal">{node.title}</span></span><button onClick={onClose} className="rounded-xl border-2 border-b-4 border-slate-200 p-1.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700" aria-label="Close details"><X size={16} /></button></div>
                <div className="flex gap-3"><span className="grid h-15 w-15 shrink-0 place-items-center rounded-full border-4 border-b-8 border-[#f0cd7a] bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Zap size={27} fill="white" /></span><div><h3 className="text-2xl font-black tracking-tight text-[#17263a]">{node.title}</h3><p className="mt-1 text-sm leading-snug text-slate-500">{node.description}</p></div></div>
                <div><div className="mb-2 flex items-end justify-between text-sm font-bold text-slate-600"><span>Mastery</span><span className="text-2xl text-[#e67b1f]">{node.masteryPct}%</span></div><div className="h-4 overflow-hidden rounded-full border-2 border-[#eee9df] bg-[#eee9df]"><motion.div initial={{ width: 0 }} animate={{ width: `${node.masteryPct}%` }} transition={{ duration: .65 }} className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" /></div></div>
                <p className="text-sm font-medium leading-relaxed text-slate-600">{node.bottleneck ?? 'Build a reliable mental model before increasing difficulty.'}</p>
                <div className="rounded-2xl border-2 border-b-4 border-[#bfe4c8] bg-[#ebf9ed] p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-[#217c50]">Key learning focus</p><p className="mt-2 text-xs leading-relaxed text-[#39715b]">{node.bottleneck ?? 'Master each curated skill before moving to the next pattern.'}</p></div>

                <section className="rounded-3xl border-2 border-[#eadfce] bg-[#fff8e9] p-3 shadow-[0_4px_0_#eadfce]">
                    <div className="mb-3 flex items-center justify-between px-1"><h4 className="text-sm font-extrabold text-[#17263a]">Subtopics and problems</h4><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#b87524] shadow-sm">Curated skill path</span></div>
                    <div className="space-y-3">
                        {node.subtopics.map((subtopic) => (
                            <div key={subtopic.id} className={`rounded-2xl border-2 border-b-4 bg-white shadow-[0_2px_0_#e9dfcf] transition-all ${expandedSubtopicId === subtopic.id ? 'border-amber-400 shadow-[0_3px_0_#d99a38]' : 'border-[#eadfce] hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_3px_0_#eadfce]'}`}>
                                <div className="flex items-start gap-3 p-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-b-4 border-[#f0dfbd] bg-[#fff4d6]" aria-hidden="true">
                                        <SubtopicIcon title={subtopic.title} />
                                    </span>
                                    <button onClick={() => setExpandedSubtopicId((current) => current === subtopic.id ? null : subtopic.id)} className="min-w-0 flex-1 py-3 text-left group" aria-expanded={expandedSubtopicId === subtopic.id}>
                                        <span className="block text-sm font-bold text-slate-800 group-hover:text-[#a85b17]">{subtopic.title}</span>
                                        <span className="text-xs text-slate-500">{subtopic.problems?.length ?? 0} problems · {subtopic.masteryPct}% mastery</span>
                                    </button>
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#eee7da] bg-[#fffdf8]">
                                        <ChevronRight size={17} className={`text-slate-400 transition-transform ${expandedSubtopicId === subtopic.id ? 'rotate-90 text-amber-600' : ''}`} />
                                    </span>
                                </div>
                                {expandedSubtopicId === subtopic.id && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-[#eee7da] px-3 pb-3 pt-2">
                                    <div className="space-y-1">
                                        {(subtopic.problems ?? []).map((problem) => (
                                            <button key={problem.slug} onClick={() => onStartPractice(problem.slug)} className="group flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left transition-all hover:border-amber-300 hover:bg-[#fff8e9] focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                                                <span className="min-w-0 truncate text-xs font-semibold text-slate-700 group-hover:text-[#9a5618]">{problem.title}</span>
                                                <ArrowUpRight size={14} className="ml-2 shrink-0 text-slate-300 transition-colors group-hover:text-amber-600" />
                                            </button>
                                        ))}
                                        {(subtopic.problems ?? []).length === 0 && <p className="px-3 py-2 text-xs italic text-slate-400">No seed problem is linked yet.</p>}
                                    </div>
                                    <button onClick={() => onGenerateAiProblem(node.title, subtopic.title)} disabled={isGeneratingAi} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#a85b17] transition-colors hover:bg-[#fff8e9] disabled:opacity-50">{isGeneratingAi ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}Generate new problem</button>
                                </motion.div>}
                            </div>
                        ))}
                    </div>
                </section>

                <div className="space-y-2.5 border-t-2 border-[#eee7da] pt-4">{generationError && <p role="alert" className="rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{generationError}</p>}<button onClick={() => onStartPractice(node.subtopics[0]?.problems?.[0]?.slug ?? node.defaultSlug)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-orange-600/70 bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-black uppercase tracking-wide text-white transition-all"><Play size={17} fill="white" />Continue learning</button><button onClick={() => onStartPractice(node.subtopics[0]?.problems?.[0]?.slug ?? node.defaultSlug)} className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-b-4 border-[#eadcc7] bg-white py-2.5 text-xs font-extrabold uppercase tracking-wide text-slate-600"><BookOpen size={15} />Problem set</button></div>
            </div>
        </motion.aside>
    );
};

export default NodeDetailDrawer;
