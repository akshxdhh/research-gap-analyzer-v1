"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { 
  UploadCloud, 
  File as FileIcon, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  PlayCircle, 
  XCircle, 
  RotateCcw, 
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAnalysisStore } from "@/store/useAnalysisStore";

type QueueItem = {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error' | 'cancelled';
  errorDetail?: string;
  backendId?: string;
};

export default function UploadPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const { papers, refreshPapers, startSSE } = useAnalysisStore();

  useEffect(() => {
    refreshPapers();
    startSSE();
  }, [refreshPapers, startSSE]);

  // Sync backend papers with our queue items
  useEffect(() => {
    setQueue(prevQueue => {
      let changed = false;
      const newQueue = prevQueue.map(item => {
        if (!item.backendId) return item;
        const paper = papers.find(p => p.id === item.backendId);
        if (paper) {
          let newStatus = item.status;
          let newProgress = item.progress;
          let newError = item.errorDetail;

          if (paper.processing_status === 'error') {
            newStatus = 'error';
            newError = paper.error_message || "Processing failed";
          } else if (paper.processing_status === 'cancelled') {
            newStatus = 'cancelled';
            newError = paper.error_message || "Cancelled";
          } else if (paper.processing_status === 'ready') {
            newStatus = 'success';
            newProgress = 100;
          } else {
            // It's processing
            if (item.status !== 'error' && item.status !== 'cancelled') {
              newStatus = 'processing';
              newProgress = paper.processing_progress;
            }
          }

          if (item.status !== newStatus || item.progress !== newProgress || item.errorDetail !== newError) {
            changed = true;
            return { ...item, status: newStatus, progress: newProgress, errorDetail: newError };
          }
        }
        return item;
      });
      return changed ? newQueue : prevQueue;
    });
  }, [papers]);

  const processQueue = useCallback(async (itemsToProcess: QueueItem[]) => {
    const concurrencyLimit = 3;
    let active = 0;
    let index = 0;

    const worker = async () => {
      while (index < itemsToProcess.length) {
        if (active >= concurrencyLimit) {
          await new Promise(r => setTimeout(r, 100));
          continue;
        }

        const item = itemsToProcess[index++];
        
        // Find latest state of item from React state to check if it was cancelled
        let isCancelled = false;
        setQueue(prev => {
          const currentItem = prev.find(i => i.id === item.id);
          if (currentItem?.status === 'cancelled') isCancelled = true;
          return prev;
        });

        if (isCancelled) continue;

        active++;

        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i));

        try {
          const res = await api.uploadFile(item.file, (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
            setQueue(prev => prev.map(i => {
              if (i.id === item.id && i.status !== 'cancelled' && i.status !== 'error') {
                return { ...i, progress: percentCompleted };
              }
              return i;
            }));
          });
          
          setQueue(prev => prev.map(i => {
            if (i.id === item.id && i.status !== 'cancelled') {
              return { ...i, status: 'processing', backendId: res.file_id };
            }
            return i;
          }));
          
          refreshPapers(); // Ensure new paper is in store
        } catch (err: any) {
          const msg = err.response?.data?.detail || err.message || "Upload failed";
          setQueue(prev => prev.map(i => {
            if (i.id === item.id && i.status !== 'cancelled') {
              return { ...i, status: 'error', errorDetail: msg };
            }
            return i;
          }));
        } finally {
          active--;
        }
      }
    };

    for (let i = 0; i < concurrencyLimit; i++) {
      worker();
    }
  }, [refreshPapers]);

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

    const newItems: QueueItem[] = pdfsToUpload.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      progress: 0,
      status: 'pending'
    }));
    
    setQueue(prev => [...newItems, ...prev]);
    processQueue(newItems);
  }, [processQueue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip']
    }
  });

  const handleCancel = async (id: string, backendId?: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'cancelled' } : i));
    if (backendId) {
      try {
        await api.cancelUpload(backendId);
        refreshPapers();
      } catch (err) {
        console.error("Failed to cancel on backend", err);
      }
    }
  };

  const handleRetry = async (id: string, backendId?: string) => {
    const item = queue.find(i => i.id === id);
    if (!item) return;

    if (backendId) {
      try {
        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'processing', errorDetail: undefined } : i));
        await api.retryUpload(backendId);
        refreshPapers();
      } catch (err) {
        console.error("Failed to retry on backend", err);
        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'error', errorDetail: "Failed to retry" } : i));
      }
    } else {
      // It failed during upload, just put it back in queue
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'pending', progress: 0, errorDetail: undefined } : i));
      processQueue([{ ...item, status: 'pending', progress: 0 }]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mass Upload & Ingestion</h1>
        <p className="text-muted-foreground">Drag and drop hundreds of PDFs or ZIP archives. The system handles duplicate detection and automated extraction.</p>
      </div>

      <div 
        {...getRootProps()}
        className={`glass-panel border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer shadow-sm ${
          isDragActive ? "border-primary bg-primary/10 shadow-primary/20 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-card-hover"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${isDragActive ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>
            <UploadCloud className="w-10 h-10" />
          </div>
          <div>
            <p className="text-2xl font-bold">Drag & Drop Papers Here</p>
            <p className="text-muted-foreground mt-2 text-lg">Supports bulk PDF selection, folder drag, and ZIP archives</p>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Upload Queue ({queue.length})
            </h2>
            <div className="text-sm text-muted-foreground">
              {queue.filter(q => q.status === 'success').length} Complete · {queue.filter(q => q.status === 'error').length} Failed
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {queue.map((item) => {
                const paper = item.backendId ? papers.find(p => p.id === item.backendId) : null;
                const statusText = paper?.processing_status || item.status;
                const progressVal = item.status === 'processing' ? (paper?.processing_progress || 0) : item.progress;
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card rounded-xl p-4 flex items-center gap-4 relative overflow-hidden"
                  >
                    {/* Background Progress Bar for processing */}
                    {item.status === 'processing' && (
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary/5 -z-10 transition-all duration-500 ease-out"
                        style={{ width: `${progressVal}%` }}
                      />
                    )}

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {item.status === 'success' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> :
                       item.status === 'error' ? <AlertCircle className="w-6 h-6 text-red-500" /> :
                       item.status === 'cancelled' ? <XCircle className="w-6 h-6 text-muted-foreground" /> :
                       item.status === 'uploading' ? <UploadCloud className="w-6 h-6 text-primary animate-pulse" /> :
                       item.status === 'processing' ? <Loader2 className="w-6 h-6 text-accent animate-spin" /> :
                       <PlayCircle className="w-6 h-6 text-muted-foreground opacity-50" />}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold truncate pr-4 text-foreground">{item.file.name}</p>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          item.status === 'success' ? 'text-emerald-500' :
                          item.status === 'error' ? 'text-red-500' :
                          item.status === 'cancelled' ? 'text-muted-foreground' :
                          'text-primary'
                        }`}>
                          {item.status === 'processing' && paper?.processing_status ? paper.processing_status : item.status}
                        </span>
                      </div>
                      
                      {/* Upload Progress Bar */}
                      {item.status === 'uploading' && (
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {item.status === 'error' && (
                         <p className="text-xs text-red-400 mt-1 bg-red-500/10 inline-block px-2 py-1 rounded">
                           {item.errorDetail || "Unknown error"}
                         </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(item.status === 'pending' || item.status === 'uploading' || item.status === 'processing') && (
                        <button 
                          onClick={() => handleCancel(item.id, item.backendId)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      {(item.status === 'error' || item.status === 'cancelled') && (
                        <button 
                          onClick={() => handleRetry(item.id, item.backendId)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
                          title="Retry"
                        >
                          <RotateCcw className="w-4 h-4" /> Retry
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
