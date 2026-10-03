"use client";

import { deleteJob, UpdateJObStatus } from "../actions/Job";
import { useTransition } from "react";

interface JobActionProps {
  jobId: string;
  currentStatus: string;
}

const JobActionButtons = ({ jobId, currentStatus }: JobActionProps) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteJob(jobId);
    });
  };

  return (
    <div className="flex items-center gap-3 mt-4 md:mt-0">
      {/* Dropdown: Event (e) se nikal kar value pass karni hoti hai */}
      <select
        onChange={(e) =>
          UpdateJObStatus(
            jobId,
            e.target.value as "PENDING" | "INTERVIEW" | "REJECTED" | "HIRED",
          )
        }
        defaultValue={currentStatus}
        className="text-xs font-bold px-2 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="PENDING">PENDING</option>
        <option value="INTERVIEW">INTERVIEW</option>
        <option value="REJECTED">REJECTED</option>
        <option value="HIRED">HIRED</option>
      </select>

      <button
        onClick={handleDelete}
        disabled={isPending} // Job delete hote waqt button explicitly lock ho jayega
        className="text-xs font-bold cursor-pointer w-20 py-1.5 rounded-md bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 hover:bg-red-100 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {isPending ? "..." : "Delete"}
      </button>
    </div>
  );
};

export default JobActionButtons;
