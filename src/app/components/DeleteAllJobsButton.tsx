"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteAll } from "../actions/Job";

const DeleteAllJobsButton = () => {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const executeDelete = () => {
    startTransition(async () => {
      const response = await deleteAll();

      if (!response.success) {
        toast.error(`Error: ${response.error}`);
      } else {
        toast.success("System wiped! All jobs permanently deleted.");
        setIsModalOpen(false); 
        router.refresh(); 
      }
    });
  };

  const closeModal = () => {
    if (isPending) return;
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isPending}
        className="text-xs font-bold cursor-pointer w-32 py-2 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-sm"
      >
        {isPending ? "Erasing..." : "Delete All"}
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
             
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">System Alert</h3>
            </div>
            
            <p className="text-sm text-slate-600 mt-4 leading-relaxed pl-13">
              Are you absolute sure you want to permanently delete <strong>ALL jobs</strong>? This destructive action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={executeDelete}
                disabled={isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px] shadow-sm"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Yes, Wipe Data"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAllJobsButton;