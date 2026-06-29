"use client";

import { useEffect, useState } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Search, FileText, Trash2, ExternalLink } from "lucide-react";
const { FixedSizeList: List } = require("react-window");
const AutoSizer = require("react-virtualized-auto-sizer").default || require("react-virtualized-auto-sizer");

export default function LibraryPage() {
  const { papers, isLoading, refreshPapers } = useAnalysisStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    refreshPapers();
  }, [refreshPapers]);

  const filteredPapers = papers.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.authors && p.authors.join(", ").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const Row = ({ index, style }: { index: number, style: any }) => {
    const paper = filteredPapers[index];
    return (
      <div style={style} className="flex items-center px-6 border-b border-border/50 hover:bg-card-hover transition-colors group">
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-medium truncate" title={paper.title}>{paper.title}</p>
        </div>
        <div className="w-48 flex-shrink-0 text-muted-foreground truncate pr-4" title={paper.authors?.join(", ")}>
          {paper.authors?.join(", ") || "Unknown"}
        </div>
        <div className="w-24 flex-shrink-0 text-muted-foreground">
          {paper.year || "-"}
        </div>
        <div className="w-24 flex-shrink-0 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {paper.cloud_url && (
            <a 
              href={paper.cloud_url} 
              target="_blank" 
              rel="noreferrer"
              className="p-2 hover:bg-muted rounded-md text-blue-400 transition-colors"
              title="View PDF"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button 
            className="p-2 hover:bg-red-500/10 rounded-md text-red-400 transition-colors"
            title="Delete Paper"
            onClick={() => console.log("Delete not implemented in MVP")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <h1 className="text-3xl font-bold">Paper Library</h1>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search papers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center px-6 py-4 bg-muted/50 text-muted-foreground font-medium text-sm flex-shrink-0 border-b border-border/50">
          <div className="flex-1">Title</div>
          <div className="w-48 flex-shrink-0">Authors</div>
          <div className="w-24 flex-shrink-0">Year</div>
          <div className="w-24 flex-shrink-0 text-right">Actions</div>
        </div>

        {/* Virtualized List */}
        <div className="flex-1 relative">
          {isLoading && filteredPapers.length === 0 ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center px-2 py-3">
                  <div className="flex-1"><div className="h-4 w-3/4 bg-muted shimmer rounded" /></div>
                  <div className="w-48"><div className="h-4 w-1/2 bg-muted shimmer rounded" /></div>
                  <div className="w-24"><div className="h-4 w-8 bg-muted shimmer rounded" /></div>
                  <div className="w-24"><div className="h-4 w-16 bg-muted shimmer rounded ml-auto" /></div>
                </div>
              ))}
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p>No papers found in your library.</p>
            </div>
          ) : (
            <AutoSizer>
              {({ height, width }: { height: number, width: number }) => (
                <List
                  height={height}
                  itemCount={filteredPapers.length}
                  itemSize={60} // Row height
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          )}
        </div>
      </div>
    </div>
  );
}
