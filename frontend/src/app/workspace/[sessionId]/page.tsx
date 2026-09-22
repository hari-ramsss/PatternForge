'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEditorStore } from '../../../features/workspace/useEditorStore';
import { useSessionStore } from '../../../features/workspace/useSessionStore';
import { useAutosave } from '../../../features/workspace/hooks/useAutosave';
import MonacoWrapper from '../../../features/workspace/components/monaco-wrapper';
import SolutionPathAnalyzer from '../../../features/workspace/components/SolutionPathAnalyzer';
import VocalTranscriptDrawer from '../../../features/workspace/components/VocalTranscriptDrawer';
import AiVoiceInterviewer from '../../../features/workspace/components/AiVoiceInterviewer';
import DeleteConfirmationModal from '../../../features/workspace/components/DeleteConfirmationModal';
import { createDiagramDefinition, type DiagramDefinition } from '../../../features/workspace/diagram-utils';
import { Play, Send, ChevronDown, CheckCircle, AlertTriangle, Cpu, Clock, RefreshCw, Sparkles, BookOpen, BrainCircuit, Activity, Unlock, Lock, Plus, Trash2, Code2, Award, Mic, Bot, Timer } from 'lucide-react';

interface Example {
  id: string;
  input: string;
  output: string;
  explanation?: string;
}

interface Constraint {
  id: string;
  statement: string;
}

interface StarterCode {
  id: string;
  language: string;
  boilerplate: string;
}

interface TestCase {
  id: string;
  input: string;
  expected: string;
  isPublic: boolean;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  memoryLimit: number;
  optimalTime: string;
  optimalSpace: string;
  examples: Example[];
  constraints: Constraint[];
  starterCodes: StarterCode[];
  testCases: TestCase[];
}

interface SavedDiagram extends DiagramDefinition {
  id: string;
  exampleId: string;
}

