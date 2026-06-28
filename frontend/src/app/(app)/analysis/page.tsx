"use client";

import { useState } from "react";
import { Search, Sparkles, Brain, FileText, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAnalysisStore } from "@/store/useAnalysisStore";

export default function AnalysisPage() {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const { setAnalysisResult } = useAnalysisStore();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setError("");

    try {
      const response = await api.analyze({ query });
      setResult(response);
      setAnalysisResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4 pt-10">
        <h1 className="text-4xl font-bold">Research Analysis</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ask a question or describe a research area. Our AI agents will synthesize literature from your library and external sources to identify exact gaps.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleAnalyze} className="relative max-w-3xl mx-auto">
        <div className={`glass rounded-2xl p-2 flex items-center transition-all ${isAnalyzing ? "border-primary/50 glow-primary" : "focus-within:border-primary/50 focus-within:glow-primary"}`}>
          <div className="pl-4 pr-2 text-muted-foreground">
            {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Search className="w-6 h-6" />}
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isAnalyzing}
            placeholder="e.g. What are the limitations of current transformer models in long-context retrieval?"
            className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-lg text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isAnalyzing || !query.trim()}
            className="bg-primary text-primary-foreground p-4 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="max-w-3xl mx-auto bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Analyzing Animation */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-3xl mx-auto flex flex-col items-center py-12 overflow-hidden"
          >
            <div className="relative w-32 h-32 mb-8">
              <motion.div 
                className="absolute inset-0 border-4 border-primary/30 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="absolute inset-4 border-4 border-accent/50 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1], rotate: 180 }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-10 h-10 text-primary" />
              </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 bg-card rounded-full text-xs font-medium text-muted-foreground border border-border animate-pulse">Searching arXiv</span>
              <span className="px-3 py-1 bg-card rounded-full text-xs font-medium text-muted-foreground border border-border animate-pulse" style={{ animationDelay: "0.5s" }}>Querying Local DB</span>
              <span className="px-3 py-1 bg-card rounded-full text-xs font-medium text-muted-foreground border border-border animate-pulse" style={{ animationDelay: "1s" }}>Synthesizing</span>
            </div>
            
            <p className="text-muted-foreground">Agents are analyzing the literature...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {result && !isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Summary */}
          <div className="glass-panel p-8 rounded-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" /> 
              Synthesis Summary
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              {result.synthesis_summary || result.summary || "Analysis completed successfully."}
            </p>
          </div>

          {/* Gaps Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Identified Research Gaps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.inferred_gaps?.map((gap: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-6 border border-primary/20"
                >
                  <h3 className="font-semibold text-lg mb-2">{gap.title || `Gap ${idx + 1}`}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{gap.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
                      Confidence: {gap.confidence_score || gap.confidence || "High"}
                    </span>
                    <span className="text-muted-foreground">
                      {gap.supporting_evidence?.length || 0} citations
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Methodologies */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Extracted Methodologies</h2>
            <div className="grid grid-cols-1 gap-3">
              {result.methodology_clusters?.map((cluster: any, idx: number) => (
                <div key={idx} className="bg-card/50 border border-border p-4 rounded-xl">
                  <h4 className="font-medium text-primary mb-1">{cluster.method_name || "Method"}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{cluster.description}</p>
                  <p className="text-xs text-muted-foreground italic">Papers: {cluster.papers?.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}
