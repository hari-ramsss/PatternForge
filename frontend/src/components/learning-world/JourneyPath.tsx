'use client';

import { motion } from 'framer-motion';
import type { JourneyNode } from '../AlgorithmJourney/JourneyNodeCard';
export type WorldPosition = { x: number; y: number };
export function JourneyPath({ nodes, positions }: { nodes: JourneyNode[]; positions: Map<string, WorldPosition> }) {
  return <g>{nodes.flatMap((node) => node.prerequisites.map((parentId) => {
    const a = positions.get(parentId); const b = positions.get(node.id); if (!a || !b) return null;
    const progress = node.status === 'LOCKED' ? '#b7bea9' : node.status === 'AVAILABLE' ? '#91a99b' : node.status === 'ACTIVE' ? '#f28a24' : '#36aa7a';
    const path = `M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`;
    return <g key={`${parentId}-${node.id}`}><path d={path} fill="none" stroke="#fff8e6" strokeWidth="18" strokeLinecap="round" opacity=".76"/><motion.path d={path} fill="none" stroke={progress} strokeWidth="7" strokeLinecap="round" strokeDasharray={node.status === 'LOCKED' ? '3 13' : undefined} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .8, delay: .15 }} />{node.status === 'ACTIVE' && <motion.path d={path} fill="none" stroke="#ffd263" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 18" animate={{ strokeDashoffset: [0, -38] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}/>}</g>;
  }))}</g>;
}
