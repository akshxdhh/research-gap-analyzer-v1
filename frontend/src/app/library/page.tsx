"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAnalysisStore";
import { api } from "@/lib/api";
import { Search, Filter, MoreHorizontal, FileText, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LibraryPage() {
  const { papers, setPapers } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      if (papers.length === 0) {
        try {
          const res = await api.getPapers();
          setPapers(res);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
    load();
  }, [papers, setPapers]);

  const filteredPapers = papers.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.authors.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Paper Library</h1>
          <p className="text-muted-foreground">Manage and explore your indexed research knowledge base.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search papers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted/50 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-border">Title</th>
                <th className="px-6 py-4 font-medium border-b border-border">Authors</th>
                <th className="px-6 py-4 font-medium border-b border-border">Year</th>
                <th className="px-6 py-4 font-medium border-b border-border">Indexed On</th>
                <th className="px-6 py-4 font-medium border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading library...
                  </td>
                </tr>
              ) : filteredPapers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    No papers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPapers.map((paper, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={paper.id} 
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-foreground max-w-md truncate">
                      {paper.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{paper.authors}</td>
                    <td className="px-6 py-4 text-muted-foreground">{paper.year}</td>
                    <td className="px-6 py-4 text-muted-foreground">{paper.upload_date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-muted transition-colors" title="View Source">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors" title="Delete">
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
        
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <div>Showing {filteredPapers.length} of {papers.length} papers</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
