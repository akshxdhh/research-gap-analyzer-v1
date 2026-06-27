import { create } from 'zustand';
import { AnalysisOutput, Project, Paper, ResearchGap } from '@/lib/api';

interface AppState {
  // Global System State
  isBackendOnline: boolean;
  setBackendOnline: (status: boolean) => void;
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
  
  // Analysis State
  analysis: AnalysisOutput | null;
  isAnalyzing: boolean;
  setAnalysis: (analysis: AnalysisOutput) => void;
  setIsAnalyzing: (status: boolean) => void;
  clearAnalysis: () => void;

  // Cached Data State
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  papers: Paper[];
  setPapers: (papers: Paper[]) => void;
  gaps: ResearchGap[];
  setGaps: (gaps: ResearchGap[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isBackendOnline: true,
  setBackendOnline: (status) => set({ isBackendOnline: status }),
  globalError: null,
  setGlobalError: (error) => set({ globalError: error }),

  analysis: null,
  isAnalyzing: false,
  setAnalysis: (analysis) => set({ analysis, isAnalyzing: false, globalError: null }),
  setIsAnalyzing: (status) => set({ isAnalyzing: status }),
  clearAnalysis: () => set({ analysis: null }),

  projects: [],
  setProjects: (projects) => set({ projects }),
  papers: [],
  setPapers: (papers) => set({ papers }),
  gaps: [],
  setGaps: (gaps) => set({ gaps }),
}));
