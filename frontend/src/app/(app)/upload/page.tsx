"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { UploadCloud, File as FileIcon, CheckCircle, AlertCircle, Loader2, PlayCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAnalysisStore } from "@/store/useAnalysisStore";

export default function UploadPage() {
  const [localQueue, setLocalQueue] = useState<{file: File, id: string, progress: number, status: string}[]>([]);
  const { papers, refreshPapers, startSSE, stopSSE } = useAnalysisStore();

  useEffect(() => {
    refreshPapers();
    startSSE();
    return () => {
      // Don't necessarily stop SSE on unmount if we want dashboard stats to update globally,
      // but for this component it's good to ensure it's running.
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let pdfsToUpload: File[] = [];

    for (const file of acceptedFiles) {
      if (file.type === "application/pdf") {
        pdfsToUpload.push(file);
      } else if (file.type === "application/zip" || file.name.endsWith(".zip")) {
        try {
          const zip = await JSZip.loadAsync(file);
          const entries = Object.values(zip.files);
          for (const entry of entries) {
            if (!entry.dir && entry.name.toLowerCase().endsWith(".pdf")) {
              const blob = await entry.async("blob");
              const extractedFile = new File([blob], entry.name, { type: "application/pdf" });
              pdfsToUpload.push(extractedFile);
            }
          }
        } catch (error) {
          console.error("Failed to extract ZIP", error);
        }
      }
    }

    if (pdfsToUpload.length === 0) return;

    // Add to local queue
    const newItems = pdfsToUpload.map(f => ({
      file: f,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'pending'
    }));
    
    setLocalQueue(prev => [...prev, ...newItems]);

    // Process uploads concurrently (limit 4)
    const concurrencyLimit = 4;
    let active = 0;
    let index = 0;

    const processQueue = async () => {
      if (index >= newItems.length) return;
      if (active >= concurrencyLimit) return;

      const item = newItems[index++];
      active++;

      setLocalQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i));

      try {
        await api.uploadFile(item.file, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setLocalQueue(prev => prev.map(i => i.id === item.id ? { ...i, progress: percentCompleted } : i));
        });
        
        setLocalQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success' } : i));
        refreshPapers(); // Refresh to get the new DB entry, SSE will track its progress
      } catch (err) {
        setLocalQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
      } finally {
        active--;
        processQueue();
      }
    };

    // Start workers
    for (let i = 0; i < concurrencyLimit; i++) {
      processQueue();
    }
  }, [refreshPapers]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip']
    }
  });

  // Filter backend papers that are currently processing
  const processingPapers = papers.filter(p => p.processing_status && p.processing_status !== 'ready' && p.processing_status !== 'error');
  const errorPapers = papers.filter(p => p.processing_status === 'error');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mass Upload</h1>
        <p className="text-muted-foreground">Drag and drop multiple PDFs, folders, or ZIP archives.</p>
      </div>

      <div 
        {...getRootProps()}
        className={`glass-panel border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium">Click or drag files here</p>
            <p className="text-sm text-muted-foreground mt-1">Supports PDF and ZIP (Max 100MB per file)</p>
          </div>
        </div>
      </div>

      {/* Local Upload Queue */}
      {localQueue.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upload Queue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localQueue.map((item) => (
              <div key={item.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                {item.status === 'success' ? <CheckCircle className="text-emerald-500 flex-shrink-0" /> :
                 item.status === 'error' ? <AlertCircle className="text-red-500 flex-shrink-0" /> :
                 item.status === 'uploading' ? <Loader2 className="animate-spin text-primary flex-shrink-0" /> :
                 <PlayCircle className="text-muted-foreground flex-shrink-0" />}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${item.status === 'error' ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Background Processing Queue (SSE) */}
      {(processingPapers.length > 0 || errorPapers.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Background Processing</h2>
          <div className="space-y-3">
            {[...processingPapers, ...errorPapers].map(paper => (
              <div key={paper.id} className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium truncate flex-1 pr-4">{paper.title}</p>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {paper.processing_status}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full absolute left-0 top-0 transition-all duration-500 ease-out ${
                        paper.processing_status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${paper.processing_progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-12 text-right">
                    {Math.round(paper.processing_progress || 0)}%
                  </span>
                </div>

                {paper.processing_status === 'error' && (
                  <div className="mt-3 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded flex items-center justify-between">
                    <span>{paper.error_message || "Unknown error"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
