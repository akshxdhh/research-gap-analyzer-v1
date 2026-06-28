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
  
  pollingInterval: number | null;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useAnalysisStore = create<AppState>((set, get) => ({
  projects: [],
  papers: [],
  gaps: [],
  isLoading: false,
  error: null,
  pollingInterval: null,
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
  },

  startPolling: () => {
    if (get().pollingInterval) return;
    const interval = setInterval(() => {
      // Don't set isLoading during polling to prevent UI flicker
      api.getProjects().then(res => set({ projects: res || [] })).catch(console.error);
      api.getPapers().then(res => set({ papers: res || [] })).catch(console.error);
      api.getGaps().then(res => set({ gaps: res || [] })).catch(console.error);
    }, 5000) as unknown as number;
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ pollingInterval: null });
    }
  }
}));
