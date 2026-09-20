'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Zap, Target } from 'lucide-react';
import type { JourneyNode as JourneyNodeData } from '../AlgorithmJourney/JourneyNodeCard';
import type { WorldPosition } from './JourneyPath';

export function JourneyNode({ node, position, selected, onSelect, worldHeight }: { node: JourneyNodeData; position: WorldPosition; selected: boolean; onSelect: (id: string) => void; worldHeight: number }) {
  const color = node.status === 'MASTERED' ? '#20a675' : node.status === 'ACTIVE' ? '#f59b16' : node.status === 'AVAILABLE' ? '#358ddd' : '#9aa09e';
  const dark = node.status === 'MASTERED' ? '#14825a' : node.status === 'ACTIVE' ? '#d87812' : node.status === 'AVAILABLE' ? '#246bb0' : '#7d8582';
  const Icon = node.status === 'MASTERED' ? Check : node.status === 'LOCKED' ? Lock : node.status === 'ACTIVE' ? Zap : Target;
  const active = node.status === 'ACTIVE';
  return <motion.button initial={{ opacity: 0, scale: .72, y: 18 }} whileInView={{ opacity: 1, scale: selected ? 1.06 : 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -15% 0px' }} whileHover={{ y: -3, scale: 1.04 }} transition={{ type: 'spring', stiffness: 310, damping: 23 }} onClick={() => onSelect(node.id)} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center focus:outline-none" style={{ left: `${(position.x / 1200) * 100}%`, top: `${(position.y / worldHeight) * 100}%` }} aria-label={`Open ${node.title}`}><span className="relative mx-auto block h-[72px] w-[72px]">{active && <svg viewBox="0 0 120 120" className="absolute -inset-[11px] h-[94px] w-[94px]"><circle cx="60" cy="60" r="51" fill="none" stroke="#fff6d8" strokeWidth="9"/><motion.circle cx="60" cy="60" r="51" fill="none" stroke="#f5b72f" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${node.masteryPct * 3.2} 327`} transform="rotate(-90 60 60)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .8 }}/></svg>}<span className="absolute inset-x-0 bottom-0 top-2 rounded-full" style={{ background: dark }}/><span className="absolute inset-x-0 bottom-2 top-0 grid place-items-center rounded-full border-4 border-white shadow-[0_6px_14px_rgba(45,78,66,.18)]" style={{ background: color }}><Icon size={active ? 31 : 29} strokeWidth={3} color="white" fill={active ? 'white' : 'none'}/></span></span><span className="mt-2 block max-w-36 rounded-xl border border-white/90 bg-white/95 px-3 py-1.5 text-xs font-extrabold text-slate-800 shadow-sm">{node.title}<span className="ml-1 text-[10px]" style={{ color }}>{node.masteryPct}%</span></span></motion.button>;
}
