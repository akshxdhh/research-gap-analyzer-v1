"use client";

import { useState, useRef } from "react";
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAnalysisStore } from "@/store/useAnalysisStore";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const refreshPapers = useAnalysisStore(state => state.refreshPapers);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        setStatus("error");
        setErrorMessage("Only PDF files are supported");
        return;
      }
      setFile(selected);
      setStatus("idle");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type !== "application/pdf") {
        setStatus("error");
        setErrorMessage("Only PDF files are supported");
        return;
      }
      setFile(selected);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setStatus("idle");
    setProgress(0);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress since axios onUploadProgress might not work perfectly with local fast APIs
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      await api.uploadFile(file);
      
      clearInterval(interval);
      setProgress(100);
      setStatus("success");
      refreshPapers();
      
      setTimeout(() => {
        setFile(null);
        setStatus("idle");
        setProgress(0);
      }, 3000);
      
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.response?.data?.detail || err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Papers</h1>
        <p className="text-muted-foreground">Upload research papers in PDF format for analysis.</p>
      </div>

      <div 
        className={`glass-panel border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          status === "error" ? "border-red-500/50 bg-red-500/5" : 
          status === "success" ? "border-emerald-500/50 bg-emerald-500/5" : 
          "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="application/pdf"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">Click or drag PDF to upload</p>
                <p className="text-sm text-muted-foreground mt-1">Maximum file size: 25MB</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              {status === "success" ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </motion.div>
              ) : status === "error" ? (
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <File className="w-8 h-8 text-blue-500" />
                </div>
              )}
              
              <div className="text-center">
                <p className="text-lg font-medium truncate max-w-xs mx-auto">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              
              {status === "error" && (
                <p className="text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-md">{errorMessage}</p>
              )}
              
              {status === "success" && (
                <p className="text-sm text-emerald-400">File uploaded and processed successfully!</p>
              )}
              
              {isUploading && (
                <div className="w-full max-w-md mx-auto space-y-2">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Processing semantic chunks and vectorizing...
                  </p>
                </div>
              )}

              {status !== "success" && !isUploading && (
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => { setFile(null); setStatus("idle"); }}
                    className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    Upload & Analyze
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
