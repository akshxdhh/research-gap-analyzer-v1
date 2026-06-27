"use client";

import { useState } from "react";
import { FileText, Download, Loader2, CheckCircle, AlertCircle, FileType2, Presentation } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAnalysisStore";
import { motion, AnimatePresence } from "framer-motion";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { analysis } = useAppStore();

  const handleGenerate = async () => {
    if (!analysis) return;
    
    setGenerating(true);
    setSuccessMessage(null);
    try {
      const blob = await api.generateReport({ analysis, format });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gap_analysis_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage(`Successfully generated and downloaded ${format.toUpperCase()} report.`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col space-y-2 text-center items-center mt-12 mb-8">
        <div className="p-4 bg-primary/10 rounded-2xl mb-4">
          <Presentation className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Report Generator</h1>
        <p className="text-muted-foreground max-w-lg">
          Transform your AI-inferred analysis and research gaps into a comprehensive, human-readable Research Proposal.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-xl mx-auto w-full relative overflow-hidden">
        {!analysis ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-amber-500/5 rounded-xl border border-amber-500/20">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-4 opacity-80" />
            <h3 className="text-lg font-medium text-foreground mb-2">Analysis Required</h3>
            <p className="text-sm text-muted-foreground">
              You must run an analysis query from the Intelligence Engine before generating a report.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <FileType2 className="w-4 h-4 text-muted-foreground" />
                Select Export Format
              </label>
              <div className="grid grid-cols-3 gap-4">
                {["markdown", "pdf", "docx"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`py-4 px-4 border-2 rounded-xl font-medium capitalize transition-all flex flex-col items-center gap-2 ${
                      format === fmt 
                        ? "bg-primary/5 border-primary text-primary" 
                        : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <FileText className={`w-6 h-6 ${format === fmt ? 'text-primary' : 'text-muted-foreground'}`} />
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-3 shadow-md"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Writing comprehensive report...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate {format.toUpperCase()} Report
                </>
              )}
            </button>

            <AnimatePresence>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-xl text-center flex flex-col items-center"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">{successMessage}</h3>
                  <p className="text-sm text-muted-foreground">The file should now be in your downloads folder.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
