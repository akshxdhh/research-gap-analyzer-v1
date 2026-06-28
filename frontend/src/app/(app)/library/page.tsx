"use client";

import { useEffect, useState } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Search, FileText, Trash2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function LibraryPage() {
  const { papers, isLoading, refreshPapers } = useAnalysisStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    refreshPapers();
  }, [refreshPapers]);

  const filteredPapers = papers.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.authors && p.authors.join(", ").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Authors</th>
                <th className="px-6 py-4 font-medium">Year</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 w-3/4 bg-muted shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-1/2 bg-muted shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-8 bg-muted shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-muted shimmer rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredPapers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No papers found in your library.</p>
                  </td>
                </tr>
              ) : (
                filteredPapers.map((paper, i) => (
                  <motion.tr 
                    key={paper.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-card-hover transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium max-w-md truncate" title={paper.title}>
                      {paper.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]" title={paper.authors?.join(", ")}>
                      {paper.authors?.join(", ") || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {paper.year || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
