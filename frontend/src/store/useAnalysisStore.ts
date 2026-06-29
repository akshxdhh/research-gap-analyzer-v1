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
  
  sseSource: EventSource | null;
  startSSE: () => void;
  stopSSE: () => void;
}

export const useAnalysisStore = create<AppState>((set, get) => ({
  projects: [],
  papers: [],
  gaps: [],
  isLoading: false,
  error: null,
  pollingInterval: null,
  sseSource: null,
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
      set({ papers: res.items || [], isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to load papers";
      set({ error: msg, isLoading: false, papers: [] });
    }
  },

  refreshGaps: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getGaps();
      set({ gaps: res.items || [], isLoading: false });
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
      api.getPapers().then(res => set({ papers: res.items || [] })).catch(console.error);
      api.getGaps().then(res => set({ gaps: res.items || [] })).catch(console.error);
    }, 5000) as unknown as number;
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ pollingInterval: null });
    }
  },

  startSSE: () => {
    if (get().sseSource) return;
    const sse = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/status/stream`);
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // data has { file_id, status, progress, error_message }
        set((state) => {
          const updatedPapers = state.papers.map(p => {
            if (p.id === data.file_id) {
              return { 
                ...p, 
                processing_status: data.status, 
                processing_progress: data.progress,
                error_message: data.error_message
              };
            }
            return p;
          });
          return { papers: updatedPapers };
        });
      } catch (e) {
        console.error("Failed to parse SSE data", e);
      }
    };
    set({ sseSource: sse });
  },

  stopSSE: () => {
    const sse = get().sseSource;
    if (sse) {
      sse.close();
      set({ sseSource: null });
    }
  }
}));
