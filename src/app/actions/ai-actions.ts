"use server";

import { requireAuth } from "./Job";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../lib/redis";
import { extractJobData } from "./extract-job-core";
import { consumeQuota, refundQuota } from "../lib/quota";

function sanitizeJobDescription(text: string) {
  return text.trim().replace(/\s+/g, " ").substring(0, 5000);
}

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});

export async function analyzeJobDescription(rawJobText: string) {
  const userId = await requireAuth();
  const requestId = crypto.randomUUID();
  try {
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
    const quota = await consumeQuota("EXTRACTION", requestId);
    if (!quota.success) {
      return {
        success: false,
        error: "Daily extraction limit reached.",
      };
    }

    const cleanJobDescription = sanitizeJobDescription(rawJobText);
    const object = await extractJobData(cleanJobDescription);

    return {
      success: true,
      data: object,
    };
  } catch (error) {
    console.error("Structured Output Engine Failed:", error);
    try {
      await refundQuota(requestId);
       console.log("REFUND EXECUTED");
    } catch (refundError) {
      console.error("Refund Failed:", refundError);
      console.error("Refund Failed:", refundError);
    }

    return {
      success: false,
      error: `AI fail to extract data.`,
    };
  }
}
