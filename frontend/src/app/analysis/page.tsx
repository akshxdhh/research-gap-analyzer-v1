"use client";

import { useState } from "react";
import { Search, Loader2, BookOpen, AlertCircle, TrendingUp, Filter, Sparkles, Network } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAnalysisStore";
import { motion, AnimatePresence } from "framer-motion";

export default function AnalysisDashboard() {
  const [query, setQuery] = useState("");
  const { analysis: result, setAnalysis: setResult, clearAnalysis, isAnalyzing, setIsAnalyzing } = useAppStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    clearAnalysis();
    try {
      const output = await api.analyze({ query });
      setResult(output);
    } catch (err) {
      console.error(err);
      alert("Failed to run analysis.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center pt-12 md:pt-24 px-4 w-full max-w-4xl mx-auto transition-all duration-500">
      
      {/* Dynamic Header: Centers when empty, moves up when results exist */}
      <motion.div 
        layout
        className={`w-full flex flex-col ${result || isAnalyzing ? 'items-start mb-8' : 'items-center mb-12 text-center'}`}
      >
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 flex items-center gap-3">
          <Sparkles className={`w-8 h-8 md:w-10 md:h-10 text-primary ${isAnalyzing ? 'animate-pulse' : ''}`} />
          Intelligence Engine
        </h1>
        <p className="text-muted-foreground text-lg">
          Ask complex research questions to synthesize across your indexed knowledge base.
        </p>
      </motion.div>

      {/* Search Input */}
      <motion.form 
        layout
        onSubmit={handleSearch} 
        className="w-full relative group mb-12"
      >
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are the limitations of RAG compared to long-context LLMs?"
          className="w-full bg-card border-2 border-border hover:border-primary/50 focus:border-primary rounded-full py-5 pl-16 pr-36 shadow-lg text-lg focus:outline-none transition-all placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={isAnalyzing || !query.trim()}
          className="absolute inset-y-2 right-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
        </button>
      </motion.form>

      {/* Loading State */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground space-y-4"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <Network className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-lg font-medium text-foreground">Orchestrating Agentic Retrieval...</p>
            <p className="text-sm">Synthesizing across chunks, identifying methodologies, and mapping research gaps.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results View */}
      {result && !isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-8 pb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary/10 rounded-md">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                Detected Methodologies
              </h3>
              <ul className="space-y-3">
                {result.extracted_info.methodologies.map((m, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <div className="p-2 bg-destructive/10 rounded-md">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                Recurring Limitations
              </h3>
              <ul className="space-y-3">
                {result.recurring_limitations.map((l, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-md">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              Inferred Research Gaps
            </h3>
            <div className="space-y-4">
              {result.inferred_gaps.map((gap, i) => (
                <div key={i} className="p-5 bg-muted/30 border border-border rounded-xl hover:border-emerald-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h4 className="font-medium leading-snug">{gap.description}</h4>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded-full shrink-0">
                      {(gap.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/50">
                    <strong className="text-foreground font-medium">Evidence:</strong> {gap.evidence_citations.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-md">
                <Filter className="w-6 h-6 text-purple-500" />
              </div>
              Paper Comparisons & Contradictions
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="py-4 px-5 font-medium">Paper A</th>
                    <th className="py-4 px-5 font-medium border-l border-border">Paper B</th>
                    <th className="py-4 px-5 font-medium border-l border-border">Contradictions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.comparisons.map((comp, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-5 font-medium">{comp.paper_a_citation}</td>
                      <td className="py-4 px-5 font-medium border-l border-border">{comp.paper_b_citation}</td>
                      <td className="py-4 px-5 border-l border-border text-destructive">
                        {comp.contradictions.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {comp.contradictions.map((c, j) => <li key={j}>{c}</li>)}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">None detected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
