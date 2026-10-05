'use client';

import React from 'react';

type Side = 'top' | 'bottom' | 'left' | 'right';

const POSITION_CLASSES: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: Side;
  className?: string;
}

/**
 * Lightweight CSS-only tooltip. Wraps a trigger element in a hover group and
 * shows `label` above/beside it. The trigger must accept a className if you
 * pass one — otherwise wrap it in an inline-flex span automatically.
 */
export default function Tooltip({ label, children, side = 'top', className = '' }: TooltipProps) {
  return (
    <span className={`group/tt relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[90] whitespace-pre-line rounded-lg bg-stone-900 px-2.5 py-1.5 text-center text-[11px] font-bold leading-snug text-amber-50 opacity-0 shadow-[0_4px_14px_rgba(23,38,58,0.35)] transition-opacity duration-150 group-hover/tt:opacity-100 ${POSITION_CLASSES[side]}`}
      >
        {label}
      </span>
    </span>
  );
}
