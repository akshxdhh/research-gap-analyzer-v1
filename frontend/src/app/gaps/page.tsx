"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAnalysisStore";
import { api } from "@/lib/api";
import { Lightbulb, Loader2, ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function GapsPage() {
  const { gaps, setGaps } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (gaps.length === 0) {
        try {
          const res = await api.getGaps();
          setGaps(res);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
    load();
  }, [gaps, setGaps]);

  return (
    <div className="p-8 h-full flex flex-col space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-amber-500" />
            Research Gaps
          </h1>
          <p className="text-muted-foreground">AI-inferred white space in the current literature corpus.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <TrendingUp className="w-4 h-4" />
          Generate New Hypothesis
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Aggregating inferred gaps...</p>
          </div>
        ) : gaps.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
            <Lightbulb className="w-12 h-12 opacity-20 mb-4" />
            <p className="text-lg font-medium text-foreground">No gaps identified yet</p>
            <p className="text-sm">Run an analysis first to populate this dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gaps.map((gap, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all flex flex-col group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    gap.confidence > 0.9 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {(gap.confidence * 100).toFixed(0)}% Confidence
                  </div>
                </div>
                
                <h3 className="text-lg font-medium leading-snug mb-4 flex-1">
                  {gap.description}
                </h3>
                
                <div className="mt-auto">
                  <p className="text-xs text-muted-foreground mb-2">Supporting Evidence:</p>
                  <div className="flex flex-wrap gap-2">
                    {gap.evidence_citations.map((cite, j) => (
                      <span key={j} className="text-xs bg-muted/50 border border-border px-2 py-1 rounded-md text-muted-foreground">
                        {cite}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-medium">Explore Hypothesis</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
