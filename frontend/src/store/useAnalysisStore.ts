import { create } from 'zustand';
import { api } from '@/lib/api';

interface AppState {
  projects: any[];
  papers: any[];
  gaps: any[];
  isLoading: boolean;
  error: string | null;
  analysisResult: any | null;
  
  setAnalysisResult: (result: any) => void;
  refreshProjects: () => Promise<void>;
  refreshPapers: () => Promise<void>;
  refreshGaps: () => Promise<void>;
}

export const useAnalysisStore = create<AppState>((set) => ({
  projects: [],
  papers: [],
  gaps: [],
  isLoading: false,
  error: null,
  analysisResult: null,

  setAnalysisResult: (result) => set({ analysisResult: result }),

  refreshProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getProjects();
      set({ projects: res || [], isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to load projects";
      set({ error: msg, isLoading: false, projects: [] });
    }
  },

  refreshPapers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getPapers();
      set({ papers: res || [], isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to load papers";
      set({ error: msg, isLoading: false, papers: [] });
    }
  },

  refreshGaps: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getGaps();
      set({ gaps: res || [], isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to load gaps";
      set({ error: msg, isLoading: false, gaps: [] });
    }
  }
}));
