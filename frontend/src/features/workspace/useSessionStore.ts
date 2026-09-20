import { create } from 'zustand';

export type SessionPhase =
  | 'READING_PROBLEM'
  | 'PATTERN_DISCOVERY'
  | 'OBSERVATION_TRAINING'
  | 'APPROACH_REASONING'
  | 'CODING_UNLOCKED'
  | 'SUBMITTED'
  | 'ANALYZED'
  | 'REFLECTION_REQUIRED'
  | 'COMPLETED';

interface SessionState {
  sessionId: string | null;
  currentPhase: SessionPhase;
  thinkingTime: number;
  totalTime: number;
  unlockedHints: string[];
  hintsUsed: number;
  setSessionId: (id: string | null) => void;
  setCurrentPhase: (phase: SessionPhase) => void;
  incrementThinkingTime: () => void;
  incrementTotalTime: () => void;
  addHint: (hintId: string) => void;
  resetTimers: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  currentPhase: 'READING_PROBLEM',
  thinkingTime: 0,
  totalTime: 0,
  unlockedHints: [],
  hintsUsed: 0,
  setSessionId: (sessionId) => set({ sessionId }),
  setCurrentPhase: (currentPhase) => set({ currentPhase }),
  incrementThinkingTime: () => set((state) => ({ thinkingTime: state.thinkingTime + 1 })),
  incrementTotalTime: () => set((state) => ({ totalTime: state.totalTime + 1 })),
  addHint: (hintId) =>
    set((state) => ({
      unlockedHints: [...state.unlockedHints, hintId],
      hintsUsed: state.hintsUsed + 1,
    })),
  resetTimers: () => set({ thinkingTime: 0, totalTime: 0 }),
}));
