"use client";

import { useState, useTransition } from "react";
import { analyzeJobDescription } from "../actions/ai-actions";
import { saveJobToDatabase } from "../actions/Job";
import { toast } from "sonner";
// import { jobAnalysisSchema } from "../lib/validations";
import { jobAnalysisSchema, type JobAnalysisResult } from "../lib/validations";

// interface JobAnalysisResult {
//   role: string;
//   company: string;
//   skills: string[];
//   experienceLevel: "ENTRY" | "MID" | "SENIOR";
//   location: string;
//   salaryRange: string;
//   jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
//   summary: string;
// }

export default function AiTester() {
  const [jobInput, setJobInput] = useState("");

  const [aiResponse, setAiResponse] = useState<JobAnalysisResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFireAI = () => {
    startTransition(async () => {
      const result = await analyzeJobDescription(jobInput);

      if (result.success && result.data) {
        const validation = jobAnalysisSchema.safeParse(result.data);
        if(!validation.success){
          toast.error("Invalid Ai response");
          return ;
        }
        setAiResponse(result.data);

        const dbResult = await saveJobToDatabase(result.data);

        if (dbResult.success) {
          toast.success(": All details are stored!");
        } else {
          toast.error(
            "details are't stored due to some error: " + dbResult.error,
          );
        }
      } else {
        console.error("AI Crash:", result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="p-4 border rounded-md mt-6">
      <textarea
        className="w-full p-3 border rounded-md mb-4 text-black outline-none focus:ring-2 focus:ring-blue-500"
        rows={6}
        placeholder="Enter your job description here..."
        value={jobInput}
        onChange={(e) => setJobInput(e.target.value)}
      />

      <button
        onClick={handleFireAI}
        disabled={isPending || jobInput.length < 20}
        className="bg-slate-900 cursor-pointer text-white px-4 py-2 rounded-md disabled:bg-slate-400 font-medium"
      >
        {isPending ? "AI is Extracting..." : "Extract Job Details"}
      </button>

      {aiResponse && (
        <div className="mt-6 p-4 bg-slate-900 text-emerald-400 rounded-md">
          <h3 className="font-bold text-white mb-2">AI Extraction Result:</h3>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(aiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
