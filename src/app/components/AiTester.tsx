"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { analyzeJobDescription } from "../actions/ai-actions";
import { saveJobToDatabase } from "../actions/Job";
import { jobAnalysisSchema, type JobAnalysisResult } from "../lib/validations";
import { getApiLimitCount } from "../lib/quota";
import { MAX_EXTRACTIONS } from "../lib/constraints";

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}

export default function AiTester() {
  const [jobInput, setJobInput] = useState("");
  const [aiResponse, setAiResponse] = useState<JobAnalysisResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const [usageCount, setUsageCount] = useState(0);
  const maxLimit = MAX_EXTRACTIONS;

  const router = useRouter();

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const count = await getApiLimitCount("EXTRACTION");
        setUsageCount(count);
      } catch (err) {
        console.error("Failed to fetch quota:", err);
      }
    };
    fetchUsage();
  }, []);

  const handleFireAI = () => {
    if (jobInput.trim().length < 20) {
      toast.error("Job description is too short.");
      return;
    }

    startTransition(async () => {
      setAiResponse(null);

      try {
        const result = await analyzeJobDescription(jobInput);

        if (!result.success || !result.data) {
          console.error("Job analysis failed:", result.error);
          toast.error(result.error || "Unable to analyze the job description.");
          return;
        }

        const validation = jobAnalysisSchema.safeParse(result.data);

        if (!validation.success) {
          console.error("Invalid AI response:", validation.error.flatten());
          toast.error("The AI returned invalid job details.");
          return;
        }

        setAiResponse(validation.data);
        setUsageCount((prev) => prev + 1);
        toast.success("Job details extracted successfully.");
      } catch (error) {
        console.error("Job analysis error:", error);
        toast.error("Unable to analyze the job description. Please try again.");
      }
    });
  };

  const handleSaveJob = () => {
    if (!aiResponse) {
      toast.error("No job details available to save.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveJobToDatabase(aiResponse);

        if (!result.success) {
          console.error("Save job failed:", result.error);
          toast.error("Unable to save job details. Please try again later.");
          return;
        }

        toast.success("Job details saved successfully.");
        setAiResponse(null);
        setJobInput("");
        router.refresh();
      } catch (error) {
        console.error("Save job error:", error);
        toast.error("An unexpected error occurred. Please try again later.");
      }
    });
  };

  const handleCopy = async () => {
    if (!aiResponse) return;

    const text = [
      aiResponse.role,
      `Company: ${aiResponse.company}`,
      `Location: ${aiResponse.location}`,
      `Job Type: ${aiResponse.jobType}`,
      `Experience Level: ${aiResponse.experienceLevel}`,
      `Salary: ${aiResponse.salaryRange}`,
      `Skills: ${(aiResponse.skills || []).join(", ")}`,
      "",
      aiResponse.summary,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Job details copied to clipboard.");
    } catch (error) {
      console.error("Clipboard error:", error);
      toast.error("Unable to copy details.");
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label
            htmlFor="job-description"
            className="block text-base font-bold text-slate-800"
          >
            AI Job Extractor
          </label>
          <p className="text-sm text-slate-500 mt-1">
            Paste a raw job description to extract structured details.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Daily Limit
          </span>
          <span
            className={`text-sm font-semibold px-2.5 py-1 rounded-md mt-1 ${
              usageCount >= maxLimit
                ? "bg-red-50 text-red-600"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            {usageCount} / {maxLimit} Used
          </span>
        </div>
      </div>

      <textarea
        id="job-description"
        className="mb-4 w-full rounded-xl border border-slate-300 p-4 text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
        rows={6}
        placeholder={
          usageCount >= maxLimit
            ? "Daily extraction limit reached. Upgrade to Pro."
            : "Paste the complete job description here..."
        }
        value={jobInput}
        onChange={(event) => setJobInput(event.target.value)}
        disabled={isPending || usageCount >= maxLimit} 
      />

      <button
        type="button"
        onClick={handleFireAI}
        disabled={
          isPending || jobInput.trim().length < 20 || usageCount >= maxLimit
        }
        className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 w-full sm:w-auto"
      >
        {isPending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {isPending ? "Extracting..." : "Extract Job Details"}
      </button>

      {aiResponse && (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm animate-in fade-in slide-in-from-bottom-4">

          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {aiResponse.role}
                </h2>
                <p className="mt-1 break-words text-base font-medium text-slate-600 sm:text-lg">
                  {aiResponse.company}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                AI Extracted
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <MetaBadge
              label="Type"
              value={aiResponse.jobType || "Not Specified"}
            />
            <MetaBadge
              label="Level"
              value={aiResponse.experienceLevel || "Not Specified"}
            />
            <MetaBadge
              label="Location"
              value={aiResponse.location || "Not Specified"}
            />
            {aiResponse.salaryRange && (
              <MetaBadge label="Salary" value={aiResponse.salaryRange} />
            )}
          </div>
          {(aiResponse.skills || []).length > 0 && (
            <div className="border-b border-slate-100 p-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Required Skills
              </h3>

              <div className="flex flex-wrap gap-2">
                {(aiResponse.skills || []).map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-b border-slate-100 p-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              AI Summary
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {aiResponse.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Copy Details
              </button>

              <button
                type="button"
                onClick={() => setAiResponse(null)}
                disabled={isPending}
                className="rounded-md px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveJob}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isPending ? "Processing..." : "Save to Dashboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}