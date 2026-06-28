"use client";

import { useEffect, useState } from "react";
import { Server, Database, Cloud, Zap, CheckCircle2, XCircle, Brain, User, Settings as SettingsIcon, Bell, Palette, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { toast } from "sonner";

export default function SettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState("user");

  const fetchSettings = async () => {
    try {
      setIsSettingsLoading(true);
      const settingsRes = await api.getSettings();
      setSettings(settingsRes);
    } catch (err) {
      toast.error("Failed to load settings configuration.");
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      setIsStatusLoading(true);
      const statusRes = await api.getStatus();
      setStatus(statusRes);
    } catch (err) {
      toast.error("Could not fetch cloud status.");
      setStatus({ status: "error", services: { error: "Failed to connect to backend" } });
    } finally {
      setIsStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStatus();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateSettings(settings);
      setSettings(res);
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsRefreshingStatus(true);
    const toastId = toast.loading("Testing cloud connections...");
    try {
      const statusRes = await api.refreshStatus();
      setStatus(statusRes);
      if (statusRes.status === "ok") {
        toast.success("All systems connected!", { id: toastId });
      } else {
        toast.warning("Some systems are degraded.", { id: toastId });
      }
    } catch (err) {
      toast.error("Cloud provider temporarily unavailable.", { id: toastId });
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const getServiceIcon = (key: string) => {
    if (key.includes("database")) return Database;
    if (key.includes("redis")) return Zap;
    if (key.includes("vector")) return Server;
    if (key.includes("storage")) return Cloud;
    if (key.includes("llm")) return Brain;
    return Server;
  };

  const getServiceBadge = (val: string) => {
    if (val.includes("connected") || val.includes("configured") || val.includes("local")) {
      return { label: "Connected", bg: "bg-emerald-500/10", text: "text-emerald-500" };
    }
    if (val.includes("timeout") || val.includes("slow")) {
      return { label: "Slow", bg: "bg-yellow-500/10", text: "text-yellow-500" };
    }
    if (val.includes("degraded")) {
      return { label: "Degraded", bg: "bg-orange-500/10", text: "text-orange-500" };
    }
    if (val.includes("error") || val.includes("offline")) {
      return { label: "Offline", bg: "bg-red-500/10", text: "text-red-500" };
    }
    return { label: "Unknown", bg: "bg-gray-500/10", text: "text-gray-400" };
  };

  const tabs = [
    { id: "user", label: "User Profile", icon: User },
    { id: "app", label: "Application", icon: Palette },
    { id: "ai", label: "AI Configuration", icon: Brain },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "cloud", label: "Cloud Status", icon: Cloud },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account, application preferences, and cloud infrastructure.</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleSave} 
            disabled={isSaving || isSettingsLoading}
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Sidebar */}
        <div className="glass-panel p-2 rounded-2xl flex flex-col gap-1 sticky top-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 glass-panel p-6 rounded-2xl min-h-[500px]">
          {isSettingsLoading && activeTab !== "cloud" ? (
            <div className="space-y-6">
              <div className="glass-card h-8 w-48 shimmer rounded-xl mb-8" />
              <div className="glass-card h-16 w-full shimmer rounded-xl" />
              <div className="glass-card h-16 w-full shimmer rounded-xl" />
              <div className="glass-card h-16 w-full shimmer rounded-xl" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "user" && (
                <motion.div key="user" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <h2 className="text-xl font-semibold mb-6">User Profile</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Full Name</label>
                      <input type="text" value={settings?.user_name || ""} onChange={e => handleChange("user_name", e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2 outline-none focus:border-primary/50" placeholder="Dr. Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Email Address</label>
                      <input type="email" value={settings?.user_email || ""} onChange={e => handleChange("user_email", e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2 outline-none focus:border-primary/50" placeholder="jane@example.com" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm text-muted-foreground">Organization</label>
                      <input type="text" value={settings?.user_organization || ""} onChange={e => handleChange("user_organization", e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2 outline-none focus:border-primary/50" placeholder="Stanford University" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "app" && (
                <motion.div key="app" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Application Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                      <div>
                        <p className="font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">Select your interface color scheme.</p>
                      </div>
                      <select value={settings?.app_theme} onChange={e => handleChange("app_theme", e.target.value)} className="bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-primary/50">
                        <option value="system">System</option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                      <div>
                        <p className="font-medium">Default Report Format</p>
                        <p className="text-sm text-muted-foreground">Preferred export format for analysis.</p>
                      </div>
                      <select value={settings?.app_default_report_format} onChange={e => handleChange("app_default_report_format", e.target.value)} className="bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-primary/50">
                        <option value="pdf">PDF Document</option>
                        <option value="markdown">Markdown</option>
                        <option value="docx">Word (.docx)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                      <div>
                        <p className="font-medium">Default Citation Style</p>
                      </div>
                      <select value={settings?.app_default_citation_style} onChange={e => handleChange("app_default_citation_style", e.target.value)} className="bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-primary/50">
                        <option value="apa">APA</option>
                        <option value="mla">MLA</option>
                        <option value="ieee">IEEE</option>
                        <option value="chicago">Chicago</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                      <div>
                        <p className="font-medium">Retrieval Depth</p>
                        <p className="text-sm text-muted-foreground">Number of papers to retrieve per search.</p>
                      </div>
                      <input type="number" min="1" max="50" value={settings?.app_retrieval_depth} onChange={e => handleChange("app_retrieval_depth", parseInt(e.target.value))} className="bg-background border border-border rounded-lg px-4 py-2 w-24 text-center outline-none focus:border-primary/50" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "ai" && (
                <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <h2 className="text-xl font-semibold mb-6">AI Configuration</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                      <div>
                        <p className="font-medium">Preferred LLM</p>
                        <p className="text-sm text-muted-foreground">The model used for research gap inference.</p>
                      </div>
                      <select value={settings?.ai_preferred_model} onChange={e => handleChange("ai_preferred_model", e.target.value)} className="bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-primary/50 min-w-[200px]">
                        <option value="llama3-70b-8192">Llama 3 70B (Groq)</option>
                        <option value="llama3-8b-8192">Llama 3 8B (Groq)</option>
                        <option value="mixtral-8x7b-32768">Mixtral 8x7B (Groq)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-background/50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Temperature: {settings?.ai_temperature}</p>
                        <p className="text-sm text-muted-foreground">Higher values make output more creative.</p>
                      </div>
                      <input type="range" min="0" max="1" step="0.1" value={settings?.ai_temperature || 0.7} onChange={e => handleChange("ai_temperature", parseFloat(e.target.value))} className="w-full accent-primary cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                      <div>
                        <p className="font-medium">Max Tokens</p>
                      </div>
                      <input type="number" min="1000" max="8000" step="500" value={settings?.ai_max_tokens} onChange={e => handleChange("ai_max_tokens", parseInt(e.target.value))} className="bg-background border border-border rounded-lg px-4 py-2 w-32 text-center outline-none focus:border-primary/50" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Notifications</h2>
                  <div className="space-y-4">
                    {[
                      { id: "notif_upload_completed", label: "Upload Completed", desc: "Notify when a document finishes chunking and indexing." },
                      { id: "notif_analysis_completed", label: "Analysis Completed", desc: "Notify when gap inference concludes." },
                      { id: "notif_report_generated", label: "Report Generated", desc: "Notify when a PDF/Markdown report is ready." },
                    ].map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={settings?.[item.id] === 1} onChange={e => handleChange(item.id, e.target.checked ? 1 : 0)} />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "cloud" && (
                <motion.div key="cloud" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Cloud Infrastructure Status</h2>
                    <button 
                      onClick={handleTestConnection}
                      disabled={isRefreshingStatus}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:bg-card transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? "animate-spin" : ""}`} />
                      {isRefreshingStatus ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                  
                  {isStatusLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-[74px] rounded-xl shimmer glass-card" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(status?.services || {}).map(([key, val]: [string, any]) => {
                        const Icon = getServiceIcon(key);
                        const badge = getServiceBadge(val);
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={key} 
                            className="p-4 rounded-xl border border-border/50 bg-background/50 flex items-center justify-between hover:border-primary/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${badge.bg} ${badge.text}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium capitalize text-sm">{key.replace("_", " ")}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
