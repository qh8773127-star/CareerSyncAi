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
  import { getJobsContext } from "@/app/lib/ai/context";
  import {
    updateJobStatus,
    addJobApplication,
    deleteSpecificJob,
    deleteAllJobs,
  } from "@/app/lib/ai/tools";
  import { consumeQuota, refundQuota } from "@/app/lib/quota";
  import { NextResponse } from "next/server";

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
      if (!quota?.success) {
        return new NextResponse(
          JSON.stringify({ error: quota?.message || "Limit reached" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      const messages = parseData.data.messages as UIMessage[];

      const liveContext = await getJobsContext();

      const result = await streamText({
        model: groq("openai/gpt-oss-120b"),
        messages: await convertToModelMessages(messages),
        system: CAREERSYNC_SYSTEM_PROMPT(liveContext),

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
