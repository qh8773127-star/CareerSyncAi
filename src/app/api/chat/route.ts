import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { CAREERSYNC_SYSTEM_PROMPT } from "@/app/lib/prompt";
import { Ratelimit } from "@upstash/ratelimit";
import { requireAuth } from "@/app/actions/Job";
import { chatRequestSchema } from "@/app/lib/validations";
import { AppError } from "@/app/lib/Error";
import { redis } from "@/app/lib/redis";
import { prisma } from "@/app/lib/prisma";
import { title } from "process";
import { string } from "zod/v3";

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

    const jobsData = await prisma.job.findMany({
      where: {
        userId,
      },
      select: { title: true, company: true, status: true },
    });

    const liveContext =
      jobsData.length > 0
        ? jobsData
            .map(
              (data) =>
                `[${data.title}] at [${data.company}] (Status: ${data.status})`,
            )
            .join("\n")
        : "User has not tracked any jobs yet.";

    const result = await streamText({
      model: groq("openai/gpt-oss-120b"),
      messages: await convertToModelMessages(messages),
      system: CAREERSYNC_SYSTEM_PROMPT(liveContext),
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
