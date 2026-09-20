import { create } from 'zustand';

interface SimulationState {
  isSimulation: boolean;
  companyTheme: 'default' | 'google' | 'amazon' | 'microsoft' | 'uber' | 'adobe';
  countdownSeconds: number;
  hintsDisabled: boolean;
  customInputsDisabled: boolean;
  setSimulation: (isSim: boolean) => void;
  setCompanyTheme: (theme: 'default' | 'google' | 'amazon' | 'microsoft' | 'uber' | 'adobe') => void;
  setCountdownSeconds: (seconds: number) => void;
  decrementCountdown: () => void;
  setRestrictions: (hintsDisabled: boolean, customInputsDisabled: boolean) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isSimulation: false,
  companyTheme: 'default',
  countdownSeconds: 2700, // default 45 mins
  hintsDisabled: false,
  customInputsDisabled: false,
  setSimulation: (isSimulation) => set({ isSimulation }),
  setCompanyTheme: (companyTheme) => set({ companyTheme }),
  setCountdownSeconds: (countdownSeconds) => set({ countdownSeconds }),
  decrementCountdown: () => set((state) => ({ countdownSeconds: Math.max(0, state.countdownSeconds - 1) })),
  setRestrictions: (hintsDisabled, customInputsDisabled) => set({ hintsDisabled, customInputsDisabled }),
}));
