"use server";

import { generateObject } from "ai";
import { Redis } from "@upstash/redis";
import { requireAuth } from "./Job";
import { Ratelimit } from "@upstash/ratelimit";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const jobAnalysisSchema = z.object({
  role: z.string().describe("Exact job title, for example Full Stack Engineer"),

  company: z.string().describe("Company name if mentioned, otherwise Unknown"),

  skills: z
    .array(z.string())
    .describe("Core technical skills required for this job"),

  experienceLevel: z
    .enum(["ENTRY", "MID", "SENIOR"])
    .describe("0-2 years = ENTRY, 3-5 years = MID, 5+ years = SENIOR"),

  location: z
    .string()
    .describe(
      "Extract the job location exactly as stated in the job description. " +
        "If the position is explicitly remote, return 'Remote'. " +
        "If a city and country are provided, return them in 'City, Country' format. " +
        "If the location is not mentioned or cannot be determined with confidence, " +
        "return exactly 'Not Specified'. Do not infer or guess the location.",
    ),

  salaryRange: z
    .string()
    .describe(
      "Extract the salary or compensation range exactly as stated in the job description, " +
        "including the currency and relevant pay period when available. " +
        "Preserve the original numeric values and range. " +
        "If salary or compensation information is not disclosed or not mentioned, " +
        "return exactly 'Not Disclosed'. Do not estimate, infer, or fabricate salary information.",
    ),

  jobType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"])
    .describe(
      "Classify the employment type based strictly on the job description. " +
        "Use 'FULL_TIME' for full-time positions, 'PART_TIME' for part-time positions, " +
        "'CONTRACT' for contract or temporary contract positions, and 'INTERNSHIP' for internships. " +
        "If the employment type is not explicitly stated or cannot be determined with confidence, " +
        "default to 'FULL_TIME'. Do not infer a different type from unrelated job details.",
    ),

  summary: z
    .string()
    .describe("Exactly 2 sentences explaining what the job is about"),
});

function sanitizeJobDescription(text: string) {
  return text.trim().replace(/\s+/g, " ").substring(0, 5000);
}
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});
export async function analyzeJobDescription(rawJobText: string) {
  try {
    const userId = await requireAuth();
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      return {
        success: false,
        error: "API limit reached. Please wait 1 minute.",
      };
    }

    if (!rawJobText || rawJobText.trim().length < 20) {
      return {
        success: false,
        error: "Job description is too short.",
      };
    }

    const cleanJobDescription = sanitizeJobDescription(rawJobText);

    const { object } = await generateObject({
      model: google("gemini-3.5-flash"),
      schema: jobAnalysisSchema,
      prompt: `
Analyze the following job description.

Extract the information according to the provided schema.

Job Description:
${cleanJobDescription}
`,
    });

    return {
      success: true,
      data: object,
    };
  } catch (error) {
    console.error("Structured Output Engine Failed:", error);

    return {
      success: false,
      error: `AI fail to extract data.`,
    };
  }
}
