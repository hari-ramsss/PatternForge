'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { JourneyNode, JourneyNodeStatus, JourneySubtopic } from './JourneyNodeCard';
import NodeDetailDrawer from './NodeDetailDrawer';
import { LearningWorld } from '../learning-world/LearningWorld';

type GeneratedProblem = { id: string; title: string; difficulty: string; subtopic?: string | null };
type SavedProblem = { id: string; title: string; difficulty: string; topic?: string; subtopic?: string | null; solved?: boolean };
type CurriculumEntry = { id: string; topic: string; title: string; sortOrder: number; canonicalSlug?: string | null; canonicalTitle?: string | null; problemAssignments?: Array<{ role: string; problem: { id: string; title: string; difficulty: string } }> };
interface AlgorithmJourneyMapProps { initialNodes: JourneyNode[]; existingProblems: SavedProblem[]; curriculum?: CurriculumEntry[]; onStartPractice: (slug: string) => void; onGenerateAiProblem: (patternTitle: string, subtopicTitle?: string) => Promise<GeneratedProblem>; }

export const AlgorithmJourneyMap: React.FC<AlgorithmJourneyMapProps> = ({ initialNodes, existingProblems, curriculum = [], onStartPractice, onGenerateAiProblem }) => {
  const [nodes, setNodes] = useState<JourneyNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sliding-window');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // A linked problem counts as solved when the live problem list marks it solved
  // (matched by slug, falling back to a case-insensitive title match).
  const isProblemSolved = (slug: string, title: string) => existingProblems.some((problem) => (problem.id === slug || problem.title.trim().toLowerCase() === title.trim().toLowerCase()) && problem.solved);

  const hydratedNodes = useMemo(() => {
    const computed = nodes.map((node) => {
      const catalogEntries = curriculum.filter((entry) => entry.topic.trim().toLowerCase() === node.title.trim().toLowerCase() || (node.title === 'Advanced Patterns' && entry.topic === 'Advanced Patterns & Sums'));
      const sourceSubtopics = catalogEntries.length > 0
        ? catalogEntries.map((entry) => ({ id: entry.id, title: entry.title, masteryPct: 0, status: 'UNEXPLORED' as const, problemCount: entry.problemAssignments?.length ?? 0, problems: (entry.problemAssignments ?? []).map((assignment) => ({ slug: assignment.problem.id, title: assignment.problem.title, difficulty: assignment.problem.difficulty })) }))
        : node.subtopics;
      const subtopics: JourneySubtopic[] = sourceSubtopics.map((subtopic) => {
        const savedForSubtopic = existingProblems.filter((problem) => problem.topic?.trim().toLowerCase() === node.title.toLowerCase() && problem.subtopic?.trim().toLowerCase() === subtopic.title.toLowerCase()).map((problem) => ({ slug: problem.id, title: problem.title, difficulty: problem.difficulty, custom: true }));
        const mergedProblems = [...(subtopic.problems ?? [])];
        savedForSubtopic.forEach((problem) => { if (!mergedProblems.some((candidate) => candidate.slug === problem.slug || candidate.title.trim().toLowerCase() === problem.title.trim().toLowerCase())) mergedProblems.push(problem); });
        const solvedCount = mergedProblems.filter((problem) => isProblemSolved(problem.slug, problem.title)).length;
        const masteryPct = mergedProblems.length > 0 ? Math.round((solvedCount / mergedProblems.length) * 100) : 0;
        return { ...subtopic, problems: mergedProblems, problemCount: Math.max(subtopic.problemCount, mergedProblems.length), masteryPct, status: masteryPct >= 100 ? 'MASTERED' as const : masteryPct > 0 ? 'PRACTICING' as const : 'UNEXPLORED' as const };
      });

      const totalProblems = subtopics.reduce((sum, subtopic) => sum + (subtopic.problems?.length ?? 0), 0);
      const solvedProblems = subtopics.reduce((sum, subtopic) => sum + (subtopic.problems ?? []).filter((problem) => isProblemSolved(problem.slug, problem.title)).length, 0);
      return { ...node, subtopics, masteryPct: totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0 };
    });

    // Live statuses driven by solved counts: fully solved topics are MASTERED,
    // the first incomplete topic on the path is ACTIVE, later partially-solved
    // ones are AVAILABLE, and untouched ones stay LOCKED.
    const activeIndex = computed.findIndex((node) => node.masteryPct < 100);
    return computed.map((node, index): JourneyNode => ({
      ...node,
      status: (activeIndex === -1 || index < activeIndex ? 'MASTERED' : index === activeIndex ? 'ACTIVE' : node.masteryPct > 0 ? 'AVAILABLE' : 'LOCKED') as JourneyNodeStatus,
    }));
  }, [nodes, existingProblems, curriculum]);
  const selectedNode = hydratedNodes.find((node) => node.id === selectedNodeId) ?? null;

  const handleGeneratePractice = async (patternTitle: string, subtopicTitle?: string) => { setGenerationError(null); setIsGeneratingAi(true); try { const problem = await onGenerateAiProblem(patternTitle, subtopicTitle); if (subtopicTitle) setNodes((current) => current.map((node) => node.title === patternTitle ? { ...node, subtopics: node.subtopics.map((subtopic) => subtopic.title === subtopicTitle ? { ...subtopic, problemCount: subtopic.problemCount + 1, problems: [...(subtopic.problems ?? []), { slug: problem.id, title: problem.title, difficulty: problem.difficulty, custom: true }] } : subtopic) } : node)); } catch (error) { setGenerationError(error instanceof Error ? error.message : 'AI generation did not return a valid problem.'); } finally { setIsGeneratingAi(false); } };

  return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8f5ed] text-[#17263a] lg:flex-row">
    <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-7 lg:p-9">
      <div className="mx-auto max-w-6xl"><LearningWorld nodes={hydratedNodes} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} /></div>
    </main>
    <AnimatePresence>{selectedNode && <NodeDetailDrawer node={selectedNode} onClose={() => setSelectedNodeId(null)} onStartPractice={onStartPractice} onGenerateAiProblem={handleGeneratePractice} isGeneratingAi={isGeneratingAi} generationError={generationError} />}</AnimatePresence>
  </div>;
};
export default AlgorithmJourneyMap;
