"use client";

import { useState, useTransition } from "react";
import { analyzeJobDescription } from "../actions/ai-actions";
import { saveJobToDatabase } from "../actions/Job";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { jobAnalysisSchema, type JobAnalysisResult } from "../lib/validations";

export default function AiTester() {
  const [jobInput, setJobInput] = useState("");

  const [aiResponse, setAiResponse] = useState<JobAnalysisResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router=useRouter();
  const handleFireAI = () => {
    startTransition(async () => {
      const result = await analyzeJobDescription(jobInput);

      if (result.success && result.data) {
        const validation = jobAnalysisSchema.safeParse(result.data);
        if (!validation.success) {
          toast.error("Invalid Ai response");
          return;
        }
        setAiResponse(result.data);
      } else {
        console.error("AI Crash:", result.error);
        toast.error(result.error);
      }
    });
  };
  const handleSaveJob = async () => {
    if (!aiResponse) {
      toast.error("Response is empty!");
      return;
    }

    startTransition(async () => {
      const dbResult = await saveJobToDatabase(aiResponse);

      if (dbResult.success) {
        toast.success(": All details are stored!");
        setAiResponse(null);
        setJobInput("");
        router.refresh();
      } else {
        toast.error(
          "Your details could not be saved due to an unexpected error. Please try again later: " +
            dbResult.error,
        );
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
        <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {aiResponse.role}
            </h2>
            <p className="text-lg font-medium text-slate-600 mt-1">
              {aiResponse.company}
            </p>
          </div>

          <div className="p-6 bg-slate-50/50 flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 font-semibold text-sm">
              <span className="opacity-70 text-xs uppercase tracking-wider">
                Type:
              </span>{" "}
              {aiResponse.jobType}
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 font-semibold text-sm">
              <span className="opacity-70 text-xs uppercase tracking-wider">
                Exp:
              </span>{" "}
              {aiResponse.experienceLevel}
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 font-semibold text-sm">
              <span className="opacity-70 text-xs uppercase tracking-wider">
                Loc:
              </span>
              {aiResponse.location}
            </div>
            {aiResponse.salaryRange && (
              <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-3 py-1.5 rounded-md border border-purple-200 font-semibold text-sm">
                <span className="opacity-70 text-xs uppercase tracking-wider">
                  Pay:
                </span>{" "}
                {aiResponse.salaryRange}
              </div>
            )}
          </div>

          {aiResponse.skills && aiResponse.skills.length > 0 && (
            <div className="p-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                Required Skills
              </h3>
              <div className="flex gap-2 flex-wrap">
                {aiResponse.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors hover:bg-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              AI Summary
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              {aiResponse.summary}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveJob}
              disabled={isPending}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-600/20 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? "Saving Data..." : "Looks Good, Save to Database"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
