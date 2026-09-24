'use client';

import { motion } from 'framer-motion';
import { AppWindow, ArrowDownUp, Atom, Binary, Boxes, Brackets, Combine, Database, Gauge, GitBranch, Layers, Layers3, Link2, ListTree, MoveHorizontal, Network, RefreshCw, Repeat, Search, Sigma, Timer, Type, Undo2, Zap } from 'lucide-react';
import type { JourneyNode as JourneyNodeData } from '../AlgorithmJourney/JourneyNodeCard';
import type { WorldPosition } from './JourneyPath';

// A permanent, topic-relevant emblem per node — no longer swapped by status
const TOPIC_ICONS: Record<string, typeof Brackets> = {
  'arrays': Brackets,
  'hashing': Database,
  'strings': Type,
  'sorting': ArrowDownUp,
  'prefix-sum': Sigma,
  'two-pointers': MoveHorizontal,
  'binary-search': Search,
  'sliding-window': AppWindow,
  'stack': Layers,
  'queue-deque': Repeat,
  'linked-list': Link2,
  'heaps': Gauge,
  'intervals': Timer,
  'recursion': RefreshCw,
  'trees': ListTree,
  'backtracking': Undo2,
  'graphs': GitBranch,
  'greedy': Zap,
  'union-find': Combine,
  'dp': Layers3,
  'trie': Network,
  'bit-manipulation': Binary,
  'advanced-patterns': Atom,
};

export function JourneyNode({ node, position, selected, onSelect, worldHeight }: { node: JourneyNodeData; position: WorldPosition; selected: boolean; onSelect: (id: string) => void; worldHeight: number }) {
  const color = node.status === 'MASTERED' ? '#20a675' : node.status === 'ACTIVE' ? '#f59b16' : node.status === 'AVAILABLE' ? '#358ddd' : '#9aa09e';
  const dark = node.status === 'MASTERED' ? '#14825a' : node.status === 'ACTIVE' ? '#d87812' : node.status === 'AVAILABLE' ? '#246bb0' : '#7d8582';
  const Icon = TOPIC_ICONS[node.id] ?? Boxes;
  const active = node.status === 'ACTIVE';
  return <motion.button initial={{ opacity: 0, scale: .72, y: 18 }} whileInView={{ opacity: 1, scale: selected ? 1.06 : 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -15% 0px' }} whileHover={{ y: -3, scale: 1.04 }} transition={{ type: 'spring', stiffness: 310, damping: 23 }} onClick={() => onSelect(node.id)} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center focus:outline-none" style={{ left: `${(position.x / 1200) * 100}%`, top: `${(position.y / worldHeight) * 100}%` }} aria-label={`Open ${node.title}`}><span className="relative mx-auto block h-[72px] w-[72px]">{active && <svg viewBox="0 0 120 120" className="absolute -inset-[11px] h-[94px] w-[94px]"><circle cx="60" cy="60" r="51" fill="none" stroke="#fff6d8" strokeWidth="9"/><motion.circle cx="60" cy="60" r="51" fill="none" stroke="#f5b72f" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${node.masteryPct * 3.2} 327`} transform="rotate(-90 60 60)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .8 }}/></svg>}<span className="absolute inset-x-0 bottom-0 top-2 rounded-full" style={{ background: dark }}/><span className="absolute inset-x-0 bottom-2 top-0 grid place-items-center rounded-full border-4 border-white shadow-[0_6px_14px_rgba(45,78,66,.18)]" style={{ background: color }}><Icon size={active ? 31 : 29} strokeWidth={3} color="white" /></span></span><span className="mt-2 block max-w-36 rounded-xl border border-white/90 bg-white/95 px-3 py-1.5 text-xs font-extrabold text-slate-800 shadow-sm">{node.title}<span className="ml-1 text-[10px]" style={{ color }}>{node.masteryPct}%</span></span></motion.button>;
}
