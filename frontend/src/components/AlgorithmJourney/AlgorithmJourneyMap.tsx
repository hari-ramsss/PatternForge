'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, RefreshCw, Sparkles } from 'lucide-react';
import type { JourneyNode } from './JourneyNodeCard';
import NodeDetailDrawer from './NodeDetailDrawer';
import { LearningWorld } from '../learning-world/LearningWorld';

type GeneratedProblem = { id: string; title: string; difficulty: string; subtopic?: string | null };
type SavedProblem = { id: string; title: string; difficulty: string; topic?: string; subtopic?: string | null; solved?: boolean };
type CurriculumEntry = { id: string; topic: string; title: string; sortOrder: number; canonicalSlug?: string | null; canonicalTitle?: string | null };
interface AlgorithmJourneyMapProps { initialNodes: JourneyNode[]; existingProblems: SavedProblem[]; curriculum?: CurriculumEntry[]; onStartPractice: (slug: string) => void; onGenerateAiProblem: (patternTitle: string, subtopicTitle?: string) => Promise<GeneratedProblem>; }

const deriveSubtopicStatus = (pct: number): 'MASTERED' | 'PRACTICING' | 'UNEXPLORED' =>
  pct >= 100 ? 'MASTERED' : pct > 0 ? 'PRACTICING' : 'UNEXPLORED';

// A node unlocks once every prerequisite is close to mastered.
const UNLOCK_THRESHOLD = 80;

