'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Sparkles, AlertCircle, ArrowRight, Zap, Trophy, Target } from 'lucide-react';

export type NodeStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'MASTERED' | 'NEEDS_REVIEW';

export interface SkillNodeData {
  id: string;
  title: string;
  status: NodeStatus;
  masteryPct: number;
  description: string;
  subtopicCount: number;
  solvedCount: number;
  prerequisites?: string[];
  x: number;
  y: number;
}

interface SkillConstellationTreeProps {
  nodes: SkillNodeData[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onQuickStart?: (nodeId: string) => void;
}

// Connections between nodes (Prerequisites)
const CONNECTIONS: { from: string; to: string }[] = [
  { from: 'arrays', to: 'hashing' },
  { from: 'arrays', to: 'two-pointers' },
  { from: 'two-pointers', to: 'sliding-window' },
  { from: 'arrays', to: 'stack' },
  { from: 'two-pointers', to: 'binary-search' },
  { from: 'stack', to: 'trees' },
  { from: 'trees', to: 'graphs' },
  { from: 'sliding-window', to: 'dp' },
  { from: 'graphs', to: 'dp' },
];

export const SkillConstellationTree: React.FC<SkillConstellationTreeProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onQuickStart,
}) => {
  const nodeMap = new Map<string, SkillNodeData>(nodes.map((n) => [n.id, n]));

  const getStatusColor = (status: NodeStatus, isSelected: boolean) => {
    switch (status) {
      case 'MASTERED':
        return {
          fill: '#059669', // Emerald
          stroke: isSelected ? '#34d399' : '#10b981',
          bgClass: 'bg-emerald-950/80 border-emerald-500 text-emerald-200',
          glow: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))',
        };
      case 'COMPLETED':
        return {
          fill: '#0d9488', // Teal
          stroke: isSelected ? '#2dd4bf' : '#14b8a6',
          bgClass: 'bg-teal-950/80 border-teal-500 text-teal-200',
          glow: 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.3))',
        };
      case 'ACTIVE':
        return {
          fill: '#d97706', // Amber
          stroke: isSelected ? '#fbbf24' : '#f59e0b',
          bgClass: 'bg-amber-950/90 border-amber-400 text-amber-100',
          glow: 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.6))',
        };
      case 'NEEDS_REVIEW':
        return {
          fill: '#ea580c', // Orange
          stroke: isSelected ? '#fb923c' : '#f97316',
          bgClass: 'bg-orange-950/80 border-orange-500 text-orange-200',
          glow: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.4))',
        };
      case 'AVAILABLE':
        return {
          fill: '#3b82f6', // Blue
          stroke: isSelected ? '#60a5fa' : '#3b82f6',
          bgClass: 'bg-blue-950/60 border-blue-600 text-blue-200',
          glow: 'none',
        };
      case 'LOCKED':
      default:
        return {
          fill: '#1f2937', // Slate dark
          stroke: '#374151',
          bgClass: 'bg-slate-900/50 border-slate-700 text-slate-400 opacity-60',
          glow: 'none',
        };
    }
  };

  return (
    <div className="relative w-full bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 sm:p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Background Subtle Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Top Banner Status Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Pattern Skill Constellation Map
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Data-driven prerequisite map • Click any pattern node to inspect subtopics or start practice
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/50">
            <Check className="w-3.5 h-3.5" /> Mastered
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-800/50">
            <Zap className="w-3.5 h-3.5" /> Active Learning
          </span>
          <span className="flex items-center gap-1.5 text-blue-400 font-medium bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-800/50">
            <Target className="w-3.5 h-3.5" /> Unlocked
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 font-medium bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
            <Lock className="w-3.5 h-3.5" /> Prerequisite Locked
          </span>
        </div>
      </div>

      {/* Responsive SVG Tree Map */}
      <div className="relative w-full h-[460px] sm:h-[500px]">
        <svg className="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Linear Gradients for Connectors */}
            <linearGradient id="conn-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="conn-mastered" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="conn-locked" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#374151" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#374151" stopOpacity="0.4" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* SVG Connector Bezier Curves */}
          {CONNECTIONS.map((conn, idx) => {
            const source = nodeMap.get(conn.from);
            const target = nodeMap.get(conn.to);
            if (!source || !target) return null;

            const sx = typeof source.x === 'number' && !isNaN(source.x) ? source.x : 100;
            const sy = typeof source.y === 'number' && !isNaN(source.y) ? source.y : 100;
            const tx = typeof target.x === 'number' && !isNaN(target.x) ? target.x : 200;
            const ty = typeof target.y === 'number' && !isNaN(target.y) ? target.y : 200;

            const isMasteredConn = source.status === 'MASTERED' && (target.status === 'MASTERED' || target.status === 'ACTIVE' || target.status === 'AVAILABLE');
            const isActiveConn = source.status === 'MASTERED' && target.status === 'ACTIVE';

            // Calculate bezier control points
            const midX = (sx + tx) / 2;
            const pathD = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;

            return (
              <g key={`edge-${conn.from}-${conn.to}-${idx}`}>
                {/* Background Shadow Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                {/* Main Path */}
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={
                    isMasteredConn
                      ? 'url(#conn-mastered)'
                      : isActiveConn
                      ? 'url(#conn-active)'
                      : 'url(#conn-locked)'
                  }
                  strokeWidth={isActiveConn ? 3.5 : isMasteredConn ? 3 : 2}
                  strokeDasharray={isActiveConn ? '6 4' : 'none'}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: idx * 0.08 }}
                  className={isActiveConn ? 'animated-connector' : ''}
                />
              </g>
            );
          })}

          {/* Interactive React / Motion Node Components */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const style = getStatusColor(node.status, isSelected);

            const nx = typeof node.x === 'number' && !isNaN(node.x) ? node.x : 100;
            const ny = typeof node.y === 'number' && !isNaN(node.y) ? node.y : 100;

            return (
              <g
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className="cursor-pointer group"
                style={{ filter: isSelected ? style.glow : 'none' }}
              >
                {/* Outer Pulse Halo for Active Node */}
                {node.status === 'ACTIVE' && (
                  <motion.circle
                    cx={nx}
                    cy={ny}
                    r={36}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeOpacity={0.4}
                    animate={{ r: [34, 42, 34], strokeOpacity: [0.6, 0.1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  />
                )}

                {/* Selected Outer Highlight Ring */}
                {isSelected && (
                  <motion.circle
                    cx={nx}
                    cy={ny}
                    r={34}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  />
                )}

                {/* Main Node Circle */}
                <motion.circle
                  cx={nx}
                  cy={ny}
                  r={26}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />

                {/* Node Center Icon / Progress */}
                <g transform={`translate(${nx - 10}, ${ny - 10})`} className="pointer-events-none">
                  {node.status === 'MASTERED' && <Check className="w-5 h-5 text-white stroke-[3]" />}
                  {node.status === 'ACTIVE' && <Zap className="w-5 h-5 text-white fill-amber-300" />}
                  {node.status === 'NEEDS_REVIEW' && <AlertCircle className="w-5 h-5 text-white" />}
                  {node.status === 'AVAILABLE' && <Target className="w-5 h-5 text-blue-100" />}
                  {node.status === 'LOCKED' && <Lock className="w-5 h-5 text-slate-400" />}
                </g>

                {/* Node Title & Mastery Badge below Node */}
                <text
                  x={nx}
                  y={ny + 44}
                  textAnchor="middle"
                  className={`text-xs font-semibold fill-slate-200 pointer-events-none transition-all ${
                    isSelected ? 'fill-amber-300 text-sm font-bold' : ''
                  }`}
                >
                  {node.title}
                </text>
                <text
                  x={nx}
                  y={ny + 58}
                  textAnchor="middle"
                  className="text-[10px] font-medium fill-slate-400 pointer-events-none"
                >
                  {node.status === 'MASTERED' ? '100% Mastered' : `${node.masteryPct}% Mastery`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default SkillConstellationTree;
