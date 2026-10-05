"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {

    console.error("System Crash Intercepted:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-slate-50 rounded-xl border border-red-100">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
      
        <span className="text-2xl font-bold">!</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">System Module Crashed</h2>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
         Fatal error in database network request.
      </p>
      <button
        onClick={

          () => {reset()}
        }
        className="px-4 py-2 bg-slate-900 cursor-pointer text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
      >
        Try Again (Reset Module)
      </button>
    </div>
  );
}