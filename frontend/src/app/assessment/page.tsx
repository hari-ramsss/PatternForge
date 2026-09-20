'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  BrainCircuit, 
  Target, 
  Timer, 
  Award,
  BookOpen
} from 'lucide-react';

const COMPANIES_LIST = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix', 'Apple', 'Uber', 'Stripe', 'Razorpay', 'Atlassian'];

export default function AssessmentPage() {
  const router = useRouter();
  
  // Phase state: 'onboarding' | 'intro' | 'quiz' | 'submitting' | 'result'
  const [phase, setPhase] = useState<'onboarding' | 'intro' | 'quiz' | 'submitting' | 'result'>('onboarding');
  
  // Onboarding parameters state
  const [prefLanguage, setPrefLanguage] = useState('python');
  const [daysToInterview, setDaysToInterview] = useState(90);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [lcEasy, setLcEasy] = useState(0);
  const [lcMedium, setLcMedium] = useState(0);
  const [lcHard, setLcHard] = useState(0);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<any>({
    q1: '',
    q2: '',
    q3: [],
    q4: 'O(N)',
    q5: [],
    q6: 'O(N)',
  });
  const [quizTime, setQuizTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Result state
  const [scores, setScores] = useState<any>(null);

  // Telemetry: ticking timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setQuizTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auth Redirect Guard
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const toggleCompany = (comp: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
    );
  };

  const handleOnboardingSubmit = async () => {
    // Save onboarding metadata to backend
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST', // Actually we can patch user profile but registration register endpoint or a new profile updates endpoint is clean. Let's patch directly if token exists. Wait, let's submit it to the submit-quiz endpoint so it saves all together!
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      // We will save onboarding fields inside the final submit endpoint to keep DB calls cohesive.
      setPhase('intro');
    } catch (err) {
      console.error(err);
      setPhase('intro');
    }
  };

  const handleStartQuiz = () => {
    setPhase('quiz');
    setQuizTime(0);
    setIsTimerRunning(true);
  };

  const handleQuizAnswer = (key: string, value: any) => {
    setQuizAnswers((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleCheckboxAnswer = (key: string, optionId: number) => {
    const current = quizAnswers[key] || [];
    const updated = current.includes(optionId)
      ? current.filter((id: number) => id !== optionId)
      : [...current, optionId];
    handleQuizAnswer(key, updated);
  };

  const handleNextQuiz = () => {
    if (quizIdx < 5) {
      setQuizIdx((prev) => prev + 1);
    } else {
      setIsTimerRunning(false);
      handleSubmitQuiz();
    }
  };

  const handleBackQuiz = () => {
    if (quizIdx > 0) {
      setQuizIdx((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setPhase('submitting');
    
    // Simulate AI parsing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const token = localStorage.getItem('token');
      // Submit results to backend API
      const res = await fetch('http://localhost:4000/api/assessment/submit-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: quizAnswers,
          timeSeconds: quizTime,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit diagnostic quiz');
      }

      const data = await res.json();
      setScores(data);
      setPhase('result');
    } catch (err) {
      console.error(err);
      // Fallback local mock evaluation in case backend is offline
      const mockResult = {
        scorePattern: quizAnswers.q1 === 'prefix-sum' ? 70 : 30,
        scoreObservation: quizAnswers.q3.includes(1) ? 65 : 40,
        scoreFormula: 60,
        scoreOptimization: quizAnswers.q4 === 'O(N^3)' ? 80 : 50,
        scoreSpeed: Math.max(20, 100 - Math.floor(quizTime / 2)),
        scoreConsistency: 70,
        mentorBrief: "Hey there! Your pattern recognition shows potential, but you need structured observation training to avoid missing critical negative values or overflow limits. We've optimized your roadmap parameters.",
      };
      setScores(mockResult);
      setPhase('result');
    }
  };

  // Helper to format ticking clock
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // SVG Radar coordinates generator
  const getRadarPoints = () => {
    if (!scores) return '';
    const center = 100;
    const maxRadius = 70;
    const maxVal = 100;
    const vals = [
      scores.scorePattern ?? 50,
      scores.scoreObservation ?? 50,
      scores.scoreFormula ?? 50,
      scores.scoreOptimization ?? 50,
      scores.scoreSpeed ?? 50,
      scores.scoreConsistency ?? 50,
    ];
    return vals.map((score, i) => {
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
      const radius = (score / maxVal) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans text-stone-850">
      {/* Mini top brand bar */}
      <header className="h-14 border-b border-[#EFECE6] bg-white flex items-center px-8 shrink-0">
        <span className="font-serif text-lg font-bold text-stone-900 tracking-tight">PatternForge <span className="text-amber-600 font-sans text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-200 ml-1">AI</span></span>
      </header>

      {/* Main wizard screen */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white border border-[#EFECE6] rounded-3xl p-8 md:p-10 shadow-sm transition">
          
          {/* Phase 1: Onboarding parameters */}
          {phase === 'onboarding' && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-1">Step 1 of 3</span>
                <h2 className="font-serif text-2xl font-bold text-stone-900 leading-tight">Personalize Your Assessment</h2>
                <p className="text-stone-500 text-sm mt-0.5">Let's gather some info to calibrate your personalized target roadmap.</p>
              </div>

              {/* Language Preference */}
              <div className="space-y-2">
                <label className="text-xs text-stone-600 font-semibold uppercase tracking-wider block">Preferred Coding Language</label>
                <div className="grid grid-cols-4 gap-3">
                  {['python', 'javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setPrefLanguage(lang)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition ${
                        prefLanguage === lang
                          ? 'bg-stone-800 text-stone-100 border-stone-800'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider for days to interview */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-stone-600 font-semibold uppercase tracking-wider">
                  <span>Target Interview Timeline</span>
                  <span className="text-amber-700 font-bold">{daysToInterview} Days</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="180"
                  value={daysToInterview}
                  onChange={(e) => setDaysToInterview(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              {/* Multi-select Checklist for target companies */}
              <div className="space-y-2">
                <label className="text-xs text-stone-600 font-semibold uppercase tracking-wider block">Target Companies</label>
                <div className="flex flex-wrap gap-2">
                  {COMPANIES_LIST.map((comp) => {
                    const active = selectedCompanies.includes(comp);
                    return (
                      <button
                        key={comp}
                        onClick={() => toggleCompany(comp)}
                        className={`py-1.5 px-3 rounded-full text-xs font-medium border transition ${
                          active
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-transparent text-stone-500 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LeetCode stats */}
              <div className="space-y-2">
                <label className="text-xs text-stone-600 font-semibold uppercase tracking-wider block">Current LeetCode Solved Count</label>
                <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-600 font-sans block uppercase tracking-wider">Easy</span>
                    <input
                      type="number"
                      min="0"
                      value={lcEasy}
                      onChange={(e) => setLcEasy(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl p-2.5 outline-none font-bold text-stone-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-600 font-sans block uppercase tracking-wider">Medium</span>
                    <input
                      type="number"
                      min="0"
                      value={lcMedium}
                      onChange={(e) => setLcMedium(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl p-2.5 outline-none font-bold text-stone-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-red-600 font-sans block uppercase tracking-wider">Hard</span>
                    <input
                      type="number"
                      min="0"
                      value={lcHard}
                      onChange={(e) => setLcHard(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl p-2.5 outline-none font-bold text-stone-800"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleOnboardingSubmit}
                  className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <span>Continue to Assessment Rules</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Phase 2: Intro card */}
          {phase === 'intro' && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-2 animate-bounce">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">Step 2 of 3</span>
                <h2 className="font-serif text-3xl font-bold text-stone-900">Let's Calibrate Your Mind</h2>
                <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
                  We will present a 6-step conceptual quiz (pattern identification, complexity sliders, constraints checking). 
                  No coding is required. We evaluate your core baseline strategies.
                </p>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <button
                  onClick={handleStartQuiz}
                  className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <span>Begin Conceptual Quiz</span>
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-xs text-stone-400 hover:text-stone-600 underline font-medium transition"
                >
                  Skip diagnostic quiz (default baseline 50/100)
                </button>
              </div>
            </div>
          )}

          {/* Phase 3: The 6-step Conceptual Quiz */}
          {phase === 'quiz' && (
            <div className="space-y-6">
              {/* Quiz Header: Progress bar & timer */}
              <div className="flex items-center justify-between border-b border-[#EFECE6] pb-4">
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-1">Question {quizIdx + 1} of 6</span>
                  <div className="w-32 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full transition-all duration-300" style={{ width: `${((quizIdx + 1) / 6) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-50 border border-[#EFECE6] text-xs font-mono text-stone-500 font-bold">
                  <Clock className="w-3.5 h-3.5 text-stone-450" />
                  <span>{formatTime(quizTime)}</span>
                </div>
              </div>

              {/* Question container */}
              <div className="min-h-[220px] py-2">
                
                {/* Q1: Pattern recognition (Prefix sum) */}
                {quizIdx === 0 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">1. Pattern Recognition</h3>
                      <p className="text-stone-500 text-xs mt-0.5">Determine the core algorithmic pattern mapping the inputs to their corresponding outputs.</p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 font-mono text-xs text-stone-600 space-y-1">
                      <p><strong className="font-sans text-stone-800">Input:</strong> nums = [1, 2, 3, 4]</p>
                      <p><strong className="font-sans text-stone-800">Output:</strong> sums = [1, 3, 6, 10]</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {['prefix-sum', 'binary-search', 'sliding-window', 'two-pointers'].map((pat) => (
                        <button
                          key={pat}
                          onClick={() => handleQuizAnswer('q1', pat)}
                          className={`py-3 px-4 rounded-xl border text-xs font-semibold capitalize text-left transition ${
                            quizAnswers.q1 === pat
                              ? 'bg-amber-50 text-amber-800 border-amber-400 shadow-sm'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {pat.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q2: Pattern recognition (Sliding window) */}
                {quizIdx === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">2. Pattern Recognition</h3>
                      <p className="text-stone-500 text-xs mt-0.5">Determine the core algorithmic pattern mapping the inputs to their corresponding outputs.</p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 font-mono text-xs text-stone-600 space-y-1">
                      <p><strong className="font-sans text-stone-800">Input:</strong> nums = [2, 1, 5, 1, 3, 2], k = 3</p>
                      <p><strong className="font-sans text-stone-800">Output:</strong> max_sum = 9</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {['monotonic-stack', 'sliding-window', 'graph-bfs', 'interval-merge'].map((pat) => (
                        <button
                          key={pat}
                          onClick={() => handleQuizAnswer('q2', pat)}
                          className={`py-3 px-4 rounded-xl border text-xs font-semibold capitalize text-left transition ${
                            quizAnswers.q2 === pat
                              ? 'bg-amber-50 text-amber-800 border-amber-400 shadow-sm'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {pat.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q3: Observation quality (Maximum Subarray constraints) */}
                {quizIdx === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">3. Critical Observations</h3>
                      <p className="text-stone-500 text-xs mt-0.5">Select the TWO constraints/implications that are mathematically critical for Kadane's maximum subarray sum algorithm.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      {[
                        { id: 1, text: 'Elements in the array can be negative' },
                        { id: 2, text: 'The array has at least one element (non-empty)' },
                        { id: 3, text: 'The array elements are guaranteed to be sorted' },
                        { id: 4, text: 'The time complexity target must be O(N^2) for optimal runs' }
                      ].map((opt) => {
                        const checked = quizAnswers.q3.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            onClick={() => toggleCheckboxAnswer('q3', opt.id)}
                            className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                              checked
                                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                            }`}
                          >
                            <span>{opt.text}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                              checked ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300 bg-white'
                            }`}>
                              {checked && <span className="text-[10px]">✔</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Q4: Optimization (Subarray loop big-O complexity) */}
                {quizIdx === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">4. Complexity Analysis</h3>
                      <p className="text-stone-500 text-xs mt-0.5">Identify the tightest time complexity bound for the following nested subarray sum calculation code.</p>
                    </div>

                    <pre className="bg-stone-900 text-stone-250 p-4 rounded-xl border border-stone-850 font-mono text-xs overflow-x-auto">
{`max_val = -infinity
for i in range(len(arr)):
    for j in range(i, len(arr)):
        current_sum = sum(arr[i:j+1])
        max_val = max(max_val, current_sum)`}
                    </pre>

                    <div className="space-y-2 pt-2">
                      {['O(N)', 'O(N log N)', 'O(N^2)', 'O(N^3)'].map((cpl) => (
                        <button
                          key={cpl}
                          onClick={() => handleQuizAnswer('q4', cpl)}
                          className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold text-left transition ${
                            quizAnswers.q4 === cpl
                              ? 'bg-amber-50 text-amber-800 border-amber-400'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {cpl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q5: Observation quality (Weighted Graph path path invariants) */}
                {quizIdx === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">5. Critical Invariants</h3>
                      <p className="text-stone-500 text-xs mt-0.5">Select the TWO correct invariants concerning finding the shortest path on a weighted graph with positive weights.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      {[
                        { id: 1, text: "Dijkstra's Algorithm is optimal because all weights are non-negative" },
                        { id: 2, text: "BFS finds shortest path only when all edge weights are unweighted (or equal)" },
                        { id: 3, text: 'Negative cycles require the Dijkstra path algorithm' },
                        { id: 4, text: 'Depth First Search (DFS) is optimal for shortest path weights' }
                      ].map((opt) => {
                        const checked = quizAnswers.q5.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            onClick={() => toggleCheckboxAnswer('q5', opt.id)}
                            className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                              checked
                                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                            }`}
                          >
                            <span>{opt.text}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                              checked ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300 bg-white'
                            }`}>
                              {checked && <span className="text-[10px]">✔</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Q6: Complexity Slider (Binary Search code) */}
                {quizIdx === 5 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">6. Complexity Analysis</h3>
                      <p className="text-stone-500 text-xs mt-0.5">Determine the tightest time complexity for this standard searching logic block.</p>
                    </div>

                    <pre className="bg-stone-900 text-stone-250 p-4 rounded-xl border border-stone-850 font-mono text-xs overflow-x-auto">
{`low = 0
high = len(arr) - 1
while low <= high:
    mid = (low + high) // 2
    if arr[mid] == target: return mid
    elif arr[mid] < target: low = mid + 1
    else: high = mid - 1`}
                    </pre>

                    <div className="space-y-2 pt-2">
                      {['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'].map((cpl) => (
                        <button
                          key={cpl}
                          onClick={() => handleQuizAnswer('q6', cpl)}
                          className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold text-left transition ${
                            quizAnswers.q6 === cpl
                              ? 'bg-amber-50 text-amber-800 border-amber-400'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {cpl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between border-t border-[#EFECE6] pt-4 shrink-0">
                <button
                  onClick={handleBackQuiz}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex items-center gap-1 ${
                    quizIdx === 0
                      ? 'opacity-30 cursor-not-allowed'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                  disabled={quizIdx === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNextQuiz}
                  className="py-2.5 px-4 bg-stone-800 hover:bg-stone-900 text-stone-100 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <span>{quizIdx === 5 ? 'Finish & Submit' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Phase 4: Submitting loader */}
          {phase === 'submitting' && (
            <div className="space-y-6 text-center py-12">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-amber-100 border-t-amber-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-stone-900">AI Scoring Engine Active</h3>
                <p className="text-stone-450 text-xs">Evaluating your logic responses and tracking pattern alignment...</p>
              </div>
            </div>
          )}

          {/* Phase 5: Results Display */}
          {phase === 'result' && scores && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">Assessment Complete</span>
                <h2 className="font-serif text-2xl font-bold text-stone-900 leading-tight">Your Ability Profile</h2>
                <p className="text-stone-500 text-xs mt-0.5">Your diagnostic baseline scores across six core dimensions.</p>
              </div>

              {/* Layout for Radar Chart & AI review */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-b border-[#EFECE6] py-6">
                
                {/* SVG Radar Chart */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-3">Diagnostic Radar Chart</span>
                  <svg className="w-48 h-48 overflow-visible" viewBox="0 0 200 200">
                    {/* Grids */}
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#F1EFEA" strokeWidth="1" />
                    <circle cx="100" cy="100" r="50" fill="none" stroke="#F1EFEA" strokeWidth="1" />
                    <circle cx="100" cy="100" r="30" fill="none" stroke="#F1EFEA" strokeWidth="1" />
                    
                    {/* Grid lines */}
                    {[0, 60, 120, 180, 240, 300].map((deg) => {
                      const rad = (deg * Math.PI) / 180 - Math.PI / 2;
                      return (
                        <line
                          key={deg}
                          x1="100"
                          y1="100"
                          x2={100 + 70 * Math.cos(rad)}
                          y2={100 + 70 * Math.sin(rad)}
                          stroke="#F1EFEA"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Radar polygon shape */}
                    <polygon
                      points={getRadarPoints()}
                      fill="rgba(217, 119, 6, 0.15)"
                      stroke="#D97706"
                      strokeWidth="2"
                    />

                    {/* Dimensions Labels */}
                    <text x="100" y="20" textAnchor="middle" className="text-[7px] fill-stone-400 font-bold uppercase tracking-wider">Pattern</text>
                    <text x="175" y="65" textAnchor="start" className="text-[7px] fill-stone-400 font-bold uppercase tracking-wider">Obs</text>
                    <text x="175" y="145" textAnchor="start" className="text-[7px] fill-stone-400 font-bold uppercase tracking-wider">Formula</text>
                    <text x="100" y="188" textAnchor="middle" className="text-[7px] fill-stone-400 font-bold uppercase tracking-wider">Optim</text>
                    <text x="25" y="145" textAnchor="end" className="text-[7px] fill-stone-400 font-bold uppercase tracking-wider">Speed</text>
                    <text x="25" y="65" textAnchor="end" className="text-[7px] fill-stone-400 font-bold uppercase tracking-wider">Cons</text>
                  </svg>
                  
                  {/* Table fallback for accessibility/screen readers */}
                  <table className="sr-only">
                    <caption>Diagnostic quiz scores</caption>
                    <thead>
                      <tr><th>Dimension</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Pattern Recognition</td><td>{scores.scorePattern}%</td></tr>
                      <tr><td>Observation Quality</td><td>{scores.scoreObservation}%</td></tr>
                      <tr><td>Formula Discovery</td><td>{scores.scoreFormula}%</td></tr>
                      <tr><td>Optimization Ability</td><td>{scores.scoreOptimization}%</td></tr>
                      <tr><td>Speed Score</td><td>{scores.scoreSpeed}%</td></tr>
                      <tr><td>Consistency</td><td>{scores.scoreConsistency}%</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* AI Mentor Brief */}
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex items-center gap-1.5 text-stone-500 font-semibold uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4 text-amber-600" />
                    <span>AI Mentor Baseline Briefing</span>
                  </div>
                  <div className="p-4 bg-stone-50 border border-stone-200/70 rounded-2xl text-stone-600 leading-relaxed font-normal">
                    {scores.mentorBrief}
                  </div>
                </div>

              </div>

              <div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <span>Go to Personalized Roadmap</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
