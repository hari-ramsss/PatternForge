'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  Flag,
  Compass,
  Star,
  BrainCircuit,
  Zap,
  Flame,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Compass as CompassIcon,
  ChevronRight,
} from 'lucide-react';
import DeleteConfirmationModal from '../../features/workspace/components/DeleteConfirmationModal';
import AlgorithmJourneyMap from '../../components/AlgorithmJourney/AlgorithmJourneyMap';
import { JourneyNode } from '../../components/AlgorithmJourney/JourneyNodeCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const INITIAL_JOURNEY_NODES: JourneyNode[] = [
  // LEVEL 1: FOUNDATIONS
  {
    id: 'arrays',
    title: 'Arrays',
    category: 'foundations',
    status: 'MASTERED',
    masteryPct: 92,
    description: 'Contiguous memory, indexing, and array traversals.',
    prerequisites: [],
    problemsAvailable: 18,
    rewardXp: 200,
    defaultSlug: 'two-sum',
    achievementBadge: '🏆 First Array',
    subtopics: [
      { id: 'arr-sub', title: 'Subarray Boundaries', masteryPct: 95, status: 'MASTERED', problemCount: 6, problems: [{ slug: 'two-sum', title: 'Two Sum', difficulty: 'EASY' }] },
    ],
  },
  {
    id: 'hashing',
    title: 'Hashing',
    category: 'foundations',
    status: 'MASTERED',
    masteryPct: 100,
    description: 'Hash maps, set lookups, O(1) key searching.',
    prerequisites: ['arrays'],
    problemsAvailable: 15,
    rewardXp: 250,
    defaultSlug: 'contains-duplicate',
    achievementBadge: '🏆 10 Solved',
    subtopics: [
      { id: 'hash-freq', title: 'Frequency Buckets', masteryPct: 100, status: 'MASTERED', problemCount: 8, problems: [{ slug: 'top-k-frequent-elements', title: 'Top K Frequent Elements', difficulty: 'MEDIUM' }] },
    ],
  },
  {
    id: 'strings',
    title: 'Strings',
    category: 'foundations',
    status: 'MASTERED',
    masteryPct: 88,
    description: 'ASCII char code indexing and string building.',
    prerequisites: ['hashing'],
    problemsAvailable: 12,
    rewardXp: 220,
    defaultSlug: 'valid-palindrome',
    subtopics: [
      { id: 'str-freq', title: 'Char Codes', masteryPct: 90, status: 'MASTERED', problemCount: 6, problems: [{ slug: 'group-anagrams', title: 'Group Anagrams', difficulty: 'MEDIUM' }] },
    ],
  },
  {
    id: 'sorting',
    title: 'Sorting',
    category: 'foundations',
    status: 'MASTERED',
    masteryPct: 82,
    description: 'Custom comparators, merge sort, quickselect.',
    prerequisites: ['strings'],
    problemsAvailable: 10,
    rewardXp: 260,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'sort-sub', title: 'In-Place Partitioning', masteryPct: 85, status: 'MASTERED', problemCount: 4 },
    ],
  },
  {
    id: 'prefix-sum',
    title: 'Prefix Sum',
    category: 'foundations',
    status: 'MASTERED',
    masteryPct: 85,
    description: 'Cumulative range sum queries in O(1) time.',
    prerequisites: ['sorting'],
    problemsAvailable: 8,
    rewardXp: 240,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'cum-sum', title: 'Cumulative Array', masteryPct: 88, status: 'MASTERED', problemCount: 4 },
    ],
  },

  // LEVEL 2: POINTERS & SEARCH RANGES
  {
    id: 'two-pointers',
    title: 'Two Pointers',
    category: 'core-patterns',
    status: 'MASTERED',
    masteryPct: 100,
    description: 'Converging and same-direction pointer scans.',
    prerequisites: ['hashing'],
    problemsAvailable: 16,
    rewardXp: 280,
    defaultSlug: 'valid-palindrome',
    achievementBadge: '🏆 Pattern Unlocked',
    subtopics: [
      { id: 'opp-ends', title: 'Opposite Ends Convergence', masteryPct: 100, status: 'MASTERED', problemCount: 8, problems: [{ slug: 'valid-palindrome', title: 'Valid Palindrome', difficulty: 'EASY' }] },
    ],
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    category: 'core-patterns',
    status: 'AVAILABLE',
    masteryPct: 45,
    description: 'Logarithmic search space and monotonic functions.',
    prerequisites: ['two-pointers'],
    problemsAvailable: 12,
    rewardXp: 350,
    defaultSlug: 'binary-search',
    subtopics: [
      { id: 'search-range', title: 'Lower/Upper Bounds', masteryPct: 50, status: 'PRACTICING', problemCount: 6, problems: [{ slug: 'binary-search', title: 'Binary Search', difficulty: 'EASY' }] },
    ],
  },

  // LEVEL 3: CONTIGUOUS WINDOWS
  {
    id: 'sliding-window',
    title: 'Sliding Window',
    category: 'core-patterns',
    status: 'ACTIVE',
    masteryPct: 62,
    description: 'Control variable contiguous windows without O(N^2) loops.',
    bottleneck: 'Knowing when to shrink the left window boundary without redundant scans.',
    prerequisites: ['two-pointers'],
    problemsAvailable: 14,
    rewardXp: 320,
    defaultSlug: 'longest-substring-without-repeating-characters',
    subtopics: [
      { id: 'fixed-w', title: 'Fixed Window', masteryPct: 91, status: 'MASTERED', problemCount: 4, problems: [{ slug: 'maximum-subarray', title: 'Maximum Subarray Sum', difficulty: 'MEDIUM' }] },
      { id: 'var-w', title: 'Variable Window', masteryPct: 48, status: 'PRACTICING', problemCount: 5, problems: [{ slug: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeat', difficulty: 'MEDIUM' }] },
      { id: 'bound-cond', title: 'Boundary Conditions', masteryPct: 31, status: 'PRACTICING', problemCount: 3 },
    ],
  },

  // LEVEL 4: LIFO & FIFO BUFFERS
  {
    id: 'stack',
    title: 'Stack',
    category: 'core-patterns',
    status: 'MASTERED',
    masteryPct: 85,
    description: 'LIFO evaluation and monotonic stack spans.',
    prerequisites: ['sliding-window'],
    problemsAvailable: 11,
    rewardXp: 380,
    defaultSlug: 'valid-parentheses',
    subtopics: [
      { id: 'lifo-m', title: 'Parentheses Matching', masteryPct: 90, status: 'MASTERED', problemCount: 5, problems: [{ slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'EASY' }] },
    ],
  },
  {
    id: 'queue-deque',
    title: 'Queue / Deque',
    category: 'core-patterns',
    status: 'AVAILABLE',
    masteryPct: 40,
    description: 'FIFO buffers and level-order processing.',
    prerequisites: ['sliding-window'],
    problemsAvailable: 8,
    rewardXp: 400,
    defaultSlug: 'implement-queue-using-stacks',
    subtopics: [
      { id: 'fifo-b', title: 'FIFO Buffers', masteryPct: 45, status: 'PRACTICING', problemCount: 4 },
    ],
  },

  // LEVEL 5: LINKED STRUCTURES
  {
    id: 'linked-list',
    title: 'Linked List',
    category: 'core-patterns',
    status: 'AVAILABLE',
    masteryPct: 30,
    description: 'Node pointers, fast/slow pointers, in-place reversal.',
    prerequisites: ['stack'],
    problemsAvailable: 9,
    rewardXp: 360,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'node-rev', title: 'In-Place Node Reversal', masteryPct: 35, status: 'PRACTICING', problemCount: 4 },
    ],
  },

  // LEVEL 6: PRIORITY QUEUES & INTERVALS
  {
    id: 'heaps',
    title: 'Heap',
    category: 'data-structures',
    status: 'AVAILABLE',
    masteryPct: 20,
    description: 'Min/max heap priority queues and top-K elements.',
    prerequisites: ['linked-list'],
    problemsAvailable: 10,
    rewardXp: 450,
    defaultSlug: 'kth-largest-element-in-an-array',
    subtopics: [
      { id: 'k-way', title: 'K-Way Merging', masteryPct: 25, status: 'PRACTICING', problemCount: 5 },
    ],
  },
  {
    id: 'intervals',
    title: 'Intervals',
    category: 'data-structures',
    status: 'AVAILABLE',
    masteryPct: 25,
    description: 'Overlapping interval boundaries and sweep line.',
    prerequisites: ['linked-list'],
    problemsAvailable: 7,
    rewardXp: 390,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'int-bound', title: 'Boundary Merging', masteryPct: 30, status: 'PRACTICING', problemCount: 3 },
    ],
  },

  // LEVEL 7: RECURSION TREES
  {
    id: 'recursion',
    title: 'Recursion',
    category: 'data-structures',
    status: 'AVAILABLE',
    masteryPct: 35,
    description: 'Recurrence relations, call stack, base cases.',
    prerequisites: ['heaps'],
    problemsAvailable: 8,
    rewardXp: 420,
    defaultSlug: 'fibonacci-number',
    subtopics: [
      { id: 'rec-tree', title: 'Recurrence Trees', masteryPct: 40, status: 'PRACTICING', problemCount: 4 },
    ],
  },

  // LEVEL 8: TREES & SEARCH SPACES
  {
    id: 'trees',
    title: 'Trees',
    category: 'data-structures',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'DFS depth traversals and BST invariants.',
    prerequisites: ['recursion'],
    problemsAvailable: 12,
    rewardXp: 480,
    defaultSlug: 'maximum-depth-of-binary-tree',
    subtopics: [
      { id: 'dfs-t', title: 'DFS Depth Traversal', masteryPct: 0, status: 'UNEXPLORED', problemCount: 6 },
    ],
  },
  {
    id: 'backtracking',
    title: 'Backtracking',
    category: 'data-structures',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'State space tree search with recursive pruning.',
    prerequisites: ['recursion'],
    problemsAvailable: 8,
    rewardXp: 560,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'prun-b', title: 'Recursive Branch Pruning', masteryPct: 0, status: 'UNEXPLORED', problemCount: 4 },
    ],
  },

  // LEVEL 9: GRAPH NETWORKS
  {
    id: 'graphs',
    title: 'Graphs',
    category: 'data-structures',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'Adjacency lists, BFS/DFS grids, topological sort.',
    prerequisites: ['trees'],
    problemsAvailable: 14,
    rewardXp: 550,
    defaultSlug: 'number-of-islands',
    subtopics: [
      { id: 'grid-g', title: 'Grid Island Traversals', masteryPct: 0, status: 'UNEXPLORED', problemCount: 7 },
    ],
  },

  // LEVEL 10: GREEDY & DISJOINT SETS
  {
    id: 'greedy',
    title: 'Greedy',
    category: 'problem-solving',
    status: 'AVAILABLE',
    masteryPct: 30,
    description: 'Local optimal choices making global optimal solutions.',
    prerequisites: ['graphs'],
    problemsAvailable: 9,
    rewardXp: 500,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'loc-opt', title: 'Local Choice Strategy', masteryPct: 35, status: 'PRACTICING', problemCount: 4 },
    ],
  },
  {
    id: 'union-find',
    title: 'Union Find',
    category: 'problem-solving',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'Disjoint set union with path compression.',
    prerequisites: ['graphs'],
    problemsAvailable: 5,
    rewardXp: 580,
    defaultSlug: 'number-of-islands',
    subtopics: [
      { id: 'path-c', title: 'Path Compression Union', masteryPct: 0, status: 'UNEXPLORED', problemCount: 3 },
    ],
  },

  // LEVEL 11: DYNAMIC PROGRAMMING
  {
    id: 'dp',
    title: 'Dynamic Programming',
    category: 'problem-solving',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'Overlapping subproblems and state memoization tables.',
    prerequisites: ['greedy'],
    problemsAvailable: 16,
    rewardXp: 600,
    defaultSlug: 'climbing-stairs',
    subtopics: [
      { id: 'st-tables', title: '1D State Memoization', masteryPct: 0, status: 'UNEXPLORED', problemCount: 8 },
    ],
  },

  // LEVEL 12: TRIES & BITWISE MASKS
  {
    id: 'trie',
    title: 'Trie',
    category: 'problem-solving',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'Character tree nodes and prefix matching.',
    prerequisites: ['dp'],
    problemsAvailable: 6,
    rewardXp: 520,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'prefix-l', title: 'Prefix Matching Nodes', masteryPct: 0, status: 'UNEXPLORED', problemCount: 3 },
    ],
  },
  {
    id: 'bit-manipulation',
    title: 'Bit Manipulation',
    category: 'problem-solving',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'Bitwise AND/OR/XOR operations and bit masks.',
    prerequisites: ['dp'],
    problemsAvailable: 6,
    rewardXp: 480,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'bit-m', title: 'Bitwise Masking', masteryPct: 0, status: 'UNEXPLORED', problemCount: 3 },
    ],
  },

  // LEVEL 13: ADVANCED ALGORITHMIC PATTERNS
  {
    id: 'advanced-patterns',
    title: 'Advanced Patterns',
    category: 'problem-solving',
    status: 'LOCKED',
    masteryPct: 0,
    description: 'Segment trees, heavy-light decomposition, advanced DP.',
    prerequisites: ['trie'],
    problemsAvailable: 5,
    rewardXp: 700,
    defaultSlug: 'two-sum',
    subtopics: [
      { id: 'adv-p', title: 'Segment Tree Range Queries', masteryPct: 0, status: 'UNEXPLORED', problemCount: 3 },
    ],
  },
];

