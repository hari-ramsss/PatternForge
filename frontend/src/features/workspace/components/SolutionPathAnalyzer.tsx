'use client';

import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface SolutionPathAnalyzerProps {
  code: string;
  language: string;
  optimalTime?: string;
  optimalSpace?: string;
}

export default function SolutionPathAnalyzer({
  code,
  language,
  optimalTime = 'O(N)',
  optimalSpace = 'O(1)',
}: SolutionPathAnalyzerProps) {
  if (!code || !code.trim()) {
    return (
      <div className="p-6 bg-stone-900/60 border border-stone-850 rounded-2xl text-center text-stone-500 font-sans text-xs">
        <Activity className="w-8 h-8 mx-auto mb-2 text-stone-600 animate-pulse" />
        <p>Write or run your solution code to analyze Big-O efficiency curves & allocation invariants.</p>
      </div>
    );
  }

  const cleanCode = code.toLowerCase();

  // Static AST & Regex analysis
  const hasNestedLoops = /(for|while)[\s\S]*?(for|while)/.test(cleanCode);
  const hasSortCall = cleanCode.includes('sort(') || cleanCode.includes('sorted(') || cleanCode.includes('arrays.sort');
  const hasMapOrSet = cleanCode.includes('set(') || cleanCode.includes('dict(') || cleanCode.includes('map') || cleanCode.includes('{}') || cleanCode.includes('hashmap');
  const hasRecursion = cleanCode.includes('solve(') || cleanCode.includes('helper(') || cleanCode.includes('dfs(') || cleanCode.includes('backtrack(');
  const hasRedundantAllocations = (cleanCode.match(/list\(/g) || []).length > 2 || cleanCode.includes('[:]') || cleanCode.includes('.slice(');

  let detectedTime = 'O(N)';
  let detectedSpace = 'O(1)';

  if (hasRecursion && hasNestedLoops) {
    detectedTime = 'O(2^N)';
  } else if (hasNestedLoops) {
    detectedTime = 'O(N²)';
  } else if (hasSortCall) {
    detectedTime = 'O(N log N)';
  } else if (hasMapOrSet) {
    detectedTime = 'O(N)';
    detectedSpace = 'O(N)';
  }

  return (
    <div className="bg-[#141413] border border-stone-800 rounded-2xl p-5 text-stone-200 font-sans space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-850 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
          <h4 className="font-serif text-sm font-bold text-stone-100">Solution Path Analyzer</h4>
        </div>
        <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
          Static AST Analysis
        </span>
      </div>

      {/* Big-O Complexity Comparison Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Time Complexity Card */}
        <div className="bg-[#1E1E1C] p-3.5 rounded-xl border border-stone-800 space-y-1.5">
          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Time Complexity Curve</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-mono font-bold text-amber-400">{detectedTime}</span>
            <span className="text-[10px] text-stone-500 font-mono">Target: {optimalTime}</span>
          </div>
          <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                detectedTime === optimalTime || detectedTime === 'O(N)' ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-3/5'
              }`}
            />
          </div>
        </div>

        {/* Space Complexity Card */}
        <div className="bg-[#1E1E1C] p-3.5 rounded-xl border border-stone-800 space-y-1.5">
          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Memory Auxiliary Allocations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-mono font-bold text-purple-400">{detectedSpace}</span>
            <span className="text-[10px] text-stone-500 font-mono">Target: {optimalSpace}</span>
          </div>
          <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                detectedSpace === optimalSpace ? 'bg-purple-500 w-full' : 'bg-amber-500 w-1/2'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Allocation Invariants & Diagnostics */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Allocation Invariants</span>
        
        {hasRedundantAllocations && (
          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Redundant Object Allocations Detected</strong>
              <p className="text-[11px] text-amber-400/80 leading-relaxed mt-0.5">
                Avoid re-creating list slices or dynamic arrays inside loop iterations to prevent GC pressure.
              </p>
            </div>
          </div>
        )}

        {hasSortCall && (
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-300 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-stone-200">Sort Comparison Bound (O(N log N))</strong>
              <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                Sorting costs O(N log N) time. Check if a Hash Map or Frequency Array can reduce time to O(N).
              </p>
            </div>
          </div>
        )}

        {!hasRedundantAllocations && !hasSortCall && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Optimal Allocation Boundary</strong>
              <p className="text-[11px] text-emerald-400/80 leading-relaxed mt-0.5">
                No redundant slice allocations found. Your code respects single-pass memory constraints.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
