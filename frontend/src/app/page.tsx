"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAnalysisStore";
import { api } from "@/lib/api";
import { Activity, BookOpen, Layers, Lightbulb, FolderKanban } from "lucide-react";
import Link from "next/link";

function MetricCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/5 rounded-md">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { projects, setProjects, papers, setPapers, gaps, setGaps } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projRes, papersRes, gapsRes] = await Promise.all([
          api.getProjects(),
          api.getPapers(),
          api.getGaps(),
        ]);
        setProjects(projRes);
        setPapers(papersRes);
        setGaps(gapsRes);
      } catch (error) {
        console.error("Dashboard failed to load:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [setProjects, setPapers, setGaps]);

  return (
    <div className="p-8 h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome back. Here is your research intelligence summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Active Projects" value={loading ? "-" : projects.length} subtitle="+1 this week" icon={FolderKanban} />
        <MetricCard title="Indexed Papers" value={loading ? "-" : papers.length} subtitle="+12 this month" icon={BookOpen} />
        <MetricCard title="Inferred Gaps" value={loading ? "-" : gaps.length} subtitle="Novel opportunities" icon={Lightbulb} />
        <MetricCard title="Analyses Run" value={loading ? "-" : "24"} subtitle="Total processing runs" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-muted-foreground" />
            Recent Projects
          </h3>
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <FolderKanban className="w-8 h-8 opacity-20" />
                <p>No active projects</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(p => (
                  <Link key={p.id} href={`/projects`} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">Created {p.created_at}</div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">{p.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            Recent Papers
          </h3>
          <div className="flex-1">
            {loading ? (
               <div className="space-y-4">
               {[1, 2].map(i => (
                 <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
               ))}
             </div>
            ) : papers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <BookOpen className="w-8 h-8 opacity-20" />
                <p>No papers indexed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map(p => (
                  <Link key={p.id} href={`/library`} className="flex items-center p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mr-4">
                      <FileTextIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-sm line-clamp-1">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.authors} ({p.year})</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