export default function PatternForgeHomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [activeNav, setActiveNav] = useState<'journey' | 'library' | 'oa' | 'mistakes'>('journey');
  const [isLoading, setIsLoading] = useState(true);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingProblem, setIsDeletingProblem] = useState(false);

  useEffect(() => {
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/');
      return;
    }
    if (storedEmail) {
      setEmail(storedEmail);
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/assessment/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.onboarded) {
            router.push('/assessment');
          } else {
            setProfile(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProblems = async () => {
      try {
        const res = await fetch(`${API_URL}/problems`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProblems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch problems:', err);
      }
    };

    fetchProfile();
    fetchProblems();
  }, [router]);

  const solvedCount = problems.filter((p) => p.solved).length;
  const currentXp = 840 + solvedCount * 120;

  const userName = email.split('@')[0]
    ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
    : 'Hari';

  const handleStartPractice = (slug: string) => {
    router.push(`/workspace/${slug}`);
  };

  const handleGenerateAiProblem = async (patternTitle: string, subtopicTitle?: string) => {
    try {
      const token = localStorage.getItem('token');
      const promptText = `
        Pattern: "${patternTitle}"
        Subtopic: "${subtopicTitle || 'General pattern practice'}"
        Generate a unique, high-quality coding problem specifically for this pattern and subtopic.
        Provide starter codes in Python, JavaScript, Java, and C++, with comprehensive test cases.
      `;

      const res = await fetch(`${API_URL}/problems/ai-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: promptText, pattern: patternTitle, subtopic: subtopicTitle }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI generation did not return a valid problem.');
      const probId = data.problemId || data.id || data.slug;
      setProblems((current) => [...current, { id: probId, title: data.problemTitle, difficulty: data.difficulty, topic: data.topic, subtopic: data.subtopic, solved: false }]);
      return { id: probId, title: data.problemTitle, difficulty: data.difficulty, subtopic: data.subtopic };
    } catch (err) {
      console.error('Failed to generate AI problem:', err);
      throw err;
    }
  };

  const handleGenerateAiSubtopic = async (patternTitle: string, existingSubtopics: string[], difficulty: 'EASY' | 'MEDIUM' | 'HARD', focus: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/assessment/journey-subtopics/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ patternTitle, existingSubtopics, difficulty, focus: focus || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'AI could not create a subtopic. Nothing was added.');
    if (!data.subtopic?.id || !data.subtopic?.title) throw new Error('AI returned an invalid subtopic. Nothing was added.');
    setProfile((current: any) => ({
      ...current,
      customCurriculum: {
        ...(current?.customCurriculum && typeof current.customCurriculum === 'object' ? current.customCurriculum : {}),
        generatedSubtopics: [...(current?.customCurriculum?.generatedSubtopics || []), data.subtopic],
      },
    }));
    return data.subtopic;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center font-sans text-slate-300 space-y-4">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-xl shadow-amber-500/25"
        >
          P
        </motion.div>
        <p className="font-semibold text-sm text-slate-300 tracking-wide font-mono">Loading PatternForge Journey...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'journey', label: 'Journey', icon: CompassIcon, path: '/dashboard' },
    { id: 'library', label: 'Pattern Library', icon: BookOpen, path: '/library' },
    { id: 'oa', label: 'Practice', icon: Flag, path: '/interview-arena' },
    { id: 'mistakes', label: 'Insights', icon: BrainCircuit, path: '/mistakes' },
  ];

  return (
    <div className="h-screen bg-[#f8f5ed] text-[#17263a] font-sans flex overflow-hidden antialiased selection:bg-amber-500/30 selection:text-amber-900">
      {/* ================= LEFT SIDEBAR (240px) ================= */}
      <aside className="w-64 bg-[#fffdf8] border-r border-[#e8e1d3] flex flex-col justify-between p-6 shrink-0 sticky top-0 h-screen z-30">
        <div className="space-y-8">
          {/* PatternForge Brand Header with subtle hover bounce */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2.5 px-1 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-300 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#17263a]">
              Pattern<span className="text-[#e67b1f]">Forge</span>
            </span>
          </motion.div>

          {/* Navigation Items with Framer Motion layoutId Active Pill */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id as any);
                    if (item.path && item.path !== '/dashboard') {
                      router.push(item.path);
                    }
                  }}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors z-10 ${
                    isActive ? 'text-[#9b5416]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-xl bg-[#fff0c9] border border-[#f7d786] shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#e67b1f]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Streak Widget */}
        <div className="space-y-3.5">
          <div className="bg-white border border-[#e8e1d3] rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.18, 1], rotate: [-4, 4, -4] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="inline-block"
                >
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                </motion.span>
                7 Day Streak
              </span>
              <span className="text-[#c56a17] font-mono text-[10px] font-bold bg-[#fff1d5] border border-[#f6d89b] px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-[#eee7da] pt-2.5">
              <span>Total XP</span>
              <span className="font-mono font-bold text-[#d97717] text-sm">
                {currentXp} XP
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#e8e1d3] hover:border-[#d9cba8] transition">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/20">
                {userName.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{userName}</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar with Frosted Glassmorphism */}
        <header className="py-4 px-8 flex items-center justify-between bg-[#fffdf8]/90 border-b border-[#e8e1d3] backdrop-blur-xl shrink-0 z-20">
          <div>
            <h1 className="text-lg font-black text-[#17263a] flex items-center gap-2 tracking-tight">
              Good morning, {userName}.
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Directed prerequisite DAG • Recognize patterns, master subtopics, practice AI drills
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/dashboard/creator')}
              className="px-4 py-2 bg-white hover:bg-[#fffaf0] border border-[#e3d8c8] text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>AI Problem Creator</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/interview-arena')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/25"
            >
              <Flag className="w-4 h-4 fill-slate-950" />
              <span>Launch OA Arena</span>
            </motion.button>
          </div>
        </header>

        {/* INTERACTIVE ALGORITHM JOURNEY MAP */}
        <main className="flex-1 overflow-hidden">
          <AlgorithmJourneyMap
            initialNodes={INITIAL_JOURNEY_NODES}
            existingProblems={problems}
            persistedSubtopics={profile?.customCurriculum?.generatedSubtopics || []}
            onStartPractice={handleStartPractice}
            onGenerateAiProblem={handleGenerateAiProblem}
            onGenerateAiSubtopic={handleGenerateAiSubtopic}
          />
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        problemTitle={deleteTarget?.title || ''}
        isDeleting={isDeletingProblem}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setIsDeletingProblem(true);
          try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/problems/${encodeURIComponent(deleteTarget.id)}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setProblems((prev) => prev.filter((p) => p.id !== deleteTarget.id && p.title !== deleteTarget.title));
          } catch (err) {
            console.error('Failed to delete problem:', err);
          } finally {
            setIsDeletingProblem(false);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
