"use client";

import { useState } from "react";
import { Search, Loader2, BookOpen, AlertCircle, TrendingUp, Filter } from "lucide-react";
import { api, AnalysisOutput } from "@/lib/api";
import { useAnalysisStore } from "@/store/useAnalysisStore";

export default function AnalysisDashboard() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  const result = useAnalysisStore((state) => state.analysis);
  const setResult = useAnalysisStore((state) => state.setAnalysis);
  const clearAnalysis = useAnalysisStore((state) => state.clearAnalysis);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    clearAnalysis();
    try {
      const output = await api.analyze({ query });
      setResult(output);
    } catch (err) {
      console.error(err);
      alert("Failed to run analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Research Analysis Dashboard</h1>
        <p className="text-slate-500 mt-2">
          Enter a domain or specific question to orchestrate Web Search, Paper Search, and Local RAG analysis.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-12">
        <div className="relative flex items-center">
          <Search className="w-6 h-6 text-slate-400 absolute left-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What are the limitations of RAG compared to long-context LLMs?"
            className="w-full bg-white border border-slate-300 rounded-full py-4 pl-14 pr-32 shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
          <p className="text-lg">Orchestrating AI Planner & Retrieving Context...</p>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Extracted Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Detected Methodologies
              </h3>
              <ul className="space-y-2">
                {result.extracted_info.methodologies.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Recurring Limitations
              </h3>
              <ul className="space-y-2">
                {result.recurring_limitations.map((l, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Inferred Gaps */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              Inferred Research Gaps
            </h3>
            <div className="space-y-4">
              {result.inferred_gaps.map((gap, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900">{gap.description}</h4>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                      {(gap.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <strong>Evidence:</strong> {gap.evidence_citations.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparisons */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
              <Filter className="w-6 h-6 text-purple-500" />
              Paper Comparisons & Contradictions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold text-slate-900">Paper A</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Paper B</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Contradictions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparisons.map((comp, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">{comp.paper_a_citation}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">{comp.paper_b_citation}</td>
                      <td className="py-3 px-4 text-sm text-rose-600">
                        {comp.contradictions.length > 0 ? comp.contradictions.join(", ") : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
