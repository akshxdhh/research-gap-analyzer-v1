import { create } from 'zustand';
import { AnalysisOutput } from '@/lib/api';

interface AnalysisState {
  analysis: AnalysisOutput | null;
  setAnalysis: (analysis: AnalysisOutput) => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysis: null,
  setAnalysis: (analysis) => set({ analysis }),
  clearAnalysis: () => set({ analysis: null }),
}));
