'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ConnectorProps {
  status?: 'mastered' | 'active' | 'available' | 'locked';
  height?: number;
}

export const VerticalConnector: React.FC<ConnectorProps> = ({
  status = 'locked',
  height = 56,
}) => {
  const isMastered = status === 'mastered';
  const isActive = status === 'active';

  const mainColor = isMastered ? '#10b981' : isActive ? '#f59e0b' : '#1e293b';
  const glowColor = isMastered ? 'rgba(16, 185, 129, 0.4)' : isActive ? 'rgba(245, 158, 11, 0.5)' : 'transparent';

  return (
    <div className="flex justify-center items-center w-full relative" style={{ height: `${height}px` }}>
      <svg width="40" height={height} className="overflow-visible">
        <defs>
          <filter id={`vert-glow-${status}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="laser-pulse" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Ambient Glow Aura Path */}
        {(isMastered || isActive) && (
          <path
            d={`M 20 0 L 20 ${height}`}
            stroke={glowColor}
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}

        {/* Core Wire Path */}
        <motion.path
          d={`M 20 0 L 20 ${height}`}
          stroke={isActive ? 'url(#laser-pulse)' : mainColor}
          strokeWidth={isActive ? 3.5 : isMastered ? 2.5 : 2}
          strokeDasharray={isMastered || isActive ? 'none' : '4 4'}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Dynamic Traveling Energy Core along active connector */}
        {isActive && (
          <>
            <motion.circle
              r="4"
              fill="#fbbf24"
              filter={`url(#vert-glow-${status})`}
              animate={{ cy: [0, height] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
              cx="20"
            />
            <motion.circle
              r="1.8"
              fill="#ffffff"
              animate={{ cy: [0, height] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
              cx="20"
            />
          </>
        )}

        {isMastered && (
          <motion.circle
            r="3"
            fill="#34d399"
            animate={{ cy: [0, height], opacity: [0, 0.8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            cx="20"
          />
        )}
      </svg>
    </div>
  );
};

interface ForkConnectorProps {
  statusLeft?: 'mastered' | 'active' | 'available' | 'locked';
  statusRight?: 'mastered' | 'active' | 'available' | 'locked';
  height?: number;
}

export const ForkConnector: React.FC<ForkConnectorProps> = ({
  statusLeft = 'active',
  statusRight = 'available',
  height = 64,
}) => {
  const isLeftActive = statusLeft === 'active';
  const isLeftMastered = statusLeft === 'mastered';
  const leftColor = isLeftMastered ? '#10b981' : isLeftActive ? '#f59e0b' : '#1e293b';

  const isRightActive = statusRight === 'active';
  const isRightMastered = statusRight === 'mastered';
  const rightColor = isRightMastered ? '#10b981' : isRightActive ? '#f59e0b' : '#1e293b';

  return (
    <div className="w-full flex justify-center py-1 relative" style={{ height: `${height}px` }}>
      <svg
        className="w-full max-w-2xl h-full overflow-visible"
        viewBox="0 0 400 64"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="fork-active-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {/* Center Stem Drop */}
        <motion.path
          d="M 200 0 L 200 28"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Center Junction Node */}
        <motion.circle
          cx="200"
          cy="28"
          r="4"
          fill="#10b981"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        />

        {/* Left Branch */}
        <motion.path
          d="M 200 28 Q 200 36 190 36 L 105 36 Q 95 36 95 44 L 95 64"
          stroke={isLeftActive ? 'url(#fork-active-grad)' : leftColor}
          strokeWidth={isLeftActive ? 3.5 : isLeftMastered ? 2.5 : 2}
          strokeDasharray={isLeftMastered || isLeftActive ? 'none' : '4 4'}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        />

        {/* Right Branch */}
        <motion.path
          d="M 200 28 Q 200 36 210 36 L 295 36 Q 305 36 305 44 L 305 64"
          stroke={rightColor}
          strokeWidth={isRightActive ? 3.5 : isRightMastered ? 2.5 : 2}
          strokeDasharray={isRightMastered || isRightActive ? 'none' : '4 4'}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        />

        {/* Animated Traveling Pulse on active branch */}
        {isLeftActive && (
          <motion.circle
            r="3"
            fill="#fef08a"
            animate={{
              cx: [200, 200, 105, 95, 95],
              cy: [0, 28, 36, 44, 64],
            }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
          />
        )}
      </svg>
    </div>
  );
};
