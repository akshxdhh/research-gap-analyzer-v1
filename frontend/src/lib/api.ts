import axios from "axios";

// Pydantic matching types
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const api = {
  analyze: async (request: AnalyzeRequest): Promise<AnalysisOutput> => {
    const response = await apiClient.post<AnalysisOutput>("/analyze/", request);
    return response.data;
  },

  uploadFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  generateReport: async (request: GenerateReportRequest): Promise<Blob> => {
    const response = await apiClient.post("/reports/", request, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  getStatus: async (): Promise<any> => {
    const response = await apiClient.get("/status/");
    return response.data;
  }
};