function FormatCoachMessage({ content }: { content: string }) {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-xs leading-relaxed font-sans text-stone-800">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const rawInside = part.slice(3, -3).trim();
          const lines = rawInside.split('\n');
          let lang = 'code';
          let codeBody = rawInside;
          if (lines[0] && /^[a-zA-Z0-9_+#]+$/.test(lines[0].trim())) {
            lang = lines[0].trim();
            codeBody = lines.slice(1).join('\n');
          }
          return (
            <div key={i} className="my-3 rounded-xl overflow-hidden border border-stone-800 bg-[#141413] text-stone-200 font-mono text-xs shadow-xs">
              <div className="bg-[#1e1e1c] px-3.5 py-2 border-b border-stone-800 flex items-center justify-between text-[10px] text-stone-400 font-sans font-semibold uppercase tracking-wider">
                <span className="text-amber-400 font-bold">{lang}</span>
                <span className="text-[9px] text-stone-500 font-mono">Code Snippet</span>
              </div>
              <pre className="p-3.5 overflow-x-auto leading-relaxed text-stone-200">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={i} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              if (trimmed.startsWith('#')) {
                const headerText = trimmed.replace(/^#+\s*/, '');
                return (
                  <h4 key={lIdx} className="font-sans font-bold text-stone-900 text-xs mt-3 mb-1 flex items-center gap-1.5 border-b border-stone-100 pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0"></span>
                    {formatInlineText(headerText)}
                  </h4>
                );
              }

              if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
                const bulletText = trimmed.replace(/^([-*]|\d+\.)\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 my-0.5">
                    <span className="text-amber-500 font-bold select-none text-[10px] mt-0.5 shrink-0">•</span>
                    <span className="flex-1">{formatInlineText(bulletText)}</span>
                  </div>
                );
              }

              return <p key={lIdx} className="text-stone-750">{formatInlineText(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function formatInlineText(text: string) {
  if (!text) return '';

  const highlightKeywords = /\b(valid|invalid|subarray|array|index|length|maximum|minimum|constraint|constraints|return|output|input|target|sum|difference|prefix|suffix|window|optimal|complexity|result|value|values)\b/gi;

  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((cp, idx) => {
    if (cp.startsWith('`') && cp.endsWith('`')) {
      return (
        <code key={idx} className="bg-amber-500/10 text-amber-800 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono text-[11px] font-medium mx-0.5">
          {cp.slice(1, -1)}
        </code>
      );
    }

    const boldParts = cp.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, bIdx) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return (
          <strong key={bIdx} className="font-bold text-stone-900">
            {bp.slice(2, -2)}
          </strong>
        );
      }

      const italicParts = bp.split(/(\*[^*]+\*)/g);
      return italicParts.map((ip, iIdx) => {
        if (ip.startsWith('*') && ip.endsWith('*')) {
          return <em key={iIdx} className="italic text-stone-700">{ip.slice(1, -1)}</em>;
        }

        const keywordParts = ip.split(highlightKeywords);
        return keywordParts.map((segment, segIdx) => {
          if (segment && segment.match(highlightKeywords)) {
            return (
              <span
                key={`${iIdx}-${segIdx}`}
                className="rounded bg-amber-100 px-1 py-0.5 font-semibold text-amber-900 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.12)]"
              >
                {segment}
              </span>
            );
          }
          return <React.Fragment key={`${iIdx}-${segIdx}`}>{segment}</React.Fragment>;
        });
      });
    });
  });
}

function VisualLearningPanel({ diagram }: { diagram: DiagramDefinition }) {
  const data = diagram.visualData ?? {};
  const mode = data.mode;

  if (mode === 'rain-water') {
    const heights = (data.heights as number[]) ?? [];
    const trapped = (data.trapped as number[]) ?? [];
    const leftMax = (data.leftMax as number[]) ?? [];
    const rightMax = (data.rightMax as number[]) ?? [];
    const maxHeight = Math.max(...heights, 1);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-stone-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-stone-700" /> wall</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sky-400" /> trapped water</span>
          <span className="ml-auto rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">Total: {String(data.total ?? 0)} units</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-sky-100 bg-sky-50/40 p-3">
          <div className="flex min-w-[34rem] items-end gap-1.5" style={{ height: 190 }}>
            {heights.map((height, index) => (
              <div key={index} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-1">
                <div className="flex w-full flex-col justify-end" style={{ height: 150 }}>
                  <div className="w-full rounded-t-md bg-sky-300" style={{ height: `${(trapped[index] / maxHeight) * 100}%`, minHeight: trapped[index] ? 5 : 0 }} />
                  <div className="w-full rounded-t-sm bg-stone-700" style={{ height: `${(height / maxHeight) * 100}%`, minHeight: height ? 5 : 0 }} />
                </div>
                <span className="font-mono text-[10px] text-stone-500">{index}</span>
                <span className="font-mono text-[10px] font-bold text-stone-800">{height}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-stone-600 sm:grid-cols-4">
          {heights.map((height, index) => (
            <div key={index} className="rounded-lg border border-stone-200 bg-white px-2 py-1.5">
              <span className="font-bold text-stone-900">i{index}</span> L:{leftMax[index]} R:{rightMax[index]} W:{trapped[index]}
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-stone-600">{String(data.explanation)}</p>
      </div>
    );
  }

  if (mode === 'two-pointer' || mode === 'sliding-window') {
    const values = (data.values as number[]) ?? [];
    const pointers = (data.pointers as { left: number; right: number } | undefined) ?? (data.window as { left: number; right: number } | undefined);
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <div className="flex min-w-[30rem] gap-2">
            {values.map((value, index) => {
              const isActive = pointers && index >= pointers.left && index <= pointers.right;
              return <div key={index} className={`relative flex h-14 min-w-12 flex-1 items-center justify-center rounded-lg border-2 font-mono text-sm font-bold ${isActive ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-stone-200 bg-white text-stone-600'}`}><span className="absolute -top-4 text-[10px] font-normal text-stone-400">{index}</span>{value}</div>;
            })}
          </div>
          <div className="mt-4 flex justify-between text-[11px] font-bold text-amber-800">
            <span>{mode === 'two-pointer' ? 'left pointer' : 'window left'}</span>
            <span>{mode === 'two-pointer' ? 'right pointer' : 'window right'}</span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-stone-600">{String(data.explanation)}</p>
      </div>
    );
  }

  return null;
}

export default function WorkspacePage({ params: paramsPromise }: { params: Promise<{ sessionId: string }> }) {
  const params = use(paramsPromise);
  const sessionId = params.sessionId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOaMode = searchParams.get('oa') === 'true';
  const oaCompany = searchParams.get('company') || 'Corporate Assessment';
  const oaDurationMinutes = Math.max(1, Number(searchParams.get('duration') || 45));
  const oaVoiceEnabled = searchParams.get('voice') === 'true';

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/');
    }
  }, [router]);

  // For Phase 1, we treat the sessionId as problemId for simplicity in mock queries
  const problemId = sessionId;

  const { code, language, isCompiling, verdict, setCode, setLanguage, setCompiling, setVerdict, editorRef } = useEditorStore();
  const { currentPhase, setCurrentPhase } = useSessionStore();

  const handleFormatCode = () => {
    if (!code || !code.trim()) return;

    const lines = code.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = '    '; // 4 spaces

    const isPython = language.toLowerCase() === 'python';

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        formattedLines.push('');
        continue;
      }

      if (isPython) {
        if (
          trimmed.startsWith('elif ') ||
          trimmed.startsWith('else:') ||
          trimmed.startsWith('except') ||
          trimmed.startsWith('finally:')
        ) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        formattedLines.push(indentStr.repeat(indentLevel) + trimmed);

        if (trimmed.endsWith(':') && !trimmed.startsWith('#')) {
          indentLevel++;
        } else if (
          trimmed.startsWith('return ') ||
          trimmed.startsWith('return(') ||
          trimmed === 'pass' ||
          trimmed === 'break' ||
          trimmed === 'continue' ||
          trimmed.startsWith('raise ')
        ) {
          if (i < lines.length - 1) {
            const nextTrimmed = lines[i + 1].trim();
            if (
              nextTrimmed.startsWith('def ') ||
              nextTrimmed.startsWith('class ') ||
              nextTrimmed.startsWith('if ') ||
              nextTrimmed.startsWith('elif ') ||
              nextTrimmed.startsWith('else:') ||
              nextTrimmed.startsWith('for ') ||
              nextTrimmed.startsWith('while ')
            ) {
              indentLevel = Math.max(0, indentLevel - 1);
            }
          }
        }
      } else {
        const startsWithClose = trimmed.startsWith('}') || trimmed.startsWith(')');
        const effectiveIndent = Math.max(0, indentLevel - (startsWithClose ? 1 : 0));
        formattedLines.push(indentStr.repeat(effectiveIndent) + trimmed);

        for (const char of trimmed) {
          if (char === '{') indentLevel++;
          else if (char === '}') indentLevel = Math.max(0, indentLevel - 1);
        }
      }
    }

    const formattedCode = formattedLines.join('\n');
    setCode(formattedCode);
    if (editorRef) {
      editorRef.getAction('editor.action.formatDocument')?.run();
    }
  };

  const [activeTab, setActiveTab] = useState<'console' | 'verdict'>('console');
  const [customCases, setCustomCases] = useState<Array<{ id: string; input: string; expected: string }>>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState<number>(0);
  const [activeResultCaseIdx, setActiveResultCaseIdx] = useState<number>(0);
  const [loadTime] = useState(Date.now());
  const [vocalTranscript, setVocalTranscript] = useState('');
  const [isEvaluatingOa, setIsEvaluatingOa] = useState(false);
  const [showVoiceInterview, setShowVoiceInterview] = useState(oaVoiceEnabled);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingProblem, setIsDeletingProblem] = useState(false);
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);
  const [activeDiagram, setActiveDiagram] = useState<DiagramDefinition | null>(null);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [isRenderingDiagram, setIsRenderingDiagram] = useState(false);
  const [isSavingDiagram, setIsSavingDiagram] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [showSkillJump, setShowSkillJump] = useState(false);
  const [oaSecondsRemaining, setOaSecondsRemaining] = useState(oaDurationMinutes * 60);

  useEffect(() => {
    if (!isOaMode || oaSecondsRemaining <= 0) return;
    const interval = window.setInterval(() => {
      setOaSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOaMode, oaSecondsRemaining]);

  const oaTimeLabel = `${String(Math.floor(oaSecondsRemaining / 60)).padStart(2, '0')}:${String(oaSecondsRemaining % 60).padStart(2, '0')}`;

  const handleAddCustomCase = () => {
    const newCase = {
      id: `custom-${Date.now()}`,
      input: '',
      expected: '',
    };
    setCustomCases((prev) => [...prev, newCase]);
    const publicCount = problem?.testCases?.filter((tc: any) => tc.isPublic)?.length || 0;
    setActiveTestCaseIdx(publicCount + customCases.length);
  };

  const handleDeleteCustomCase = (id: string) => {
    setCustomCases((prev) => prev.filter((c) => c.id !== id));
    setActiveTestCaseIdx(0);
  };

  const handleUpdateCustomCase = (id: string, field: 'input' | 'expected', value: string) => {
    setCustomCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };
  const [animationStep, setAnimationStep] = useState<number>(0);

  const [phaseStartTime, setPhaseStartTime] = useState<number>(Date.now());
  const prevPhaseRef = useRef<string>(currentPhase);

  const keystrokeCountRef = useRef<number>(0);
  const lastKeyPressTimeRef = useRef<number>(Date.now());
  const keyIntervalsSumRef = useRef<number>(0);

  const isIncomingSyncRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Phase 3 Wizard UI State
  const [readingTimeRemaining, setReadingTimeRemaining] = useState(30);

  // 1. Broadcast Channel Multi-Tab Synchronization Hook
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('leetcode_workspace_sync');

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'request-state') {
        const currentCode = useEditorStore.getState().code;
        const currentLang = useEditorStore.getState().language;
        const currentPh = useSessionStore.getState().currentPhase;

        if (currentCode) {
          channel.postMessage({
            type: 'sync-state',
            payload: { code: currentCode, language: currentLang, currentPhase: currentPh }
          });
        }
      } else if (type === 'sync-state') {
        const currentCode = useEditorStore.getState().code;
        const currentLang = useEditorStore.getState().language;
        const currentPh = useSessionStore.getState().currentPhase;

        isIncomingSyncRef.current = true;
        if (payload.code !== undefined && payload.code !== currentCode) {
          setCode(payload.code);
        }
        if (payload.language !== undefined && payload.language !== currentLang) {
          setLanguage(payload.language);
        }
        if (payload.currentPhase !== undefined && payload.currentPhase !== currentPh) {
          setCurrentPhase(payload.currentPhase);
        }
        setTimeout(() => {
          isIncomingSyncRef.current = false;
        }, 50);
      }
    };

    channel.addEventListener('message', handleMessage);
    channel.postMessage({ type: 'request-state' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [setCode, setLanguage, setCurrentPhase]);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    if (isIncomingSyncRef.current) return;

    const channel = new BroadcastChannel('leetcode_workspace_sync');
    channel.postMessage({
      type: 'sync-state',
      payload: { code, language, currentPhase }
    });
    channel.close();
  }, [code, language, currentPhase]);

  // 2. Telemetry Timing Logging Client
  const sendTelemetry = async (eventType: string, eventData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${apiUrl}/assessment/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: problem?.id || problemId,
          eventType,
          eventData,
        }),
      });
    } catch (err) {
      console.error('Failed to send telemetry event:', err);
    }
  };

  // Phase Transition Timing Telemetry
  useEffect(() => {
    if (prevPhaseRef.current !== currentPhase) {
      const duration = Math.floor((Date.now() - phaseStartTime) / 1000);
      sendTelemetry('phase_transition', {
        from: prevPhaseRef.current,
        to: currentPhase,
        durationSeconds: duration
      });
      prevPhaseRef.current = currentPhase;
      setPhaseStartTime(Date.now());
    }
  }, [currentPhase, phaseStartTime]);

  // Keystroke timing tracking
  useEffect(() => {
    if (!code) return;
    const now = Date.now();
    const interval = now - lastKeyPressTimeRef.current;
    if (interval < 5000) { // filter out long breaks
      keyIntervalsSumRef.current += interval;
      keystrokeCountRef.current += 1;
    }
    lastKeyPressTimeRef.current = now;
  }, [code]);

  // Telemetry Keystroke Flush interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (keystrokeCountRef.current > 0) {
        const avgDelay = Math.round(keyIntervalsSumRef.current / keystrokeCountRef.current);
        sendTelemetry('keystroke_timing', {
          keystrokes: keystrokeCountRef.current,
          averageDelayMs: avgDelay
        });
        keystrokeCountRef.current = 0;
        keyIntervalsSumRef.current = 0;
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Approach Reasoning States
  const [targetTimeComplexity, setTargetTimeComplexity] = useState('O(N)');
  const [targetSpaceComplexity, setTargetSpaceComplexity] = useState('O(1)');
  const [pseudocodeOutline, setPseudocodeOutline] = useState('');
  const [isEvaluatingApproach, setIsEvaluatingApproach] = useState(false);
  const [approachFeedback, setApproachFeedback] = useState('');
  const [approachScoring, setApproachScoring] = useState<any>(null);
  const [isFetchingHelp, setIsFetchingHelp] = useState(false);
  const [helpHint, setHelpHint] = useState('');
  const [codeReview, setCodeReview] = useState<any>(null);
  const [isFetchingReview, setIsFetchingReview] = useState(false);

  // Reading Phase countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentPhase === 'READING_PROBLEM' && readingTimeRemaining > 0) {
      interval = setInterval(() => {
        setReadingTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPhase, readingTimeRemaining]);

  // Activate autosave draft caching loops
  useAutosave(`${isOaMode ? 'oa' : 'practice'}:${problemId}`);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  // 1. Fetch problem catalog details
  const { data: problem, isLoading, error } = useQuery<Problem>({
    queryKey: ['problem', problemId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/problems/${problemId}`);
      if (!res.ok) throw new Error('Problem not found');
      const data = await res.json();
      // AI-generated problems may come back without examples/constraints/test
      // cases — normalize so render-time .map/.find calls never crash.
      return {
        ...data,
        examples: Array.isArray(data.examples) ? data.examples : [],
        constraints: Array.isArray(data.constraints) ? data.constraints : [],
        testCases: Array.isArray(data.testCases) ? data.testCases : [],
        starterCodes: Array.isArray(data.starterCodes) ? data.starterCodes : [],
      };
    },
  });

  useEffect(() => {
    if (!problem?.examples?.length) return;
    setSelectedExampleId((current) => current ?? problem.examples[0].id);
  }, [problem]);

  useEffect(() => {
    if (!problem?.id) return;
    const loadSavedDiagrams = async () => {
      try {
        const response = await fetch(`${apiUrl}/problems/${encodeURIComponent(problem.id)}/diagrams`);
        if (!response.ok) return;
        setSavedDiagrams(await response.json());
      } catch (diagramError) {
        console.error('Failed to load saved diagrams:', diagramError);
      }
    };
    loadSavedDiagrams();
  }, [apiUrl, problem?.id]);

  useEffect(() => {
    if (!activeDiagram || !diagramRef.current) return;
    let cancelled = false;
    if (activeDiagram.visualData?.mode === 'rain-water' || activeDiagram.visualData?.mode === 'two-pointer' || activeDiagram.visualData?.mode === 'sliding-window') {
      setIsRenderingDiagram(false);
      return () => { cancelled = true; };
    }
    const renderDiagram = async () => {
      setIsRenderingDiagram(true);
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: { primaryColor: '#fff1c2', lineColor: '#b45309', primaryTextColor: '#292524' } });
        const renderId = `diagram-${Date.now()}`;
        const rendered = await mermaid.render(renderId, activeDiagram.mermaid);
        if (!cancelled && diagramRef.current) diagramRef.current.innerHTML = rendered.svg;
      } catch (diagramError) {
        if (!cancelled && diagramRef.current) diagramRef.current.textContent = 'This example could not be rendered as a diagram.';
        console.error('Failed to render diagram:', diagramError);
      } finally {
        if (!cancelled) setIsRenderingDiagram(false);
      }
    };
    renderDiagram();
    return () => { cancelled = true; };
  }, [activeDiagram]);

  const handleVisualizeExample = (example: Example) => {
    setSelectedExampleId(example.id);
    const saved = savedDiagrams.find((diagram) => diagram.exampleId === example.id);
    setActiveDiagram(saved ?? createDiagramDefinition(problem?.title ?? '', example.input, example.explanation));
  };

  const handleSaveDiagram = async () => {
    if (!problem?.id || !selectedExampleId || !activeDiagram) return;
    setIsSavingDiagram(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/problems/${encodeURIComponent(problem.id)}/diagrams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ exampleId: selectedExampleId, ...activeDiagram }),
      });
      if (!response.ok) throw new Error('Unable to save diagram');
      const saved = await response.json();
      setSavedDiagrams((current) => [...current.filter((diagram) => diagram.exampleId !== saved.exampleId), saved]);
    } catch (diagramError) {
      console.error('Failed to save diagram:', diagramError);
    } finally {
      setIsSavingDiagram(false);
    }
  };

  const [leftTab, setLeftTab] = useState<'problem' | 'analytics' | 'coach'>('problem');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'coach'; content: string }>>([
    { role: 'coach', content: "Hello! I am your Socratic Coding Coach. What questions do you have about the problem or approach? Let's build the solution step-by-step!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  useEffect(() => {
    if (leftTab === 'coach') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isSendingChat, leftTab]);

  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close search dropdown switcher
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };

    if (searchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchDropdownOpen]);

  // Fetch problems for workspace switcher
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/problems`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const uniqueMap = new Map();
          if (Array.isArray(data)) {
            data.forEach((p: any) => {
              if (p && p.id && !uniqueMap.has(p.id)) {
                uniqueMap.set(p.id, p);
              }
            });
          }
          setProblemsList(Array.from(uniqueMap.values()));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProblems();
  }, [apiUrl]);

  // Load starter code boilerplate when language or problem changes
  useEffect(() => {
    if (problem) {
      const matchedBoilerplate = problem.starterCodes.find(
        (sc) => sc.language.toLowerCase() === language.toLowerCase()
      );
      if (matchedBoilerplate && !code) {
        setCode(matchedBoilerplate.boilerplate);
      }
    }
  }, [problem, language, setCode, code]);

  // 2. Code execution mutation
  const executeMutation = useMutation({
    mutationFn: async ({ isSubmit }: { isSubmit: boolean }) => {
      const token = localStorage.getItem('token');
      const publicCases = problem?.testCases?.filter((tc: any) => tc.isPublic) || [];
      const combinedCases = [
        ...publicCases.map((tc: any) => ({ input: tc.input, expected: tc.expected })),
        ...customCases.map((tc) => ({ input: tc.input, expected: tc.expected })),
      ];

      const res = await fetch(`${apiUrl}/playground/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId,
          language,
          code,
          isSubmit,
          customTestCases: isSubmit ? undefined : combinedCases.length > 0 ? combinedCases : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Execution request failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      const submissionId = data.submissionId;
      setCompiling(true);
      setActiveTab('verdict');

      let receivedFinal = false;

      // 3. Establish SSE Connection to stream verdicts
      const eventSource = new EventSource(`${apiUrl}/playground/execute/${submissionId}/stream`);

      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        setVerdict(payload);

        if (payload.analysis) {
          setLeftTab('analytics');
        }

        if (
          payload.status !== 'PENDING' &&
          payload.status !== 'RUNNING'
        ) {
          receivedFinal = true;
          setCompiling(false);
          eventSource.close();

          // Adaptive Difficulty Skipping trigger check
          if (payload.status === 'ACCEPTED') {
            const timeElapsed = (Date.now() - loadTime) / 1000;
            if (timeElapsed < 300) { // solved under 5 minutes
              setShowSkillJump(true);
              setAnimationStep(1); // Success Banner & Confetti

              setTimeout(() => {
                setAnimationStep(2); // Card Flip & Shimmer Border
              }, 450);

              setTimeout(() => {
                setAnimationStep(3); // Energy Particle Transfer
              }, 1100);

              setTimeout(() => {
                setAnimationStep(4); // Mastery Progress Bar Fill
              }, 1900);

              setTimeout(() => {
                setAnimationStep(5); // Category Node Pulse & Counter Increment
              }, 2500);

              setTimeout(() => {
                setAnimationStep(6); // Light Up Connector & Next Node Grow
              }, 3100);
            }
          }
        }
      };

      eventSource.onerror = (err) => {
        if (receivedFinal) {
          eventSource.close();
          return;
        }
        console.error('SSE connection error:', err);
        setCompiling(false);
        setVerdict({ status: 'COMPILATION_ERROR', stderr: 'Verdict connection dropped.' });
        eventSource.close();
      };
    },
    onError: (err: any) => {
      setVerdict({ status: 'COMPILATION_ERROR', stderr: err.message });
      setCompiling(false);
    },
  });

  const handleRun = () => {
    executeMutation.mutate({ isSubmit: false });
  };

  const handleSubmit = () => {
    executeMutation.mutate({ isSubmit: true });
  };

  const handleResetCode = () => {
    if (problem) {
      const matchedBoilerplate = problem.starterCodes.find(
        (sc) => sc.language.toLowerCase() === language.toLowerCase()
      );
      if (matchedBoilerplate) {
        setCode(matchedBoilerplate.boilerplate);
      }
    }
  };

  const submitApproachEvaluation = async () => {
    setApproachFeedback('');
    setApproachScoring(null);
    if (pseudocodeOutline.trim().length < 15) {
      setApproachFeedback('Please describe your pseudocode approach with at least 15 characters.');
      return;
    }

    setIsEvaluatingApproach(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/assessment/evaluate-approach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: problem?.id || problemId,
          timeComplexity: targetTimeComplexity,
          spaceComplexity: targetSpaceComplexity,
          pseudocode: pseudocodeOutline,
        }),
      });

      const data = await res.json();
      setIsEvaluatingApproach(false);

      if (!res.ok) {
        setApproachFeedback(data.message || 'Evaluation request failed.');
      } else {
        setApproachScoring(data || null);
        if (data.feedback) {
          setApproachFeedback(data.feedback);
        }
      }
    } catch (err: any) {
      setIsEvaluatingApproach(false);
      setApproachFeedback(err.message || 'Server error. Please try again.');
    }
  };

  const handleSendPrompt = async (messageText: string) => {
    if (!messageText.trim() || isSendingChat) return;

    const userMsg = { role: 'user' as const, content: messageText };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const token = localStorage.getItem('token');
      const formattedHistory = chatMessages.slice(-10).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const res = await fetch(`${apiUrl}/assessment/coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: problem?.id || problemId,
          code,
          language,
          message: messageText,
          history: formattedHistory,
        }),
      });

      const data = await res.json();
      setIsSendingChat(false);

      if (res.ok && data.reply) {
        setChatMessages((prev) => [...prev, { role: 'coach', content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'coach', content: "I'm sorry, I couldn't process your request. Let's try again!" }]);
      }
    } catch (err: any) {
      setIsSendingChat(false);
      setChatMessages((prev) => [...prev, { role: 'coach', content: "I'm having trouble connecting. Make sure the database is online!" }]);
    }
  };

  const submitCodeEvaluation = async (status: string, errors: string) => {
    setCodeReview(null);
    setIsFetchingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/assessment/evaluate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: problem?.id || problemId,
          code,
          language,
          status,
          errors,
        }),
      });
      const data = await res.json();
      setIsFetchingReview(false);
      if (res.ok) {
        setCodeReview(data);
      }
    } catch (err: any) {
      setIsFetchingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF8F5] text-stone-600 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-amber-600 w-8 h-8" />
          <p className="text-sm font-serif">Loading coding sandbox...</p>
        </div>
      </div>
    );
  }

  if (error || !problem || problemId === 'undefined') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] text-stone-850 font-serif p-6 text-center">
        <div className="max-w-md bg-white border border-stone-250 p-8 rounded-2xl shadow-sm space-y-4">
          <AlertTriangle className="mx-auto w-12 h-12 text-amber-500 animate-pulse" />
          <h2 className="text-xl font-bold text-stone-900">Problem Not Found</h2>
          <p className="text-stone-600 text-xs font-sans leading-relaxed">
            Could not retrieve details for problem identifier <span className="font-mono text-red-600 font-bold bg-stone-100 px-1.5 py-0.5 rounded">"{problemId}"</span>.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-950 text-white rounded-xl font-bold text-xs shadow-xs transition uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>← Return to Practice Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col overflow-hidden bg-[#f8f5ed] text-[#17263a]">
      {/* Workspace Header */}
      <header className={`shrink-0 border-b-2 px-4 py-4 sm:px-6 ${isOaMode ? 'border-orange-200 bg-[#fff7df]' : 'border-[#e8e1d3] bg-[#fffdf8]'}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              onClick={() => router.push('/dashboard')}
              className="shrink-0 cursor-pointer text-lg font-black tracking-tight text-[#17263a] transition hover:opacity-85"
            >
              Pattern<span className="text-[#e67b1f]">Forge</span>
            </span>
            <span className="rounded-full border-2 border-[#f6d89b] bg-[#fff1d5] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#c56a17]">
              {isOaMode ? 'OA mode' : 'AI mode'}
            </span>
            <div className="hidden h-5 w-px bg-[#e8e1d3] sm:block"></div>

            <div ref={dropdownRef} className="relative min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
                  className="flex max-w-[48vw] items-center gap-1 truncate rounded-xl border-2 border-transparent px-2 py-1.5 text-left text-sm font-black text-[#17263a] transition hover:border-[#f0d7a3] hover:bg-[#fff9ee] sm:max-w-none"
                >
                  <span className="truncate">{problem.title}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-stone-450" />
                </button>

                <button
                  hidden={isOaMode}
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Delete Problem from Database"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {searchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-3 shadow-lg z-50 space-y-2">
                  <input
                    type="text"
                    placeholder="Search problems to switch..."
                    value={workspaceSearchQuery}
                    onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-stone-400 transition"
                    autoFocus
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {problemsList
                      .filter((p) => p && p.title && typeof p.title === 'string' && p.title.toLowerCase().includes((workspaceSearchQuery || '').toLowerCase()))
                      .map((p, pIdx) => (
                        <button
                          key={`workspace-switcher-prob-${p.id}-${pIdx}`}
                          onClick={() => {
                            setSearchDropdownOpen(false);
                            router.push(`/workspace/${p.id}`);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition flex justify-between items-center ${problem.id === p.id
                              ? 'bg-amber-50 text-amber-800 font-semibold'
                              : 'hover:bg-stone-50 text-stone-600'
                            }`}
                        >
                          <span>{p.title}</span>
                          <span className={`text-[9px] font-bold ${p.difficulty === 'EASY'
                              ? 'text-emerald-600'
                              : p.difficulty === 'MEDIUM'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}>{p.difficulty}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            <span className={`mr-auto whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] ${isOaMode ? 'text-orange-700' : 'text-slate-400'}`}>
              {saveStatus === 'saving' ? 'Saving draft...' : 'Draft saved'}
            </span>
            {isOaMode && <span className="flex items-center gap-1.5 rounded-xl border-2 border-orange-300 bg-white px-3 py-2 font-mono text-sm font-black text-orange-700"><Timer className="h-4 w-4" />{oaTimeLabel}</span>}
            <button
              onClick={handleRun}
              disabled={isCompiling}
              className="flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#e3d8c8] bg-white px-3 py-2 text-xs font-bold text-[#17263a] transition active:translate-y-[2px]"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Run Code
            </button>
            {!isOaMode && <button
              onClick={handleSubmit}
              disabled={isCompiling}
              className="flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-amber-600 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-sm transition active:translate-y-[2px]"
            >
              <Send className="w-3.5 h-3.5" /> Submit Solution
            </button>}
            {isOaMode && <button
              onClick={async () => {
                setIsEvaluatingOa(true);
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${apiUrl}/mistakes/evaluate-oa`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      company: oaCompany,
                      problemTitle: problem?.title || 'Technical Assessment',
                      code,
                      language,
                      status: verdict?.status || 'ACCEPTED',
                      passedTestCases: verdict?.status === 'ACCEPTED' ? 10 : 7,
                      totalTestCases: 10,
                      vocalTranscript,
                    }),
                  });
                  if (res.ok) {
                    const report = await res.json();
                    localStorage.setItem('last_oa_report', JSON.stringify(report));
                    router.push('/interview-arena/report');
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsEvaluatingOa(false);
                }
              }}
              disabled={isEvaluatingOa}
              className="flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-emerald-700 bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm transition active:translate-y-[2px]"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isEvaluatingOa ? 'Evaluating...' : 'Finish OA & View Report'}</span>
            </button>}
          </div>
        </div>
      </header>

      {/* Main Workspace split */}
      <main className="flex-1 min-h-0 min-w-0 overflow-hidden lg:grid lg:grid-cols-[1.08fr_1.32fr]">
        {/* Left pane: Details & Analytics */}
        <section className="flex min-h-[52vh] w-full min-h-0 flex-col overflow-hidden border-b-2 border-[#e8e1d3] bg-[#fffdf8] lg:min-h-0 lg:border-b-0 lg:border-r-2">
          {/* Left Tab Bar Selector */}
          <div className="flex min-h-12 shrink-0 items-center gap-4 overflow-x-auto border-b-2 border-[#e8e1d3] bg-[#fff8e9] px-4 text-xs font-bold text-slate-500 sm:px-6">
            <button
              onClick={() => setLeftTab('problem')}
              className={`py-3 px-1 border-b-2 transition ${leftTab === 'problem' ? 'border-amber-700 text-amber-800 font-bold' : 'border-transparent hover:text-stone-700'
                }`}
            >
              Problem Description
            </button>
            {!isOaMode && <button
              onClick={() => setLeftTab('coach')}
              className={`py-3 px-1 border-b-2 transition flex items-center gap-1.5 ${leftTab === 'coach'
                  ? 'border-amber-700 text-amber-800 font-bold'
                  : 'border-transparent hover:text-stone-700'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              AI Coding Coach
            </button>}
          </div>

          {/* Left Tab Content */}
          {leftTab === 'coach' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50/20">
              {/* AI Coding Coach Header (Fixed) */}
              <div className="p-4 px-6 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-xs">
                    <Sparkles className="w-4 h-4 fill-amber-400/30" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-stone-900">AI Coding Coach</h3>
                    <p className="text-[10px] text-stone-500 font-sans">Interactive Socratic guidance & hints</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>

              {/* Messages list (Fixed scrollable within window limit) */}
              <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 shadow-2xs ${msg.role === 'user'
                          ? 'bg-amber-600 text-white font-sans text-xs leading-relaxed rounded-br-xs'
                          : 'bg-white border border-stone-200/80 text-stone-800 rounded-bl-xs'
                        }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap font-sans text-xs">{msg.content}</p>
                      ) : (
                        <FormatCoachMessage content={msg.content} />
                      )}
                    </div>
                  </div>
                ))}
                {isSendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 text-xs text-stone-500 flex items-center gap-2.5 animate-pulse shadow-2xs">
                      <RefreshCw className="animate-spin w-3.5 h-3.5 text-amber-500" />
                      <span className="font-medium font-sans">Synthesizing response...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested prompts list (Fixed above input) */}
              <div className="p-3 px-6 bg-stone-50/90 border-t border-stone-200/70 shrink-0">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1.5 font-sans">Suggested Prompts:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Give me a hint for this problem.",
                    "Explain the optimal approach.",
                    "Explain the time complexity constraints."
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(p)}
                      disabled={isSendingChat}
                      className="px-3 py-1 bg-white border border-stone-200 text-stone-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-[11px] rounded-lg transition font-medium shadow-2xs shrink-0 font-sans"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message input (Fixed at bottom) */}
              <div className="shrink-0 border-t border-stone-200 bg-white p-4 px-6">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSendingChat && chatInput.trim()) {
                        handleSendPrompt(chatInput);
                      }
                    }}
                    disabled={isSendingChat}
                    placeholder="Ask your AI coach a question..."
                    className="flex-1 bg-stone-50 border border-stone-200/90 rounded-xl px-4 py-2.5 text-xs text-stone-800 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition font-sans"
                  />
                  <button
                    onClick={() => handleSendPrompt(chatInput)}
                    disabled={isSendingChat || !chatInput.trim()}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 font-sans"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8">
              {isOaMode && (
                <div className="mb-6 space-y-3 rounded-3xl border-2 border-b-4 border-orange-200 bg-[#fff4d6] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">Live assessment</p>
                      <h2 className="mt-1 text-xl font-black text-[#17263a]">{oaCompany} coding screen</h2>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">Work independently, run your checks, and submit when your solution is ready. Hints and learning prompts are intentionally unavailable in this mode.</p>
                    </div>
                    <div className="rounded-2xl border-2 border-orange-200 bg-white px-3 py-2 text-right"><span className="block text-[10px] font-black uppercase text-slate-400">Time left</span><span className="font-mono text-lg font-black text-orange-700">{oaTimeLabel}</span></div>
                  </div>
                  {oaVoiceEnabled && <AiVoiceInterviewer company={oaCompany} problemTitle={problem.title} code={code} language={language} onInterviewComplete={(transcript) => setVocalTranscript(transcript)} />}
                </div>
              )}
              {leftTab === 'problem' ? (
                <div className="max-w-2xl text-stone-800">
                  {/* Title & Metadata */}
                  <div className="mb-4 flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${problem.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        problem.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                      {problem.difficulty}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {problem.timeLimit}s</span>
                      <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {problem.memoryLimit}MB</span>
                    </div>
                  </div>

                  <h2 className="mb-6 font-serif text-4xl font-bold leading-tight tracking-[-0.04em] text-stone-900">{problem.title}</h2>

                  {/* Description */}
                  <div className="mb-8 space-y-4 font-serif text-[1.06rem] leading-[1.9] tracking-[0.01em] text-stone-800">
                    {problem.description.split('\n\n').map((para, idx) => (
                      <p key={idx} className="text-pretty">{formatInlineText(para)}</p>
                    ))}
                  </div>

                  {/* Examples */}
                  <div className="space-y-6 mb-8">
                    <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">Examples</h3>
                    {problem.examples.map((ex, idx) => (
                      <div key={ex.id} className="bg-stone-50 rounded-xl p-5 border border-stone-200 font-sans text-sm">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-stone-800">Example {idx + 1}:</p>
                          <button
                            type="button"
                            onClick={() => handleVisualizeExample(ex)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 transition hover:bg-amber-100"
                          >
                            <Activity className="h-3.5 w-3.5" />
                            {savedDiagrams.some((diagram) => diagram.exampleId === ex.id) ? 'Open saved visual' : 'Visualize example'}
                          </button>
                        </div>
                        <div className="space-y-1.5 font-mono text-stone-600">
                          <p><strong className="font-sans text-stone-800">Input:</strong> {ex.input}</p>
                          <p><strong className="font-sans text-stone-800">Output:</strong> {ex.output}</p>
                          {ex.explanation && (
                            <p className="mt-2 text-stone-500 text-xs italic"><strong className="font-sans text-stone-700 not-italic">Explanation:</strong> {ex.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeDiagram && (
                    <section className="mb-8 overflow-hidden rounded-2xl border-2 border-amber-200 bg-[#fffaf0] shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50/80 px-4 py-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Example visual</p>
                          <h3 className="font-serif text-lg font-bold text-stone-900">{activeDiagram.label}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {savedDiagrams.some((diagram) => diagram.exampleId === selectedExampleId) && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Saved</span>
                          )}
                          <button
                            type="button"
                            onClick={handleSaveDiagram}
                            disabled={isSavingDiagram || savedDiagrams.some((diagram) => diagram.exampleId === selectedExampleId)}
                            className="rounded-lg bg-amber-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSavingDiagram ? 'Saving...' : 'Save visual'}
                          </button>
                        </div>
                      </div>
                      <div className="min-h-44 overflow-x-auto p-4">
                        {activeDiagram.visualData?.mode ? (
                          <VisualLearningPanel diagram={activeDiagram} />
                        ) : (
                          <>
                            {isRenderingDiagram && <p className="py-12 text-center text-xs font-semibold text-stone-500">Drawing the example...</p>}
                            <div ref={diagramRef} className="flex min-h-36 items-center justify-center [&_svg]:max-w-full" aria-label={`${activeDiagram.label} diagram`} />
                          </>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Constraints */}
                  <div className="mb-8">
                    <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 mb-3">Constraints</h3>
                    <ul className="list-disc list-inside space-y-2 font-mono text-stone-600 text-sm bg-stone-50 p-4 rounded-xl border border-stone-200">
                      {problem.constraints.map((c) => (
                        <li key={c.id}>{formatInlineText(c.statement)}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Target complexities */}
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 mb-3">Optimal Target Complexities</h3>
                    <div className="grid grid-cols-2 gap-4 font-mono text-center text-sm">
                      <div className="bg-[#FAF8F5] border border-[#EFECE6] p-3 rounded-lg">
                        <span className="block text-xs text-stone-400 mb-1">Time Complexity</span>
                        <strong className="text-stone-800">{problem.optimalTime}</strong>
                      </div>
                      <div className="bg-[#FAF8F5] border border-[#EFECE6] p-3 rounded-lg">
                        <span className="block text-xs text-stone-400 mb-1">Space Complexity</span>
                        <strong className="text-stone-800">{problem.optimalSpace}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        {/* Right pane: Editor & Console */}
        <section className={`flex min-h-[70vh] w-full min-h-0 flex-col overflow-hidden border-t-2 lg:min-h-0 lg:border-t-0 ${isOaMode ? 'border-orange-200 bg-[#1d2b3a]' : 'border-[#e8e1d3] bg-[#17263a]'}`}>
          {currentPhase !== 'CODING_UNLOCKED' &&
            currentPhase !== 'SUBMITTED' &&
            currentPhase !== 'ANALYZED' &&
            currentPhase !== 'REFLECTION_REQUIRED' &&
            currentPhase !== 'COMPLETED' ? (

            /* Thinking Loop Wizard UI */
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between bg-[#131312] text-stone-200">
              <div className="space-y-6">

                {/* Wizard Header Progress Bar */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Cognitive Thinking Wizard
                    </span>
                    <button
                      onClick={() => {
                        sendTelemetry('bypass_wizard', { time: Date.now() });
                        setCurrentPhase('CODING_UNLOCKED');
                      }}
                      title="Bypass all reasoning steps and open the Monaco code editor"
                      className="text-[9px] text-stone-500 hover:text-amber-500 underline transition select-none font-bold uppercase tracking-wide"
                    >
                      Bypass Wizard
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    {['READING_PROBLEM', 'APPROACH_REASONING'].map((p, idx) => {
                      const phases = ['READING_PROBLEM', 'APPROACH_REASONING'];
                      const activeIdx = phases.indexOf(currentPhase);
                      const isDone = idx < activeIdx;
                      const isActive = idx === activeIdx;
                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : isActive ? 'bg-amber-500 scale-110 shadow-2xs' : 'bg-stone-700'
                            }`} title={p === 'READING_PROBLEM' ? 'Reading Phase' : 'Approach Design'} />
                          {idx < 1 && <div className={`w-4 h-0.5 ${idx < activeIdx ? 'bg-emerald-500' : 'bg-stone-700'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PHASE 1: READING_PROBLEM */}
                {currentPhase === 'READING_PROBLEM' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-2">
                      <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-amber-500" />
                        <span>Phase 1: Deep Comprehension</span>
                      </h3>
                      <p className="text-stone-400 text-xs leading-relaxed font-normal">
                        Analyze the problem description, target examples, and input scopes. Read carefully to understand basic invariants.
                      </p>
                    </div>

                    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm text-center">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        {/* Countdown circle */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="#292524" strokeWidth="4" fill="transparent" />
                          <circle
                            cx="40" cy="40" r="34" stroke="#d97706" strokeWidth="4" fill="transparent"
                            strokeDasharray={2 * Math.PI * 34}
                            strokeDashoffset={2 * Math.PI * 34 * (1 - readingTimeRemaining / 30)}
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>
                        <span className="absolute text-xl font-mono font-bold text-amber-500">{readingTimeRemaining}s</span>
                      </div>
                      <div className="space-y-1">
                        <strong className="block text-sm text-white">Soft Lock Reading Countdown</strong>
                        <span className="text-xs text-stone-500">Wait for the countdown to complete to unlock approach design.</span>
                      </div>

                      {readingTimeRemaining === 0 ? (
                        <button
                          onClick={() => setCurrentPhase('APPROACH_REASONING')}
                          className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl font-bold text-xs shadow-md transition animate-pulse"
                        >
                          Proceed to Approach Design
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-6 py-2 bg-stone-800 text-stone-500 rounded-xl font-bold text-xs cursor-not-allowed"
                        >
                          Read Description...
                        </button>
                      )}
                    </div>

                    <div className="text-center pt-2">
                      <button
                        onClick={() => {
                          sendTelemetry('bypass_lockout', { time: Date.now() });
                          setCurrentPhase('APPROACH_REASONING');
                        }}
                        className="text-[11px] text-amber-500 hover:underline font-bold transition flex items-center justify-center gap-1 mx-auto"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Bypass Lockout (Skip reading timer)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PHASE 2: APPROACH_REASONING */}
                {currentPhase === 'APPROACH_REASONING' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-500 animate-bounce" />
                        <span>Phase 2: Approach Design</span>
                      </h3>
                      <p className="text-stone-400 text-xs leading-normal font-normal">
                        Outline your algorithmic flow and complexity thresholds. Setting these targets unlocks coding mode.
                      </p>
                    </div>

                    {/* Complexity Sliders / selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-900/50 p-4 rounded-xl border border-stone-850">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Target Time Complexity</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {['O(1)', 'O(log N)', 'O(N)', 'O(N log N)', 'O(N^2)'].map((tc) => (
                            <button
                              key={tc}
                              onClick={() => setTargetTimeComplexity(tc)}
                              className={`px-2.5 py-1 text-[10px] rounded font-bold transition font-mono ${targetTimeComplexity === tc
                                  ? 'bg-amber-50 text-stone-950'
                                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                                }`}
                            >
                              {tc}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Target Space Complexity</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {['O(1)', 'O(log N)', 'O(N)'].map((sc) => (
                            <button
                              key={sc}
                              onClick={() => setTargetSpaceComplexity(sc)}
                              className={`px-2.5 py-1 text-[10px] rounded font-bold transition font-mono ${targetSpaceComplexity === sc
                                  ? 'bg-amber-50 text-stone-950'
                                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                                }`}
                            >
                              {sc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pseudocode entry */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Pseudocode / Logical Plan Outline</label>
                      <textarea
                        value={pseudocodeOutline}
                        onChange={(e) => setPseudocodeOutline(e.target.value)}
                        placeholder="Outline the steps of your implementation plan. How will loops iterate? When will hashing values increment?..."
                        className="w-full min-h-[90px] bg-stone-900 border border-stone-800 rounded-xl p-3 outline-none text-stone-300 font-mono text-xs focus:border-stone-700 transition resize-none"
                      />
                    </div>

                    {approachFeedback && (
                      <div className={`p-4 rounded-xl border text-xs flex flex-col gap-2 ${approachScoring?.passed ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-red-950/20 border-red-900/30 text-red-400'
                        }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          {approachScoring?.passed ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                          <span>{approachScoring ? 'Approach Evaluated' : 'Evaluation Notice'}</span>
                        </div>
                        <p className="font-normal font-sans text-stone-300 leading-relaxed">{approachFeedback}</p>

                        {approachScoring && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-850 text-center font-mono text-[10px]">
                            <div className="bg-stone-900/40 p-1.5 rounded border border-stone-800">
                              <span className="text-stone-500 block">Logical Correctness</span>
                              <strong className="text-white text-xs">{approachScoring.scores.logicalCorrectness}%</strong>
                            </div>
                            <div className="bg-stone-900/40 p-1.5 rounded border border-stone-800">
                              <span className="text-stone-500 block">Complexity Match</span>
                              <strong className="text-white text-xs">{approachScoring.scores.complexityMatch}%</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {approachScoring && (
                      <div className="space-y-3 mt-2 text-xs font-sans">
                        {approachScoring.strengths?.length > 0 && (
                          <div className="space-y-1">
                            <strong className="text-emerald-400 font-bold block text-[10px] uppercase tracking-wider">Strengths</strong>
                            <ul className="list-disc pl-4 text-stone-400 space-y-0.5 leading-normal">
                              {approachScoring.strengths.map((str: string, i: number) => (
                                <li key={i}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {approachScoring.logicalGaps?.length > 0 && (
                          <div className="space-y-1 pt-1.5">
                            <strong className="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">Logical Gaps / suggestions</strong>
                            <ul className="list-disc pl-4 text-stone-400 space-y-0.5 leading-normal">
                              {approachScoring.logicalGaps.map((gap: string, i: number) => (
                                <li key={i}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {approachScoring.prerequisiteProblem && (
                          <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 space-y-2 mt-4">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>Pre-requisite Suggestion</span>
                            </div>
                            <p className="text-stone-350 leading-relaxed font-sans">
                              It looks like you are struggling with this concept. We highly recommend completing this prerequisite problem first:
                            </p>
                            <div className="bg-stone-900 border border-stone-850 p-3 rounded-lg flex items-center justify-between mt-2">
                              <div className="max-w-[70%]">
                                <strong className="text-white block text-xs">{approachScoring.prerequisiteProblem.title}</strong>
                                <p className="text-[10px] text-stone-500 mt-0.5 leading-normal">{approachScoring.prerequisiteProblem.reason}</p>
                              </div>
                              <button
                                onClick={() => {
                                  window.location.href = `/workspace/${approachScoring.prerequisiteProblem.slug}`;
                                }}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded font-bold text-[9px] shadow transition"
                              >
                                Solve Prerequisite
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 mt-4">
                      {approachScoring ? (
                        <>
                          <button
                            onClick={() => setCurrentPhase('CODING_UNLOCKED')}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 animate-pulse"
                          >
                            <Unlock className="w-4 h-4 fill-current" />
                            <span>Unlock Sandbox Editor & Start Coding!</span>
                          </button>
                          <button
                            onClick={submitApproachEvaluation}
                            disabled={isEvaluatingApproach}
                            className="w-full py-2 bg-stone-800 hover:bg-stone-750 text-stone-400 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluatingApproach ? 'animate-spin' : ''}`} />
                            <span>Re-Evaluate Stated Approach</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={submitApproachEvaluation}
                          disabled={isEvaluatingApproach}
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-850 disabled:text-stone-500 text-stone-950 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                        >
                          {isEvaluatingApproach ? (
                            <>
                              <RefreshCw className="animate-spin w-4 h-4" />
                              <span>Analyzing Proposed Approach...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Evaluate Stated Approach</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Brand notice */}
              <div className="text-[10px] text-stone-600 text-center font-mono border-t border-stone-900 pt-4 mt-8 flex items-center justify-center gap-1 select-none">
                <span>⚡ Enforced by PatternForge AI thinking pipeline engine.</span>
              </div>
            </div>

          ) : (

            /* standard coding view */
            <>
              {/* Language Selector Bar */}
              <div className={`flex min-h-12 items-center justify-between border-b-2 px-4 text-xs ${isOaMode ? 'border-[#31445d] bg-[#20344d] text-slate-300' : 'border-[#31445d] bg-[#20344d] text-slate-300'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-300">Language:</span>
                    <div className="relative group">
                      <select
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          setCode('');
                        }}
                        className="cursor-pointer rounded-xl border-2 border-[#48617e] bg-[#17263a] px-2 py-1 text-slate-100 outline-none transition hover:bg-[#28425f]"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleResetCode}
                    title="Reset to default template"
                    className="flex items-center justify-center rounded-lg p-1 text-slate-300 transition hover:bg-[#28425f] hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleFormatCode}
                    title="Format Code (Alt+Shift+F)"
                    className="flex items-center gap-1.5 rounded-lg border-2 border-[#48617e] bg-[#28425f] px-2 py-1 font-mono text-xs font-bold text-amber-300 transition hover:bg-[#355575]"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Format</span>
                  </button>
                </div>
              </div>

              {/* Monaco Editor container */}
              <div className="relative min-h-[360px] flex-1 min-h-0 overflow-hidden bg-[#101d2d]">
                {isOaMode && <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200">Assessment editor</div>}
                <div className="absolute inset-3 overflow-hidden sm:inset-4">
                  <MonacoWrapper theme="dark" />
                </div>
              </div>

              {/* Console / Output Tabs */}
              <div className="flex min-h-[240px] h-1/3 min-h-0 flex-col overflow-hidden border-t-2 border-[#31445d] bg-[#17263a]">
                {/* Console Tab triggers */}
                <div className="h-9 px-4 bg-stone-900 border-b border-stone-800 flex items-center gap-4 text-xs font-medium text-stone-400">
                  <button
                    onClick={() => setActiveTab('console')}
                    className={`py-2 px-1 border-b-2 transition ${activeTab === 'console' ? 'text-amber-500 border-amber-500' : 'border-transparent hover:text-stone-200'
                      }`}
                  >
                    Test Cases Console
                  </button>
                  <button
                    onClick={() => setActiveTab('verdict')}
                    className={`py-2 px-1 border-b-2 transition ${activeTab === 'verdict' ? 'text-amber-500 border-amber-500' : 'border-transparent hover:text-stone-200'
                      }`}
                  >
                    Execution Result
                  </button>
                </div>

                {/* Tab content panels */}
                <div className="flex-1 overflow-y-auto p-5 text-stone-300 text-sm">
                  {activeTab === 'console' ? (
                    (() => {
                      const publicCases = problem?.testCases?.filter((tc: any) => tc.isPublic) || [];
                      const combinedCases = [
                        ...publicCases.map((tc: any, idx: number) => ({
                          id: tc.id || `public-${idx}`,
                          label: `Case ${idx + 1}`,
                          input: tc.input,
                          expected: tc.expected,
                          isCustom: false,
                        })),
                        ...customCases.map((tc, idx) => ({
                          id: tc.id,
                          label: `Case ${publicCases.length + idx + 1} (Custom)`,
                          input: tc.input,
                          expected: tc.expected,
                          isCustom: true,
                        })),
                      ];

                      const currentCase = combinedCases[activeTestCaseIdx] || combinedCases[0];

                      return (
                        <div className="space-y-4">
                          {/* Test Case Tabs Bar */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-850">
                            {combinedCases.map((tc, idx) => (
                              <div key={tc.id} className="relative flex items-center group">
                                <button
                                  onClick={() => setActiveTestCaseIdx(idx)}
                                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap ${activeTestCaseIdx === idx
                                      ? 'bg-stone-800 text-amber-400 border border-amber-500/30'
                                      : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
                                    }`}
                                >
                                  <span>{tc.label}</span>
                                </button>
                                {tc.isCustom && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomCase(tc.id);
                                    }}
                                    className="ml-1 text-stone-500 hover:text-red-400 p-1 transition"
                                    title="Remove Custom Test Case"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Add Custom Test Case Button */}
                            <button
                              onClick={handleAddCustomCase}
                              className="px-2.5 py-1.5 text-xs rounded-lg font-medium bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-500/30 transition flex items-center gap-1 whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Case</span>
                            </button>
                          </div>

                          {/* Render Case Content */}
                          {!currentCase ? (
                            <p className="text-stone-500 italic text-xs">No test cases configured.</p>
                          ) : currentCase.isCustom ? (
                            <div className="space-y-4 pt-1 font-sans text-xs">
                              {/* Custom Input */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-amber-400/90 font-semibold block uppercase tracking-wider">
                                  Custom Input (Parameters)
                                </label>
                                <textarea
                                  value={currentCase.input}
                                  onChange={(e) => handleUpdateCustomCase(currentCase.id, 'input', e.target.value)}
                                  placeholder="Enter input parameters here (e.g. [2, 3, 1, 4] or one parameter per line)..."
                                  className="w-full min-h-[70px] bg-stone-900 border border-stone-800 rounded-lg p-2.5 outline-none text-stone-200 font-mono text-xs focus:border-amber-500/50 transition resize-none"
                                />
                              </div>

                              {/* Expected Output */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-stone-400 font-semibold block uppercase tracking-wider">
                                  Expected Output (Optional)
                                </label>
                                <textarea
                                  value={currentCase.expected}
                                  onChange={(e) => handleUpdateCustomCase(currentCase.id, 'expected', e.target.value)}
                                  placeholder="Enter expected result (e.g. 1 or [0, 1]). Leave blank to run stdout only..."
                                  className="w-full min-h-[50px] bg-stone-900 border border-stone-800 rounded-lg p-2.5 outline-none text-stone-300 font-mono text-xs focus:border-stone-700 transition resize-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1 font-sans text-xs">
                              {currentCase.input.split('\n').filter((l: string) => l.trim()).map((val: string, idx: number) => (
                                <div key={idx} className="space-y-1">
                                  <span className="text-[10px] text-stone-500 font-semibold block uppercase tracking-wider">
                                    Argument {idx + 1} =
                                  </span>
                                  <div className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono text-xs">
                                    {val}
                                  </div>
                                </div>
                              ))}
                              <div className="space-y-1 pt-2 border-t border-stone-800/50">
                                <span className="text-[10px] text-stone-500 font-semibold block uppercase tracking-wider">
                                  Expected Output =
                                </span>
                                <div className="bg-stone-900/50 border border-dashed border-stone-800 rounded-lg p-2.5 text-stone-400 font-mono text-xs">
                                  {currentCase.expected}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-3 font-sans">
                      {isCompiling ? (
                        <div className="flex items-center gap-2 text-stone-400 animate-pulse">
                          <RefreshCw className="animate-spin w-4 h-4 text-amber-500" />
                          <span>Sandbox executing test cases...</span>
                        </div>
                      ) : verdict ? (
                        <div className="space-y-4 h-full flex flex-col font-sans">
                          {/* Check if we have individual test case results */}
                          {verdict.testCases && verdict.testCases.length > 0 ? (
                            <div className="space-y-4">
                              {/* Sub-tab selectors for each case result */}
                              <div className="flex items-center gap-2 border-b border-stone-850 pb-2 overflow-x-auto">
                                {verdict.testCases.map((tc: any, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => setActiveResultCaseIdx(idx)}
                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap ${activeResultCaseIdx === idx
                                        ? 'bg-stone-800 text-stone-200 border border-stone-700'
                                        : 'bg-transparent text-stone-400 hover:text-stone-200 border border-transparent'
                                      }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${tc.status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-red-500'
                                      }`} />
                                    Case {idx + 1}
                                  </button>
                                ))}
                              </div>

                              {/* Selected Case Result Details */}
                              {(() => {
                                const tcRes = verdict.testCases[activeResultCaseIdx];
                                if (!tcRes) return null;
                                const inputParts = tcRes.input ? tcRes.input.split('\n') : [];
                                const numsVal = inputParts[0] || '[]';
                                const targetVal = inputParts[1] || '0';
                                return (
                                  <div className="space-y-3 pt-1 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Status:</span>
                                      <span className={`font-bold ${tcRes.status === 'ACCEPTED' ? 'text-emerald-500' : 'text-red-500'
                                        }`}>{tcRes.status}</span>
                                      {tcRes.runtime !== undefined && (
                                        <span className="text-[10px] text-stone-500 font-mono">({tcRes.runtime}s)</span>
                                      )}
                                    </div>

                                    {/* Inputs */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">Input</span>
                                      <div className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 font-mono text-stone-300">
                                        <p className="text-stone-500"><strong className="text-stone-400 font-sans">nums =</strong> {numsVal}</p>
                                        <p className="text-stone-500"><strong className="text-stone-400 font-sans">target =</strong> {targetVal}</p>
                                      </div>
                                    </div>

                                    {/* Your Output */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">Output</span>
                                      <pre className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 font-mono text-stone-200 overflow-x-auto">
                                        {tcRes.stdout ? tcRes.stdout.trim() : <span className="text-stone-500 italic">No stdout output</span>}
                                      </pre>
                                    </div>

                                    {/* Expected Output */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">Expected</span>
                                      <div className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 font-mono text-stone-400">
                                        {tcRes.expected}
                                      </div>
                                    </div>

                                    {/* Error Output */}
                                    {tcRes.stderr && (
                                      <div className="space-y-1">
                                        <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider block">Error Message</span>
                                        <pre className="bg-red-950/10 border border-red-900/30 rounded-lg p-2.5 font-mono text-red-400 overflow-x-auto max-h-32">
                                          {tcRes.stderr}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="space-y-3 font-sans">
                              {/* Fallback for general status or compile errors */}
                              <div className="flex items-center gap-2">
                                {verdict.status === 'ACCEPTED' ? (
                                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                    <CheckCircle className="w-4 h-4" /> ACCEPTED
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-red-500 font-bold">
                                    <AlertTriangle className="w-4 h-4" /> {verdict.status}
                                  </div>
                                )}
                              </div>

                              {(verdict.runtime !== undefined || verdict.memory !== undefined) && (
                                <div className="flex gap-4 text-xs text-stone-500 border-b border-stone-800 pb-2">
                                  {verdict.runtime !== null && (
                                    <span>Runtime: <strong className="text-stone-300">{verdict.runtime}s</strong></span>
                                  )}
                                  {verdict.memory !== null && (
                                    <span>Memory: <strong className="text-stone-300">{verdict.memory} KB</strong></span>
                                  )}
                                </div>
                              )}

                              {verdict.stdout && (
                                <div className="space-y-1">
                                  <span className="text-xs text-stone-500 block">Standard Output:</span>
                                  <pre className="bg-stone-900 p-3 rounded-lg border border-stone-800 text-xs overflow-x-auto text-stone-400 max-h-32 font-mono">
                                    {verdict.stdout}
                                  </pre>
                                </div>
                              )}

                              {verdict.stderr && (
                                <div className="space-y-1">
                                  <span className="text-xs text-red-500 block">Error output:</span>
                                  <pre className="bg-red-950/20 p-3 rounded-lg border border-red-900/50 text-xs overflow-x-auto text-red-400 max-h-32 font-mono">
                                    {verdict.stderr}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-stone-500 text-xs italic">Submit code or click Run Code to view evaluation compile logs.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Adaptive Progression Skipping Dialog Overlay */}
      {showSkillJump && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn font-sans">
          {/* Fenced keyframe styles inside React to avoid layout break */}
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes flyOut1 { 0% { transform: translate(0, 0) scale(0.5); opacity: 1; } 100% { transform: translate(-70px, -60px) scale(1.2); opacity: 0; } }
            @keyframes flyOut2 { 0% { transform: translate(0, 0) scale(0.5); opacity: 1; } 100% { transform: translate(70px, -50px) scale(1.2); opacity: 0; } }
            @keyframes flyOut3 { 0% { transform: translate(0, 0) scale(0.5); opacity: 1; } 100% { transform: translate(-50px, 70px) scale(1.2); opacity: 0; } }
            @keyframes flyOut4 { 0% { transform: translate(0, 0) scale(0.5); opacity: 1; } 100% { transform: translate(60px, 60px) scale(1.2); opacity: 0; } }
            @keyframes flyParticle {
              0% { transform: translateY(60px) scale(0.5); opacity: 0; filter: blur(2px); }
              30% { transform: translateY(40px) scale(1.3); opacity: 1; filter: blur(0px); }
              70% { transform: translateY(-40px) scale(1.0); opacity: 1; }
              100% { transform: translateY(-70px) scale(0.3); opacity: 0; }
            }
            @keyframes pulseNode {
              0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(217, 119, 6, 0)); }
              50% { transform: scale(1.1); filter: drop-shadow(0 0 16px rgba(217, 119, 6, 0.75)); }
              100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(217, 119, 6, 0)); }
            }
            @keyframes bounceUnlock {
              0% { transform: translateY(15px) scale(0.85); opacity: 0; }
              50% { transform: translateY(-8px) scale(1.05); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            .animate-sparkle1 { animation: flyOut1 0.7s ease-out infinite; }
            .animate-sparkle2 { animation: flyOut2 0.7s ease-out infinite; }
            .animate-sparkle3 { animation: flyOut3 0.7s ease-out infinite; }
            .animate-sparkle4 { animation: flyOut4 0.7s ease-out infinite; }
            .animate-energy { animation: flyParticle 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
            .animate-pulse-node { animation: pulseNode 0.5s ease-in-out forwards; }
            .animate-bounce-unlock { animation: bounceUnlock 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            .perspective-1000 { perspective: 1000px; }
            .preserve-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .rotate-y-180 { transform: rotateY(180deg); }
          `}} />

          <div className="bg-white border border-[#EFECE6] p-8 rounded-3xl max-w-lg w-full mx-4 shadow-2xl relative overflow-hidden flex flex-col items-center">

            {/* Background absolute visuals */}
            <div className="absolute right-0 top-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* HEADER STEP (Success banner) */}
            <div className="text-center space-y-2 mb-6">
              <span className="text-[9px] bg-amber-500/20 text-amber-800 font-bold uppercase tracking-wider px-3 py-1 rounded-md border border-amber-500/30">
                🚀 Skill Jump Calibrator
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 pt-1">
                {animationStep === 1 && "Verifying Solution..."}
                {animationStep === 2 && "Analyzing Complexity..."}
                {animationStep === 3 && "Transferring Mastery..."}
                {animationStep === 4 && "Updating Curriculum..."}
                {animationStep === 5 && "Pattern Synced!"}
                {animationStep >= 6 && "Next Pattern Unlocked!"}
              </h3>
            </div>

            {/* MAIN ANIMATION INTERACTION VIEWPORT (Min height 240px) */}
            <div className="w-full h-64 flex flex-col items-center justify-center relative mb-6 border border-stone-100 bg-[#FAF8F5]/50 rounded-2xl overflow-hidden shadow-inner">

              {/* Step 1: Confetti sparkles & Success Banner */}
              {animationStep === 1 && (
                <div className="relative flex flex-col items-center space-y-2 text-center animate-fadeIn">
                  {/* Confetti Particles */}
                  <div className="absolute w-2 h-2 rounded-full bg-amber-500 animate-sparkle1" />
                  <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-sparkle2" />
                  <div className="absolute w-2 h-2 rounded-full bg-blue-500 animate-sparkle3" />
                  <div className="absolute w-2 h-2 rounded-full bg-purple-500 animate-sparkle4" />

                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <strong className="text-sm text-stone-850 font-bold">✓ Solution Accepted</strong>
                  <span className="text-[10px] text-stone-450 font-mono">Optimal time-space O(N) complexity</span>
                </div>
              )}

              {/* Step 2: Problem Card Flip & gold glow */}
              {animationStep === 2 && (
                <div className="perspective-1000 w-40 h-24">
                  <div className="w-full h-full preserve-3d duration-500 ease-in-out rotate-y-180 flex items-center justify-center relative">
                    {/* Front side */}
                    <div className="absolute inset-0 bg-white border border-stone-200 rounded-xl p-3 flex flex-col justify-between backface-hidden shadow-sm">
                      <span className="text-[8px] text-stone-400 font-bold uppercase">Core Challenge</span>
                      <strong className="text-xs text-stone-850 font-bold">{problem.title}</strong>
                    </div>
                    {/* Back side */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 flex flex-col justify-between text-white shadow-md border border-amber-400 rotate-y-180 backface-hidden">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-amber-100">Mastered</span>
                        <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-200 animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <strong className="text-xs font-bold block">{problem.title}</strong>
                        <span className="text-[9px] text-amber-150 font-mono">+120 XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Energy Particle Transfer */}
              {animationStep === 3 && (
                <div className="flex flex-col items-center justify-center relative w-full h-full">
                  {/* Category Node */}
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-stone-250 flex items-center justify-center text-xs font-bold text-stone-755 shadow-sm relative">
                    <span>Arrays</span>
                  </div>

                  {/* Glowing flying particle */}
                  <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300 shadow-md absolute animate-energy" />

                  {/* Problem Card (Bottom) */}
                  <div className="w-32 h-12 bg-amber-600 rounded-lg p-2 flex flex-col justify-center text-white mt-16 border border-amber-500 shadow-sm opacity-60">
                    <span className="text-[7px] font-bold uppercase tracking-wider text-amber-100">Source</span>
                    <strong className="text-[10px] font-bold truncate">{problem.title}</strong>
                  </div>
                </div>
              )}

              {/* Step 4: Fill Mastery Bar */}
              {animationStep === 4 && (
                <div className="w-4/5 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-750">Arrays & Hashing Mastery</span>
                    <span className="text-stone-850 font-mono font-bold">Updating...</span>
                  </div>
                  <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden relative shadow-inner">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: '38%' }}
                    />
                  </div>
                  <p className="text-[10px] text-stone-450 italic text-center font-mono animate-pulse">
                    Recalculating learning retention decay factors...
                  </p>
                </div>
              )}

              {/* Step 5: Node Pulse & Counter Increment */}
              {animationStep === 5 && (
                <div className="flex flex-col items-center space-y-3 animate-pulse-node">
                  <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border border-amber-400">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center space-y-0.5">
                    <strong className="block text-sm text-stone-850">Arrays & Hashing Level Up!</strong>
                    <span className="text-xs text-stone-450 font-mono">Core completion: 2 / 9 problems</span>
                  </div>
                </div>
              )}

              {/* Step 6: Light Up Connector & Next Node Grow (Bounce) */}
              {animationStep >= 6 && (
                <div className="flex flex-col items-center justify-center space-y-4 animate-bounce-unlock">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shadow-md animate-bounce">
                    <Sparkles className="w-6 h-6 fill-amber-500 text-amber-600" />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-250 font-bold uppercase px-2 py-0.5 rounded">
                      Unlocking Advanced Drill
                    </span>
                    <strong className="block text-sm text-stone-900">✨ Prefix Sum unlocked!</strong>
                    <p className="text-[10px] text-stone-500 leading-normal max-w-xs px-4">
                      Moving you past beginner elements to the next optimized observation bounds.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* MULTI-SKILL UPDATE DETAIL STATS (Spotify style abilities) */}
            <div className="w-full bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 space-y-2 mb-6">
              <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold block mb-1">Algorithmic Abilities Updates</span>

              {/* Dynamic list showing how skills are updated */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between items-center bg-white border border-stone-150 p-2 rounded-lg">
                  <span className="text-stone-550">Arrays & Hashing</span>
                  <span className="font-mono text-emerald-600 font-bold">+8%</span>
                </div>
                <div className="flex justify-between items-center bg-white border border-stone-150 p-2 rounded-lg">
                  <span className="text-stone-550">Observation</span>
                  <span className="font-mono text-emerald-600 font-bold">+6</span>
                </div>
                <div className="flex justify-between items-center bg-white border border-stone-150 p-2 rounded-lg">
                  <span className="text-stone-550">Hash Lookup</span>
                  <span className="font-mono text-emerald-600 font-bold">+12</span>
                </div>
                <div className="flex justify-between items-center bg-white border border-stone-150 p-2 rounded-lg">
                  <span className="text-stone-550">Confidence</span>
                  <span className="font-mono text-emerald-600 font-bold">+5</span>
                </div>
              </div>
            </div>

            {/* CONTROLS AREA */}
            <div className="w-full pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowSkillJump(false);
                  router.push('/workspace/top-k-frequent-elements');
                }}
                disabled={animationStep < 5}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:text-stone-500 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>Move to Top K Frequent Elements</span>
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowSkillJump(false)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-750 rounded-xl font-semibold text-xs transition"
              >
                Stay in Current Workspace
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI Coach Hint Modal removed - integrated directly into AI Coding Coach panel chat */}

      {/* Custom Deletion Confirmation Popup Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        problemTitle={problem?.title || ''}
        isDeleting={isDeletingProblem}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (!problem?.id) return;
          setIsDeletingProblem(true);
          try {
            const token = localStorage.getItem('token');
            await fetch(`${apiUrl}/problems/${encodeURIComponent(problem.id)}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            router.push('/dashboard');
          } catch (err) {
            console.error('Failed to delete problem:', err);
          } finally {
            setIsDeletingProblem(false);
            setShowDeleteModal(false);
          }
        }}
      />
    </div>
  );
}
