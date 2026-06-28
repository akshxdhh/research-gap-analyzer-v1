"use client";

import { useEffect, useState } from "react";
import { Server, Database, Cloud, Zap, CheckCircle2, XCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.getStatus();
        setStatus(res);
      } catch (err) {
        setStatus({ status: "error", services: { error: "Failed to connect to backend" } });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const getServiceIcon = (key: string) => {
    if (key.includes("database")) return Database;
    if (key.includes("redis")) return Zap;
    if (key.includes("vector")) return Server;
    if (key.includes("storage")) return Cloud;
    if (key.includes("llm")) return Brain;
    return Server;
  };

  // Re-declare Brain icon here just for the helper
  const Brain = Server; // Fallback if lucide-react Brain isn't imported, but we can import it above
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Status</h1>
        <p className="text-muted-foreground">Monitor the health and connectivity of all infrastructure services.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-primary/20">
        <div>
          <h2 className="text-xl font-semibold">Backend API</h2>
          <p className="text-sm text-muted-foreground">{process.env.NEXT_PUBLIC_API_URL}</p>
        </div>
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium ${
          isLoading ? "bg-muted text-muted-foreground" :
          status?.status === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
          "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {isLoading ? "Checking..." : status?.status === "ok" ? "Healthy" : "Degraded"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-24 shimmer rounded-xl" />
          ))
        ) : (
          Object.entries(status?.services || {}).map(([key, val]: [string, any], i) => {
            const Icon = getServiceIcon(key);
            const isOk = val.includes("connected") || val.includes("configured") || val.includes("local");
            
            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isOk ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-500"}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold capitalize text-foreground">{key.replace("_", " ")}</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] truncate" title={val}>{val}</p>
                  </div>
                </div>
                {isOk ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
}
