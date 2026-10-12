"use server";

import { generateText } from "ai";
import { requireAuth } from "./Job";
import { Ratelimit } from "@upstash/ratelimit";
import { groq } from "@ai-sdk/groq";
import { jobAnalysisSchema } from "../lib/validations";
import { DESCRIPTION_EXTRACTOR } from "../lib/prompt";
import { redis } from "../lib/redis";

function sanitizeJobDescription(text: string) {
  return text.trim().replace(/\s+/g, " ").substring(0, 5000);
}

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

    const { text } = await generateText({
      model: groq("openai/gpt-oss-20b"),
      prompt: `${DESCRIPTION_EXTRACTOR}${cleanJobDescription}`,
    });
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Raw LLM Output:", text);
      throw new Error("AI failed to return a valid JSON structure.");
    }

    const cleanJsonString = jsonMatch[0];
    const parsedData = JSON.parse(cleanJsonString);
    const object = jobAnalysisSchema.parse(parsedData);

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
