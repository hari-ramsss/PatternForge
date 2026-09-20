'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { JourneyNode } from './JourneyNodeCard';
import NodeDetailDrawer from './NodeDetailDrawer';
import AiGenerateSubtopicModal from './AiGenerateSubtopicModal';
import { LearningWorld } from '../learning-world/LearningWorld';

type GeneratedProblem = { id: string; title: string; difficulty: string; subtopic?: string | null };
type SavedProblem = { id: string; title: string; difficulty: string; topic?: string; subtopic?: string | null };
type GeneratedSubtopic = { id: string; title: string; patternTitle: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; masteryPct: number; status: 'UNEXPLORED'; problemCount: number; problems?: Array<{ slug: string; title: string; difficulty: string; custom?: boolean }> };
interface AlgorithmJourneyMapProps { initialNodes: JourneyNode[]; existingProblems: SavedProblem[]; persistedSubtopics?: GeneratedSubtopic[]; onStartPractice: (slug: string) => void; onGenerateAiProblem: (patternTitle: string, subtopicTitle?: string) => Promise<GeneratedProblem>; onGenerateAiSubtopic: (patternTitle: string, existingSubtopics: string[], difficulty: 'EASY' | 'MEDIUM' | 'HARD', focus: string) => Promise<GeneratedSubtopic>; }

export const AlgorithmJourneyMap: React.FC<AlgorithmJourneyMapProps> = ({ initialNodes, existingProblems, persistedSubtopics = [], onStartPractice, onGenerateAiProblem, onGenerateAiSubtopic }) => {
  const [nodes, setNodes] = useState<JourneyNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sliding-window');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const hydratedNodes = useMemo(() => nodes.map((node) => {
    const persistedForNode = persistedSubtopics.filter((subtopic) => subtopic.patternTitle.trim().toLowerCase() === node.title.toLowerCase());
    const allSubtopics = [...node.subtopics];
    persistedForNode.forEach((subtopic) => { if (!allSubtopics.some((candidate) => candidate.id === subtopic.id)) allSubtopics.push(subtopic); });
    return {
      ...node, subtopics: allSubtopics.map((subtopic) => {
        const savedForSubtopic = existingProblems.filter((problem) => problem.topic?.trim().toLowerCase() === node.title.toLowerCase() && problem.subtopic?.trim().toLowerCase() === subtopic.title.toLowerCase()).map((problem) => ({ slug: problem.id, title: problem.title, difficulty: problem.difficulty, custom: true }));
        const mergedProblems = [...(subtopic.problems ?? [])];
        savedForSubtopic.forEach((problem) => { if (!mergedProblems.some((candidate) => candidate.slug === problem.slug)) mergedProblems.push(problem); });
        return { ...subtopic, problems: mergedProblems, problemCount: Math.max(subtopic.problemCount, mergedProblems.length) };
      })
    };
  }), [nodes, existingProblems, persistedSubtopics]);
  const selectedNode = hydratedNodes.find((node) => node.id === selectedNodeId) ?? null;

  const handleGenerateSubtopic = async (focus: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') => {
    if (!selectedNodeId) throw new Error('Select a pattern before generating a subtopic.');
    const selected = nodes.find((node) => node.id === selectedNodeId);
    if (!selected) throw new Error('The selected pattern is no longer available.');
    const subtopic = await onGenerateAiSubtopic(selected.title, selected.subtopics.map((item) => item.title), difficulty, focus);
    setNodes((current) => current.map((node) => node.id === selectedNodeId && !node.subtopics.some((item) => item.id === subtopic.id) ? { ...node, subtopics: [...node.subtopics, subtopic] } : node));
  };
  const handleGeneratePractice = async (patternTitle: string, subtopicTitle?: string) => { setGenerationError(null); setIsGeneratingAi(true); try { const problem = await onGenerateAiProblem(patternTitle, subtopicTitle); if (subtopicTitle) setNodes((current) => current.map((node) => node.title === patternTitle ? { ...node, subtopics: node.subtopics.map((subtopic) => subtopic.title === subtopicTitle ? { ...subtopic, problemCount: subtopic.problemCount + 1, problems: [...(subtopic.problems ?? []), { slug: problem.id, title: problem.title, difficulty: problem.difficulty, custom: true }] } : subtopic) } : node)); } catch (error) { setGenerationError(error instanceof Error ? error.message : 'AI generation did not return a valid problem.'); } finally { setIsGeneratingAi(false); } };

  return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8f5ed] text-[#17263a] lg:flex-row">
    <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-7 lg:p-9">
      <div className="mx-auto max-w-6xl"><LearningWorld nodes={hydratedNodes} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} /></div>
    </main>
    <AnimatePresence>{selectedNode && <NodeDetailDrawer node={selectedNode} onClose={() => setSelectedNodeId(null)} onStartPractice={onStartPractice} onOpenAiSubtopicModal={() => setAiModalOpen(true)} onGenerateAiProblem={handleGeneratePractice} isGeneratingAi={isGeneratingAi} generationError={generationError} />}</AnimatePresence>
    <AiGenerateSubtopicModal isOpen={aiModalOpen} conceptTitle={selectedNode?.title ?? ''} onClose={() => setAiModalOpen(false)} onGenerateSubtopic={handleGenerateSubtopic} />
  </div>;
};
export default AlgorithmJourneyMap;
