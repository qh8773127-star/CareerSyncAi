import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { JudgeSchema } from "../validations";
import { JobforJudge } from "../constraints";

export type JudgeResult = z.infer<typeof JudgeSchema>;

export async function evaluateRetrieval(
  query: string,
  retrievedJobs: JobforJudge[],
): Promise<JudgeResult> {
  if (!query?.trim() || !retrievedJobs || retrievedJobs.length === 0) {
    return {
      score: 0,
      reasoning: !query?.trim()
        ? "Empty query provided."
        : "No jobs retrieved.",
      relevantJobsCount: 0,
    };
  }

  const jobsContext = retrievedJobs
    .map((job, index) => {
      const skills =
        Array.isArray(job.skills) && job.skills.length > 0
          ? job.skills.join(", ")
          : "None";
      return `Job ${index + 1}: ${job.title} at ${job.company}.\nLocation: ${job.location || "N/A"}.\nStatus: ${job.status || "PENDING"}.\nSkills: ${skills}.\nSummary: ${job.summary || "N/A"}`;
    })
    .join("\n\n");

  try {
    const { object } = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: JudgeSchema,
      temperature: 0,
      system: `You are an impartial judge evaluating a RAG retrieval system.
You will be given a user query and the context (jobs) retrieved from the database.
Your task is to evaluate if the retrieved jobs are relevant to the user's query.
Be strict. If the query asks for "React" and the job is for "Java", score it 0.
The score must be between 0.0 and 1.0, and relevantJobsCount must be an integer between 0 and ${retrievedJobs.length}.`,
      prompt: `User Query: "${query}"

Retrieved Jobs:
${jobsContext}

Evaluate the Context Precision. Are these jobs relevant to the query?`,
    });

    return {
      score: Math.max(0, Math.min(1, object.score)),
      reasoning: object.reasoning,
      relevantJobsCount: Math.max(
        0,
        Math.min(retrievedJobs.length, Math.round(object.relevantJobsCount)),
      ),
    };
  } catch (error) {
    console.error("❌ Judge evaluation failed:", error);
    return {
      score: 0,
      reasoning: "Failed to evaluate due to API error.",
      relevantJobsCount: 0,
    };
  }
}
