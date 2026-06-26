"use client";

import { useState } from "react";
import { FileText, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAnalysisStore } from "@/store/useAnalysisStore";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const analysis = useAnalysisStore((state) => state.analysis);

  const handleGenerate = async () => {
    if (!analysis) return;
    
    setGenerating(true);
    setSuccessMessage(null);
    try {
      const blob = await api.generateReport({ analysis, format });
      
      // Create object URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${format}`);
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
    <div className="max-w-3xl mx-auto mt-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Generator</h1>
        <p className="text-slate-500 mt-2">
          Compile your current analysis into a professional, human-readable Research Proposal.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-xl mx-auto">
        {!analysis ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-amber-50 rounded-xl border border-amber-200">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
            <h3 className="text-lg font-medium text-amber-900 mb-2">No Analysis Data</h3>
            <p className="text-sm text-amber-700">
              You must run an analysis from the dashboard before generating a report.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                {["markdown", "pdf", "docx"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`py-3 px-4 border rounded-lg font-medium capitalize transition-all ${
                      format === fmt 
                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  LLM is writing your report...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Professional Report
                </>
              )}
            </button>

            {successMessage && (
              <div className="mt-6 p-6 border border-emerald-200 bg-emerald-50 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-emerald-900 mb-1">{successMessage}</h3>
                <p className="text-sm text-emerald-700">Check your browser downloads.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
