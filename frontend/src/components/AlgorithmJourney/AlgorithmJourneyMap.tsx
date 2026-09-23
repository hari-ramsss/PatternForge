'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { JourneyNode } from './JourneyNodeCard';
import NodeDetailDrawer from './NodeDetailDrawer';
import { LearningWorld } from '../learning-world/LearningWorld';

type GeneratedProblem = { id: string; title: string; difficulty: string; subtopic?: string | null };
type SavedProblem = { id: string; title: string; difficulty: string; topic?: string; subtopic?: string | null };
type CurriculumEntry = { id: string; topic: string; title: string; sortOrder: number; canonicalSlug?: string | null; canonicalTitle?: string | null; problemAssignments?: Array<{ role: string; problem: { id: string; title: string; difficulty: string } }> };
interface AlgorithmJourneyMapProps { initialNodes: JourneyNode[]; existingProblems: SavedProblem[]; curriculum?: CurriculumEntry[]; onStartPractice: (slug: string) => void; onGenerateAiProblem: (patternTitle: string, subtopicTitle?: string) => Promise<GeneratedProblem>; }

export const AlgorithmJourneyMap: React.FC<AlgorithmJourneyMapProps> = ({ initialNodes, existingProblems, curriculum = [], onStartPractice, onGenerateAiProblem }) => {
  const [nodes, setNodes] = useState<JourneyNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sliding-window');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const hydratedNodes = useMemo(() => nodes.map((node) => {
    const catalogEntries = curriculum.filter((entry) => entry.topic.trim().toLowerCase() === node.title.trim().toLowerCase() || (node.title === 'Advanced Patterns' && entry.topic === 'Advanced Patterns & Sums'));
    const sourceSubtopics = catalogEntries.length > 0
      ? catalogEntries.map((entry) => ({ id: entry.id, title: entry.title, masteryPct: 0, status: 'UNEXPLORED' as const, problemCount: entry.problemAssignments?.length ?? 0, problems: (entry.problemAssignments ?? []).map((assignment) => ({ slug: assignment.problem.id, title: assignment.problem.title, difficulty: assignment.problem.difficulty })) }))
      : node.subtopics;
    return {
      ...node, subtopics: sourceSubtopics.map((subtopic) => {
        const savedForSubtopic = existingProblems.filter((problem) => problem.topic?.trim().toLowerCase() === node.title.toLowerCase() && problem.subtopic?.trim().toLowerCase() === subtopic.title.toLowerCase()).map((problem) => ({ slug: problem.id, title: problem.title, difficulty: problem.difficulty, custom: true }));
        const mergedProblems = [...(subtopic.problems ?? [])];
        savedForSubtopic.forEach((problem) => { if (!mergedProblems.some((candidate) => candidate.slug === problem.slug)) mergedProblems.push(problem); });
        return { ...subtopic, problems: mergedProblems, problemCount: Math.max(subtopic.problemCount, mergedProblems.length) };
      })
    };
  }), [nodes, existingProblems, curriculum]);
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
