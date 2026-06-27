"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="h-full w-full flex items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full bg-card border border-destructive/20 rounded-2xl p-8 shadow-sm text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-3">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground mb-8">
          An unexpected error occurred while rendering this interface. Our intelligence engine has logged the issue.
        </p>
        <button
          onClick={() => reset()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Recover and Try Again
        </button>
      </div>
    </div>
  );
}
