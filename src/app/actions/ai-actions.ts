"use server";

import { generateObject } from "ai";
import { Redis } from "@upstash/redis";
import { requireAuth } from "./Job";
import { Ratelimit } from "@upstash/ratelimit";
import { google } from "@ai-sdk/google";
import { jobAnalysisSchema } from "../lib/validations";
import { DESCRIPTION_EXTRACTOR } from "../lib/prompt";

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
      model: google(`gemini-3.8-flash`),
      schema: jobAnalysisSchema,
      prompt: `${DESCRIPTION_EXTRACTOR}${cleanJobDescription}`,
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
