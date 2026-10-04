"use client";

import { updateJobStatus, deleteJob } from "../actions/Job";
import { useTransition, useState } from "react";
import { toast } from "sonner"; 

interface JobActionProps {
  jobId: string;
  currentStatus: string;
}

const JobActionButtons = ({ jobId, currentStatus }: JobActionProps) => {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const executeDelete = () => {
    startTransition(async () => {
      const result = await deleteJob(jobId);
      
      if (!result.success) {
        toast.error(`Action Failed: ${result.error}`);
        setIsModalOpen(false); 
      } else {
        toast.success("Job permanently deleted.");
        setIsModalOpen(false); 
      }
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      const result = await updateJobStatus(jobId, newStatus);
      if (!result.success) {
        toast.error(`Update Failed: ${result.error}`);
      } else {
        toast.success("Status Updated!");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 mt-4 md:mt-0">
        <select
          onChange={handleStatusChange}
          defaultValue={currentStatus}
          disabled={isPending}
          className="text-xs font-bold px-2 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="PENDING">PENDING</option>
          <option value="INTERVIEW">INTERVIEW</option>
          <option value="REJECTED">REJECTED</option>
          <option value="HIRED">HIRED</option>
        </select>

        {/* Yeh button ab strictly modal open karega, direct delete nahi karega */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isPending}
          className="text-xs font-bold cursor-pointer w-20 py-1.5 rounded-md bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 hover:bg-red-100 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isPending ? "..." : "Delete"}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900">System Alert</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to permanently delete this job? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobActionButtons;