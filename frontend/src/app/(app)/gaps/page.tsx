"use client";

import { useEffect, useState } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Target, Search, Filter, AlertTriangle, ChevronDown, ChevronUp, Copy, Download, Share2, Lightbulb, Database, BookOpen, ExternalLink, Hash, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GapsPage() {
  const { gaps, isLoading, refreshGaps } = useAnalysisStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    refreshGaps();
  }, [refreshGaps]);

  const filteredGaps = gaps.filter(g => 
    (g.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedGap(expandedGap === id ? null : id);
  };

  const handleCopy = (gap: any) => {
    const text = `Research Gap: ${gap.title || 'Untitled Gap'}
Category: ${gap.category || 'General'}
Confidence: ${Math.round((gap.confidence || 0) * 100)}%
Novelty: ${Math.round((gap.novelty_score || 0) * 100)}%

Description:
${gap.description}

Methodology:
${gap.suggested_methodology || 'N/A'}

Datasets:
${gap.potential_dataset || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(gap.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (gaps.length === 0) return;
    const headers = ["Title", "Category", "Confidence", "Novelty", "Description", "Methodology", "Datasets"];
    const rows = gaps.map(g => [
      `"${(g.title || '').replace(/"/g, '""')}"`,
      `"${(g.category || '').replace(/"/g, '""')}"`,
      g.confidence,
      g.novelty_score,
      `"${(g.description || '').replace(/"/g, '""')}"`,
      `"${(g.suggested_methodology || '').replace(/"/g, '""')}"`,
      `"${(g.potential_dataset || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "research_gaps.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (gaps.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gaps, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "research_gaps.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Research Gaps</h1>
          <p className="text-muted-foreground">AI-inferred blind spots and opportunities across analyzed literature.</p>
        </div>
        
        <div className="flex flex-wrap w-full md:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search gaps, categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button onClick={handleExportCSV} className="px-4 py-2 text-sm border border-border rounded-full hover:bg-muted transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={handleExportJSON} className="px-4 py-2 text-sm border border-border rounded-full hover:bg-muted transition-colors flex items-center gap-2">
            <Hash className="w-4 h-4" /> JSON
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-32 shimmer rounded-xl" />
          ))
        ) : filteredGaps.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground glass-panel rounded-2xl">
            <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-medium mb-2">No research gaps found</h3>
            <p>Upload more papers or adjust your analysis query to uncover new gaps.</p>
          </div>
        ) : (
          filteredGaps.map((gap, i) => {
            const confidenceScore = gap.confidence || 0.5;
            const noveltyScore = gap.novelty_score || 0.5;
            const confColor = confidenceScore > 0.8 ? "text-emerald-500" : confidenceScore > 0.5 ? "text-yellow-500" : "text-red-500";
            const novColor = noveltyScore > 0.8 ? "text-purple-500" : noveltyScore > 0.5 ? "text-blue-500" : "text-cyan-500";
            const isExpanded = expandedGap === gap.id;
            
            return (
              <motion.div 
                key={gap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}
              >
                {/* Header (Always visible) */}
                <div 
                  className="p-6 cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-card/50 transition-colors"
                  onClick={() => toggleExpand(gap.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider">
                        {gap.category || 'General'}
                      </span>
                      <h2 className="text-lg font-bold text-foreground leading-tight line-clamp-1">{gap.title || gap.description.substring(0, 50) + '...'}</h2>
                    </div>
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {gap.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 md:min-w-[300px] justify-end">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground font-medium">Confidence</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${confColor}`}>{Math.round(confidenceScore * 100)}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground font-medium">Novelty</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${novColor}`}>{Math.round(noveltyScore * 100)}%</span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); toggleExpand(gap.id); }}>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 bg-background/30"
                    >
                      <div className="p-6 space-y-6">
                        {/* Description */}
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2 uppercase tracking-wider"><Target className="w-4 h-4" /> Detailed Description</h3>
                          <p className="text-sm leading-relaxed text-foreground/90">{gap.description}</p>
                        </div>
                        
                        {/* Methodology & Datasets */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(gap.suggested_methodology || gap.future_research_direction) && (
                            <div className="glass-panel p-4 rounded-xl border border-border/50">
                              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Proposed Approach</h3>
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {gap.suggested_methodology || gap.future_research_direction}
                              </p>
                            </div>
                          )}
                          
                          {gap.potential_dataset && (
                            <div className="glass-panel p-4 rounded-xl border border-border/50">
                              <h3 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2"><Database className="w-4 h-4" /> Potential Datasets</h3>
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {gap.potential_dataset}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* References */}
                        <div className="flex flex-col md:flex-row gap-6 border-t border-border/50 pt-6">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Supporting Evidence</h3>
                            <ul className="space-y-2">
                              {(gap.evidence_citations || []).length > 0 ? (
                                gap.evidence_citations.map((cit: string, idx: number) => (
                                  <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                                    <span className="text-primary font-mono text-xs mt-0.5">{cit}</span>
                                    <span>{gap.supporting_papers?.[idx] || 'Source document'}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-muted-foreground">Derived analytically from general context.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(gap); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-card hover:bg-muted border border-border rounded-lg transition-colors"
                          >
                            {copiedId === gap.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            {copiedId === gap.id ? "Copied!" : "Copy Details"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
