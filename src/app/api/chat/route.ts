import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { CAREERSYNC_SYSTEM_PROMPT } from "@/app/lib/ai/prompt";
import { Ratelimit } from "@upstash/ratelimit";
import { requireAuth } from "@/app/actions/Job";
import { chatRequestSchema } from "@/app/lib/validations";
import { AppError } from "@/app/lib/Error";
import { redis } from "@/app/lib/redis";
import {
  updateJobStatus,
  addJobApplication,
  deleteSpecificJob,
  deleteAllJobs,
} from "@/app/lib/ai/tools";
import { consumeQuota, refundQuota } from "@/app/lib/quota";
import { NextResponse } from "next/server";
import { retrieveRelevantJobs } from "@/app/lib/rag";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, "10s"),
});

export async function POST(req: Request) {
  const userId = await requireAuth();
  const requestId = crypto.randomUUID();
  try {
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Too Many Requests. Please try again Later.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();

    const parseData = chatRequestSchema.safeParse(body);

    if (!parseData.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Requests. Please try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    
    const quota = await consumeQuota("CHAT", requestId);

    if (!quota.success) {
      return NextResponse.json(
        { error: quota.error || "Daily chat limit reached." },
        { status: 403 },
      );
    }

    const messages = parseData.data.messages as UIMessage[];

    const lastMessage = messages[messages.length - 1];
    let userQuery = "";

    if (typeof lastMessage.parts === "string") {
      userQuery = lastMessage.parts;
    } else if (Array.isArray(lastMessage.parts)) {
      userQuery = lastMessage.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ");
    }

    if (!userQuery.trim()) {
      userQuery = "Show me my recently saved jobs";
    }

    const relevantJobs = await retrieveRelevantJobs(userId, userQuery);
    let contextText = "No relevant jobs found in the user's database.";
    if (relevantJobs.length > 0) {
      contextText = relevantJobs
        .map(
          (job) =>
            `- Job: ${job.title} at ${job.company}\n  Summary: ${job.summary || "N/A"}\n  Skills: ${job.skills.join(", ")}`,
        )
        .join("\n\n");
    }

    const result = await streamText({
      model: groq("openai/gpt-oss-120b"),
      messages: await convertToModelMessages(messages),
      system: CAREERSYNC_SYSTEM_PROMPT(contextText),

      tools: {
        updateJobStatus,
        addJobApplication,
        deleteSpecificJob,
        deleteAllJobs,
      },

      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof AppError) {
      await refundQuota(requestId);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("[CHAT_ERROR]", error);
    await refundQuota(requestId);

    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
