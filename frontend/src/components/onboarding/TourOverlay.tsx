'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface TourStep {
  /** CSS selector of the element to spotlight; omit for a centered card. */
  target?: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  vw: number;
  vh: number;
}

const SPOT_PADDING = 10;
const CARD_WIDTH = 320;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function cardPosition(rect: Rect | null, placement: 'top' | 'bottom' | 'left' | 'right'): { top: number; left: number } {
  if (!rect) {
    return {
      top: Math.max(24, window.innerHeight / 2 - 140),
      left: Math.max(12, window.innerWidth / 2 - CARD_WIDTH / 2),
    };
  }
  const gap = 16;
  let top: number;
  let left: number;
  if (placement === 'bottom') {
    top = rect.top + rect.height + gap;
    left = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  } else if (placement === 'left') {
    top = rect.top + rect.height / 2 - 90;
    left = rect.left - CARD_WIDTH - gap;
  } else if (placement === 'right') {
    top = rect.top + rect.height / 2 - 90;
    left = rect.left + rect.width + gap;
  } else {
    top = rect.top - gap - 190;
    left = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  }
  top = clamp(top, 16, rect.vh - 210);
  left = clamp(left, 12, rect.vw - CARD_WIDTH - 12);
  return { top, left };
}

/**
 * Spotlight product tour. Dims the page, cuts a hole around `step.target`
 * and anchors a card next to it. Progress persists to localStorage on
 * finish/skip; render conditionally from the parent.
 */
export default function TourOverlay({
  steps,
  storageKey,
  onComplete,
}: {
  steps: TourStep[];
  storageKey: string;
  onComplete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const finishedRef = useRef(false);
  const step = steps[index];

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* private mode — tour just replays next time */
    }
    onComplete?.();
  }, [storageKey, onComplete]);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!step?.target) {
        setRect({ top: 0, left: 0, width: 0, height: 0, vw, vh });
        return;
      }
      const el = document.querySelector(step.target);
      if (!el) {
        setRect({ top: 0, left: 0, width: 0, height: 0, vw, vh });
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, vw, vh });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [index, step?.target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, steps.length]);

  if (!step) return null;

  const hasSpot = !!(rect && step.target && rect.width > 0);
  const placement = step.placement ?? 'bottom';
  const { top, left } = cardPosition(rect, placement);
  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* Spotlight cut-out: transparent hole + huge shadow dims everything else */}
      {hasSpot && (
        <div
          className="pointer-events-none absolute rounded-2xl transition-all duration-300 ease-out"
          style={{
            top: rect.top - SPOT_PADDING,
            left: rect.left - SPOT_PADDING,
            width: rect.width + SPOT_PADDING * 2,
            height: rect.height + SPOT_PADDING * 2,
            boxShadow: '0 0 0 4px rgba(230,123,31,0.9), 0 0 0 9999px rgba(23, 30, 46, 0.78)',
          }}
        />
      )}
      {/* Click shield so the page isn't interactive mid-tour */}
      <div className="absolute inset-0" />

      <motion.div
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute rounded-2xl border-2 border-b-4 border-[#e8e1d3] bg-[#fffdf8] p-5 shadow-[0_18px_40px_rgba(23,38,58,0.35)]"
        style={{ top, left, width: CARD_WIDTH }}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-black tracking-tight text-[#17263a]">{step.title}</h3>
          <button
            type="button"
            onClick={finish}
            className="rounded-md px-1.5 text-lg leading-none text-slate-400 transition hover:text-slate-700"
            aria-label="Skip tour"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
            {index + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="rounded-xl border-2 border-b-4 border-[#e8e1d3] bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 transition hover:border-[#d9cba8]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
              className="rounded-xl border-2 border-b-4 border-orange-700/30 bg-gradient-to-b from-orange-500 to-amber-400 px-4 py-1.5 text-xs font-black text-white transition hover:brightness-105"
            >
              {isLast ? "Let's go!" : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
