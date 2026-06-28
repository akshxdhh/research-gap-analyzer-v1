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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes (Analysis takes a long time)
});

// --- Interceptors ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config: any = error.config;
    
    // We handle global API errors here. 
    // Silence intentional background check timeouts in the console.
    if (error.code !== "ECONNABORTED") {
      console.error("API Error Response:", error.response?.data || error.message);
    }
    
    if (!error.response && error.code !== "ECONNABORTED") {
      // Do not use console.error for network failures as it causes turbopack overlay spam.
      // The UI will handle offline states gracefully via Toast or Badges.
    }

    // Auto-retry network errors or 5xx errors up to 2 times (for non-POST requests)
    if (config && (!config._retryCount || config._retryCount < 2) && config.method !== 'post') {
      config._retryCount = (config._retryCount || 0) + 1;
      
      // Exponential backoff
      const backoffDelay = Math.pow(2, config._retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// --- API Service ---
export const api = {
  // Analysis
  analyze: async (request: AnalyzeRequest): Promise<AnalysisOutput> => {
    const response = await apiClient.post<AnalysisOutput>("/analyze", request);
    return response.data;
  },

  // Files
  uploadFile: async (file: File, onUploadProgress?: (progressEvent: any) => void): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return response.data;
  },

  // Reports
  generateReport: async (request: GenerateReportRequest): Promise<Blob> => {
    const response = await apiClient.post("/reports", request, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  // Status
  getStatus: async (): Promise<any> => {
    const response = await apiClient.get("/status", { timeout: 3000 });
    return response.data;
  },
  
  refreshStatus: async (): Promise<any> => {
    const response = await apiClient.post("/status/refresh", {}, { timeout: 15000 });
    return response.data;
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get("/projects");
    return response.data || [];
  },

  // Papers
  getPapers: async (): Promise<Paper[]> => {
    const response = await apiClient.get("/papers");
    return response.data || [];
  },

  // Gaps
  getGaps: async (): Promise<ResearchGap[]> => {
    const response = await apiClient.get("/gaps");
    return response.data || [];
  },

  // Settings
  getSettings: async (): Promise<any> => {
    const response = await apiClient.get("/settings");
    return response.data;
  },
  
  updateSettings: async (updates: any): Promise<any> => {
    const response = await apiClient.put("/settings", updates);
    return response.data;
  }
};
