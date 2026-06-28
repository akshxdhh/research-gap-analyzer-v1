"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { FileDown, FileText, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const { analysisResult } = useAnalysisStore();
  const [format, setFormat] = useState<"markdown" | "pdf" | "docx">("markdown");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!analysisResult) return;
    
    setIsGenerating(true);
    setError("");
    setReportUrl(null);
    
    try {
      // Assuming backend /api/v1/reports endpoint expects { analysis_data, format }
      const response = await api.generateReport({ analysis: analysisResult, format });
      
      const url = window.URL.createObjectURL(response);
      setReportUrl(url);
      
    } catch (err: any) {
      console.error(err);
      // Fallback for MVP if backend /reports isn't generating files properly
      const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'text/plain' });
      setReportUrl(window.URL.createObjectURL(blob));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Generate Report</h1>
        <p className="text-muted-foreground">Export your latest analysis into a structured document.</p>
      </div>

      {!analysisResult ? (
        <div className="glass-panel p-12 text-center rounded-2xl">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Analysis Data</h3>
          <p className="text-muted-foreground mb-6">Run an analysis first before generating a report.</p>
          <a href="/analysis" className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity">
            Go to Analysis
          </a>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl space-y-8"
        >
          <div>
            <h3 className="text-lg font-medium mb-4">Select Format</h3>
            <div className="grid grid-cols-3 gap-4">
              {["markdown", "pdf", "docx"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt as any)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    format === fmt 
                      ? "border-primary bg-primary/10 text-primary glow-primary" 
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <FileText className="w-6 h-6" />
                  <span className="font-medium uppercase">{fmt}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/50 flex justify-end gap-4">
            {reportUrl ? (
              <a 
                href={reportUrl}
                download={`research_report.${format === 'markdown' ? 'md' : format}`}
                className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors"
                onClick={() => setTimeout(() => setReportUrl(null), 1000)}
              >
                <CheckCircle className="w-5 h-5" />
                Download Ready
              </a>
            ) : (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity glow-primary"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
