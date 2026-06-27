import axios, { AxiosError } from "axios";

// --- Types ---
export interface QueryFilters {
  authors?: string[];
  start_year?: number;
  end_year?: number;
  keywords?: string[];
}

export interface AnalyzeRequest {
  query: string;
  filters?: QueryFilters;
}

export interface OptimizedContextItem {
  content: string;
  source_type: string;
  citations: any;
  score: number;
}

export interface ExtractedInformation {
  methodologies: string[];
  datasets: string[];
  metrics: string[];
  results: string[];
  limitations: string[];
  future_work: string[];
}

export interface PaperComparison {
  paper_a_citation: string;
  paper_b_citation: string;
  similarities: string[];
  differences: string[];
  contradictions: string[];
}

export interface ResearchGap {
  description: string;
  confidence: number;
  evidence_citations: string[];
}

export interface AnalysisOutput {
  extracted_info: ExtractedInformation;
  comparisons: PaperComparison[];
  recurring_limitations: string[];
  inferred_gaps: ResearchGap[];
}

export interface GenerateReportRequest {
  analysis: AnalysisOutput;
  format: string;
}

export interface ReportResponse {
  message: string;
  file_path: string;
  format: string;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
  status: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: number;
  upload_date: string;
}

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes (Analysis takes a long time)
});

// --- Interceptors ---
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // We handle global API errors here. 
    // In the future, this can trigger a global toast via Zustand.
    console.error("API Error Response:", error.response?.data || error.message);
    if (!error.response) {
      console.error("Backend might be offline or CORS failed.");
    }
    return Promise.reject(error);
  }
);

// --- API Service ---
export const api = {
  // Analysis
  analyze: async (request: AnalyzeRequest): Promise<AnalysisOutput> => {
    const response = await apiClient.post<AnalysisOutput>("/analyze/", request);
    return response.data;
  },

  // Files
  uploadFile: async (file: File, onUploadProgress?: (progressEvent: any) => void): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return response.data;
  },

  // Reports
  generateReport: async (request: GenerateReportRequest): Promise<Blob> => {
    const response = await apiClient.post("/reports/", request, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  // Status
  getStatus: async (): Promise<any> => {
    const response = await apiClient.get("/status/", { timeout: 5000 });
    return response.data;
  },

  // Projects (Stubbed fallback for UI design)
  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await apiClient.get("/projects/");
      if (response.data && response.data.length > 0) return response.data;
    } catch (e) {
      console.warn("Projects endpoint missing or failed. Using mock data for UI.");
    }
    return [
      { id: "1", name: "LLM Reasoning Capabilities", created_at: "2026-06-25", status: "Completed" },
      { id: "2", name: "CRISPR Off-target Effects", created_at: "2026-06-26", status: "Active" }
    ];
  },

  // Papers (Stubbed fallback for UI design)
  getPapers: async (): Promise<Paper[]> => {
    try {
      const response = await apiClient.get("/papers/");
      if (response.data && response.data.length > 0) return response.data;
    } catch (e) {
      console.warn("Papers endpoint missing or failed. Using mock data for UI.");
    }
    return [
      { id: "101", title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, upload_date: "2026-06-20" },
      { id: "102", title: "Chain-of-Thought Prompting Elicits Reasoning", authors: "Wei et al.", year: 2022, upload_date: "2026-06-22" }
    ];
  },

  // Gaps (Stubbed fallback for UI design)
  getGaps: async (): Promise<ResearchGap[]> => {
    try {
      const response = await apiClient.get("/gaps/");
      if (response.data && response.data.length > 0) return response.data;
    } catch (e) {
      console.warn("Gaps endpoint missing or failed. Using mock data for UI.");
    }
    return [
      {
        description: "Lack of longitudinal studies on reasoning degradation in infinite context windows.",
        confidence: 0.92,
        evidence_citations: ["Wei et al. (2022)"]
      },
      {
        description: "Limited metrics evaluating temporal understanding across disparate RAG chunk retrievals.",
        confidence: 0.85,
        evidence_citations: ["Vaswani et al. (2017)"]
      }
    ];
  }
};