export const AlgorithmJourneyMap: React.FC<AlgorithmJourneyMapProps> = ({ initialNodes, existingProblems, curriculum = [], onStartPractice, onGenerateAiProblem }) => {
  const [nodes, setNodes] = useState<JourneyNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sliding-window');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ patternTitle: string; subtopicTitle?: string } | null>(null);
  const hydratedNodes = useMemo(() => nodes.map((node) => {
    const catalogEntries = curriculum.filter((entry) => entry.topic.trim().toLowerCase() === node.title.trim().toLowerCase() || (node.title === 'Advanced Patterns' && entry.topic === 'Advanced Patterns & Sums'));
    const sourceSubtopics = catalogEntries.length > 0
      ? catalogEntries.map((entry) => ({ id: entry.id, title: entry.title, masteryPct: 0, status: 'UNEXPLORED' as const, problemCount: entry.canonicalSlug ? 1 : 0, problems: entry.canonicalSlug && entry.canonicalTitle ? [{ slug: entry.canonicalSlug, title: entry.canonicalTitle, difficulty: 'MEDIUM' }] : [] }))
      : node.subtopics;
    const subtopics = sourceSubtopics.map((subtopic) => {
      const savedForSubtopic = existingProblems.filter((problem) => problem.topic?.trim().toLowerCase() === node.title.toLowerCase() && problem.subtopic?.trim().toLowerCase() === subtopic.title.toLowerCase()).map((problem) => ({ slug: problem.id, title: problem.title, difficulty: problem.difficulty, custom: true, solved: !!problem.solved }));
      const mergedProblems = [...(subtopic.problems ?? [])];
      savedForSubtopic.forEach((problem) => { if (!mergedProblems.some((candidate) => candidate.slug === problem.slug)) mergedProblems.push(problem); });
      // Live mastery: share of this subtopic's exercises the user has actually solved.
      const total = Math.max(subtopic.problemCount, mergedProblems.length);
      const solvedCount = savedForSubtopic.filter((problem) => problem.solved).length;
      const masteryPct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
      return { ...subtopic, masteryPct, status: deriveSubtopicStatus(masteryPct), problems: mergedProblems, problemCount: total };
    });
    const totalExercises = subtopics.reduce((sum, subtopic) => sum + subtopic.problemCount, 0);
    const totalSolved = subtopics.reduce((sum, subtopic) => sum + (subtopic.masteryPct / 100) * subtopic.problemCount, 0);
    const nodeMasteryPct = totalExercises > 0 ? Math.round((totalSolved / totalExercises) * 100) : 0;
    return { ...node, masteryPct: nodeMasteryPct, subtopics };
  }), [nodes, existingProblems, curriculum]);
  // Node badges (tick / in-progress / lock) derive from real completion and prerequisite mastery.
  const statusNodes = useMemo(() => {
    const masteryById = new Map(hydratedNodes.map((node) => [node.id, node.masteryPct]));
    return hydratedNodes.map((node) => {
      const prereqsMet = node.prerequisites.every((prereqId) => (masteryById.get(prereqId) ?? 0) >= UNLOCK_THRESHOLD);
      const status = node.masteryPct >= 100 ? 'MASTERED' as const : node.masteryPct > 0 ? 'ACTIVE' as const : prereqsMet ? 'AVAILABLE' as const : 'LOCKED' as const;
      return { ...node, status };
    });
  }, [hydratedNodes]);
  const selectedNode = statusNodes.find((node) => node.id === selectedNodeId) ?? null;

  const handleGeneratePractice = async (patternTitle: string, subtopicTitle?: string) => {
    setGenerationError(null);
    setLastAttempt({ patternTitle, subtopicTitle });
    setIsGeneratingAi(true);
    try {
      const problem = await onGenerateAiProblem(patternTitle, subtopicTitle);
      if (subtopicTitle) setNodes((current) => current.map((node) => node.title === patternTitle ? { ...node, subtopics: node.subtopics.map((subtopic) => subtopic.title === subtopicTitle ? { ...subtopic, problemCount: subtopic.problemCount + 1, problems: [...(subtopic.problems ?? []), { slug: problem.id, title: problem.title, difficulty: problem.difficulty, custom: true }] } : subtopic) } : node));
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'AI generation did not return a valid problem.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const retryLastAttempt = () => {
    if (!lastAttempt) { setGenerationError(null); return; }
    handleGeneratePractice(lastAttempt.patternTitle, lastAttempt.subtopicTitle);
  };

  return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8f5ed] text-[#17263a] lg:flex-row">
    <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-7 lg:p-9">
      <div className="mx-auto max-w-6xl"><LearningWorld nodes={statusNodes} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} /></div>
    </main>
    <AnimatePresence>{selectedNode && <NodeDetailDrawer node={selectedNode} onClose={() => setSelectedNodeId(null)} onStartPractice={onStartPractice} onGenerateAiProblem={handleGeneratePractice} isGeneratingAi={isGeneratingAi} />}</AnimatePresence>
    <AnimatePresence>
      {generationError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-[#17263a]/50 p-4 backdrop-blur-sm" onClick={() => setGenerationError(null)} role="presentation">
          <motion.div initial={{ scale: 0.9, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 10, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-3xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-6 text-center" role="alertdialog" aria-label="AI generation failed">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border-2 border-b-4 border-rose-400/60 bg-gradient-to-tr from-rose-400 to-orange-300 text-white"><Flame className="h-7 w-7 fill-white/80" /></span>
            <h3 className="text-lg font-black tracking-tight text-[#17263a]">The forge cooled down</h3>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
              The AI smith couldn&apos;t hammer out a new problem just now{lastAttempt?.subtopicTitle ? <> for <span className="font-bold text-[#9b5416]">{lastAttempt.subtopicTitle}</span></> : null}. This usually fixes itself in a moment — take a breath and try again.
            </p>
            {generationError && <p className="mt-3 rounded-xl border-2 border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 break-words">{generationError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button onClick={() => setGenerationError(null)} className="rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-white py-2.5 text-xs font-extrabold uppercase tracking-wide text-slate-600 transition-all hover:bg-[#fff8e9] active:translate-y-[2px] active:border-b-2">Later</button>
              <button onClick={retryLastAttempt} disabled={isGeneratingAi} className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-b-4 border-amber-600/70 bg-gradient-to-r from-amber-500 to-amber-400 py-2.5 text-xs font-black uppercase tracking-wide text-slate-950 transition-all hover:from-amber-400 hover:to-amber-300 active:translate-y-[2px] active:border-b-2 disabled:opacity-60">{isGeneratingAi ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}Try again</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>;
};
export default AlgorithmJourneyMap;
