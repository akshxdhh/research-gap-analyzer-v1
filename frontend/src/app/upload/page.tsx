"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle, FileText, Loader2, X, FileUp } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setResult(null);
      setProgress(0);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await api.uploadFile(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setProgress(percentCompleted);
      });
      setResult(res);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file. Please check backend connection.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground">Upload research papers (PDF) to build your intelligent knowledge base.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center text-center
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30'}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".pdf"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <FileUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Drag and drop your PDF here</h3>
            <p className="text-sm text-muted-foreground mb-6">or click to browse your files</p>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
              Select File
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!uploading && (
                  <button onClick={() => setFile(null)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {uploading && (
                  <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing... {progress}%
                </>
              ) : (
                "Upload and Process"
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Upload History
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {result && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-muted/50 rounded-lg border border-border text-sm"
                  >
                    <p className="font-medium text-emerald-500 mb-1">Upload Successful</p>
                    <p className="text-muted-foreground text-xs">{result.message}</p>
                    <div className="mt-2 text-xs font-mono bg-background p-1.5 rounded text-muted-foreground overflow-hidden text-ellipsis">
                      ID: {result.file_id}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!result && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No recent uploads in this session.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
