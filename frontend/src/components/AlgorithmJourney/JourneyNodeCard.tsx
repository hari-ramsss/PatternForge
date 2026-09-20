'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Target } from 'lucide-react';

export type JourneyNodeStatus = 'MASTERED' | 'ACTIVE' | 'AVAILABLE' | 'LOCKED';

export interface JourneySubtopic {
  id: string;
  title: string;
  masteryPct: number;
  status: 'MASTERED' | 'PRACTICING' | 'UNEXPLORED';
  problemCount: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  problems?: Array<{ slug: string; title: string; difficulty: string; custom?: boolean }>;
}

export interface JourneyNode {
  id: string;
  title: string;
  category: 'foundations' | 'core-patterns' | 'data-structures' | 'problem-solving';
  status: JourneyNodeStatus;
  masteryPct: number;
  description: string;
  bottleneck?: string;
  prerequisites: string[];
  problemsAvailable: number;
  rewardXp: number;
  defaultSlug: string;
  achievementBadge?: string;
  iconType?: 'check' | 'bullseye' | 'radar' | 'layers' | 'lock';
  subtopics: JourneySubtopic[];
}

interface JourneyNodeCardProps {
  node: JourneyNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  compact?: boolean;
}

export const JourneyNodeCard: React.FC<JourneyNodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  compact = false,
}) => {
  const isMastered = node.status === 'MASTERED';
  const isActive = node.status === 'ACTIVE';
  const isAvailable = node.status === 'AVAILABLE';
  const isLocked = node.status === 'LOCKED';

  // Exact card border & bg colors matching reference image
  const getCardStyle = () => {
    if (isSelected) {
      return 'bg-[#0f172a]/90 border-amber-400 ring-2 ring-amber-500/30 shadow-2xl shadow-amber-500/20 z-20';
    }
    if (isActive) {
      return 'bg-gradient-to-b from-[#1c1409] to-[#0f172a] border-amber-500 shadow-xl shadow-amber-500/20 z-10';
    }
    if (isMastered) {
      return 'bg-[#0b1619]/90 border-emerald-500/70 hover:border-emerald-400 shadow-md shadow-emerald-500/10';
    }
    if (isAvailable) {
      return 'bg-[#0f1b2e]/90 border-blue-500/60 hover:border-blue-400 shadow-md';
    }
    return 'bg-[#0c121e]/80 border-slate-800/80 text-slate-500 opacity-60 hover:opacity-80';
  };

  const getIconContainer = () => {
    if (isMastered) return 'bg-emerald-500 text-slate-950';
    if (isActive) return 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40 animate-pulse';
    if (isAvailable) return 'bg-blue-500/20 text-blue-400 border border-blue-500/40';
    return 'bg-slate-800/80 text-slate-500 border border-slate-700/60';
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => onSelect(node.id)}
      className={`relative w-full rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer select-none group overflow-hidden ${getCardStyle()} ${
        compact ? 'p-3' : 'p-4'
      }`}
      data-node-id={node.id}
    >
      {/* Active Glowing Laser Outline */}
      {isActive && (
        <motion.div
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 opacity-40 blur-xs -z-10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      )}

      {/* Node Content */}
      <div className="flex items-center gap-3">
        {/* Emblem Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getIconContainer()}`}>
          {isMastered && <Check className="w-5 h-5 stroke-[3]" />}
          {isActive && (
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </span>
            </div>
          )}
          {isAvailable && <Target className="w-4 h-4" />}
          {isLocked && <Lock className="w-4 h-4 text-slate-500" />}
        </div>

        {/* Title & Progress Bar */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight">
              {node.title}
            </h4>
            <span
              className={`text-[10px] font-mono font-bold ${
                isMastered
                  ? 'text-emerald-400'
                  : isActive
                  ? 'text-amber-400'
                  : isAvailable
                  ? 'text-blue-400'
                  : 'text-slate-500'
              }`}
            >
              {node.masteryPct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/60 relative">
            <motion.div
              className={`h-full rounded-full ${
                isMastered
                  ? 'bg-emerald-500'
                  : isActive
                  ? 'bg-amber-500'
                  : isAvailable
                  ? 'bg-blue-500'
                  : 'bg-slate-800'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${node.masteryPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JourneyNodeCard;
