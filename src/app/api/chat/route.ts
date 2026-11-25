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
import { prisma } from "@/app/lib/prisma";
import { langfuseSpanProcessor } from "@/app/lib/langfuse";
import {
  propagateAttributes,
  startActiveObservation,
  startObservation,
} from "@langfuse/tracing";

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
      console.error("ZOD VALIDATION ERROR:", parseData.error.format());
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
    const chatId = body.chatId || crypto.randomUUID();

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

    if (userQuery.trim() !== "") {
      await prisma.chat.upsert({
        where: { id: chatId },
        update: { updatedAt: new Date() },
        create: { id: chatId, userId, title: userQuery.substring(0, 30) },
      });

      await prisma.message.create({
        data: { chatId, role: "user", content: userQuery },
      });
    } else {
      userQuery = "Show me my recently saved jobs";
    }

    return await propagateAttributes(
      {
        userId,
        sessionId: chatId,
      },
      async () => {
        return await startActiveObservation(
          "careersync-rag-chat",
          async (rootSpan) => {
            rootSpan.update({ input: userQuery });

            const relevantJobs = await retrieveRelevantJobs(userId, userQuery);
            let contextText = "No relevant jobs found in the user's database.";
            if (relevantJobs.length > 0) {
              contextText = relevantJobs
                .map(
                  (job) =>
                    `- Job: ${job.title} at ${job.company}\n  Status: ${job.status || "PENDING"}\n  Location: ${job.location || "Not Specified"}\n  Summary: ${job.summary || "N/A"}\n  Skills: ${job.skills.join(", ")}`,
                )
                .join("\n\n");
            }

            const llmStartTime = new Date();

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
              onFinish: async ({ text, usage }) => {
                try {
                  await prisma.message.create({
                    data: { chatId, role: "assistant", content: text },
                  });

                  const generation = startObservation(
                    "groq-chat-completion",
                    {
                      model: "openai/gpt-oss-120b",
                      input: {
                        systemContext: contextText,
                        userQuery,
                      },
                      output: text,
                      usageDetails: {
                        input: usage?.inputTokens ?? 0,
                        output: usage?.outputTokens ?? 0,
                      },
                    },
                    { asType: "generation", startTime: llmStartTime },
                  );
                  generation.end();

                  rootSpan.update({ output: text });
                  await langfuseSpanProcessor.forceFlush();
                } catch (error) {
                  console.error(
                    "Failed to save AI message or flush trace:",
                    error,
                  );
                }
              },
            });

            return result.toUIMessageStreamResponse({
              headers: {
                "x-chat-id": chatId,
              },
            });
          },
        );
      },
    );
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
