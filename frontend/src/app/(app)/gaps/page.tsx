"use client";

import { useEffect, useState } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Target, Search, Filter, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function GapsPage() {
  const { gaps, isLoading, refreshGaps } = useAnalysisStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    refreshGaps();
  }, [refreshGaps]);

  const filteredGaps = gaps.filter(g => 
    g.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Research Gaps</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search gaps..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="p-2 border border-border rounded-full hover:bg-muted transition-colors">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-48 shimmer rounded-xl" />
          ))
        ) : filteredGaps.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No research gaps identified yet.</p>
          </div>
        ) : (
          filteredGaps.map((gap, i) => {
            const score = gap.confidence_score || 0.5;
            const scoreColor = score > 0.8 ? "bg-emerald-500" : score > 0.5 ? "bg-yellow-500" : "bg-red-500";
            
            return (
              <motion.div 
                key={gap.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-card rounded-md border border-border">
                    {Math.round(score * 100)}% Confidence
                  </span>
                </div>
                
                <p className="text-sm flex-1 mb-6 text-foreground/90 leading-relaxed">
                  {gap.description}
                </p>
                
                <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                  <div className={`h-1.5 rounded-full ${scoreColor}`} style={{ width: `${score * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Evidence strength</span>
                  <span>{gap.evidence_count || 1} citations</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
