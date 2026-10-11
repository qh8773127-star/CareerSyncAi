import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { CAREERSYNC_SYSTEM_PROMPT } from "@/app/lib/prompt";
import { Ratelimit } from "@upstash/ratelimit";
import { requireAuth } from "@/app/actions/Job";
import { chatRequestSchema } from "@/app/lib/validations";
import { AppError } from "@/app/lib/Error";
import { redis } from "@/app/lib/redis";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, "10s"),
});

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();

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

    const messages = parseData.data.messages as UIMessage[];

    const result = await streamText({
      model: google("gemini-3.8-flash"),
      messages: await convertToModelMessages(messages),
      system: CAREERSYNC_SYSTEM_PROMPT,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Stream Crash:", error);

    if (error instanceof AppError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(
      JSON.stringify({
        error: "Something went wrong. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}