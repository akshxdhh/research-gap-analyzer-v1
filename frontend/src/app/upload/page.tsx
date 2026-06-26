"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Research Paper</h1>
        <p className="text-slate-500 mt-2">
          Upload PDF papers to your local library. They will be automatically chunked, embedded, and added to your Vector DB for retrieval.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <UploadCloud className="w-8 h-8" />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block">
            <span className="sr-only">Choose profile photo</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 cursor-pointer"
            />
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing and Embedding...
            </>
          ) : (
            "Upload to Local RAG"
          )}
        </button>

        {result && (
          <div className="mt-6 bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-start gap-3 text-left border border-emerald-200">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">{result.message}</p>
              <p className="text-sm mt-1">File ID: <span className="font-mono bg-emerald-100 px-1 rounded">{result.file_id}</span></p>
              <p className="text-sm">Chunks Extracted: <span className="font-medium">{result.chunk_count}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
