"use client";

import { useEffect } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Layers, FileText, CheckCircle2, Activity } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { projects, papers, gaps, isLoading, error, refreshProjects, refreshPapers, refreshGaps, startPolling, stopPolling } = useAnalysisStore();

  useEffect(() => {
    refreshProjects();
    refreshPapers();
    refreshGaps();
    startPolling();
    return () => stopPolling();
  }, [refreshProjects, refreshPapers, refreshGaps, startPolling, stopPolling]);

  const stats = [
    { label: "Active Projects", value: projects.length, icon: Layers, color: "text-blue-400" },
    { label: "Analyzed Papers", value: papers.length, icon: FileText, color: "text-purple-400" },
    { label: "Identified Gaps", value: gaps.length, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "System Status", value: error ? "Degraded" : "Online", icon: Activity, color: error ? "text-red-400" : "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card h-32 shimmer rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-3xl font-bold">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Recent Papers</h2>
          {papers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No papers analyzed yet. <br/>
              <Link href="/upload" className="text-primary hover:underline mt-2 inline-block">Upload a paper</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {papers.slice(0, 5).map(p => (
                <li key={p.id} className="p-3 bg-card/50 rounded-lg border border-border flex justify-between items-center">
                  <span className="truncate flex-1">{p.title}</span>
                  <span className="text-xs text-muted-foreground ml-4">{p.year || 'Unknown'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Recent Gaps</h2>
          {gaps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No gaps identified yet. <br/>
              <Link href="/analysis" className="text-primary hover:underline mt-2 inline-block">Run an analysis</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {gaps.slice(0, 5).map(g => (
                <li key={g.id} className="p-3 bg-card/50 rounded-lg border border-border">
                  <p className="line-clamp-2 text-sm">{g.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
