'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CheckCircle2, Flame } from 'lucide-react';

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  MEDIUM: 'bg-amber-100 border-amber-300 text-amber-700',
  HARD: 'bg-rose-100 border-rose-300 text-rose-700',
};

interface SearchableProblem {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  subtopic?: string | null;
  source?: string;
  description?: string;
  solved: boolean;
}

export default function GlobalProblemSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [problems, setProblems] = useState<SearchableProblem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProblems = async () => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/problems`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setProblems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Global search failed to fetch problems:', err);
      hasFetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // Wide keyword match: every token must hit any of the problem's text fields
  const results = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    return problems
      .filter((p) => {
        const haystack = [
          p.title,
          p.topic,
          p.subtopic || '',
          p.difficulty,
          p.description || '',
        ]
          .join(' ')
          .toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      })
      .slice(0, 8);
  }, [query, problems]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  const handleSelect = (problem: SearchableProblem) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/workspace/${problem.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[highlightIdx]) {
      handleSelect(results[highlightIdx]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full lg:w-80">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            fetchProblems();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search any problem, topic, pattern..."
          className="w-full rounded-2xl border-2 border-b-4 border-[#e3d8c8] bg-white py-2 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border-2 border-[#e8e1d3] bg-[#fffdf8] shadow-xl">
          {isLoading && problems.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs font-bold uppercase tracking-wide text-slate-400">Searching the forge...</p>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
              <Flame className="h-5 w-5 text-amber-300" />
              <p className="text-xs font-bold text-[#17263a]">No problems found for “{query}”</p>
              <p className="text-[11px] text-slate-400">Try a title, topic or pattern name.</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.map((p, idx) => (
                <li key={p.id}>
                  <button
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${idx === highlightIdx ? 'bg-amber-100/70' : 'hover:bg-[#f8f5ed]'}`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-[#17263a]">{p.title}</span>
                        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${DIFFICULTY_STYLES[p.difficulty] || 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                          {p.difficulty}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-medium capitalize text-slate-400">
                        {p.topic}{p.subtopic ? ` · ${p.subtopic}` : ''}
                      </span>
                    </span>
                    {p.solved && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
