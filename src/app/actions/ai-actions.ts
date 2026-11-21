"use server";

import { requireAuth } from "./Job";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../lib/redis";
import { extractJobData } from "./extract-job-core";
import { consumeQuota, refundQuota } from "../lib/quota";
import { langfuseSpanProcessor } from "../lib/langfuse";
import { propagateAttributes, startActiveObservation } from "@langfuse/tracing";
import { after } from "next/server";

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

    const object = await propagateAttributes(
      {
        userId,
        tags: ["job-extraction"],
      },
      async () =>
        startActiveObservation("analyze-job-description", async (rootSpan) => {
          rootSpan.update({ input: cleanJobDescription });
          const extracted = await extractJobData(cleanJobDescription);
          rootSpan.update({ output: extracted });
          return extracted;
        }),
    );

    after(async () => {
      try {
        await langfuseSpanProcessor.forceFlush();
      } catch (err) {
        console.error("Langfuse flush failed:", err);
      }
    });

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
    }

    after(async () => {
      try {
        await langfuseSpanProcessor.forceFlush();
      } catch (err) {
        console.error("Langfuse error flush failed:", err);
      }
    });

    return {
      success: false,
      error: "AI fail to extract data.",
    };
  }
}