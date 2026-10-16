import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  tool,
  stepCountIs,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { CAREERSYNC_SYSTEM_PROMPT } from "@/app/lib/prompt";
import { Ratelimit } from "@upstash/ratelimit";
import { requireAuth } from "@/app/actions/Job";
import { chatRequestSchema } from "@/app/lib/validations";
import { AppError } from "@/app/lib/Error";
import { redis } from "@/app/lib/redis";
import { prisma } from "@/app/lib/prisma";
import {
  ToolSchemaForJobStats,
  ToolSchemaForAddJob,
} from "@/app/lib/validations";

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

      tools: {
        updateJobStatus: tool({
          description:
            "Update the status of a specific tracked job application when the user requests a status change.",

          inputSchema: ToolSchemaForJobStats,

          execute: async ({ title, company, status }) => {
            const updatedResult = await prisma.job.updateMany({
              where: {
                userId,
                title,
                company,
              },
              data: { status },
            });

            if (updatedResult.count === 0) {
              return {
                success: false,
                message: "Failed: Job not found.",
              };
            }

            return {
              success: true,
              message: `Success: Job status updated to ${status}.`,
            };
          },
        }),
        addJobApplication: tool({
          description:
            "Add a new job application to the user's tracker when they mention applying to a specific job or company. USE THIS TOOL WHEN User says they applied to a job (e.g., I applied to X at Y) -User says they submitted an application - User mentions sending a resume to a company - User says add this job with a role and company User mentions I want to track this job DO NOT USE:- When user is just asking a question about jobs - When user is asking for advice- When user mentions a job without saying they applied- When user asks about existing jobs (use search instead) EXTRACT FROM USER'S MESSAGE: - title: The role/position (e.g., Backend Developer)- company: The company name (e.g., Microsoft)- location: If mentioned (e.g., Lahore)- title OR company is missing from the user's message, do NOT guess — ask the user for clarification first DO NOT ask the user for confirmation about status, location, jobType, or experience. If the user provides the 'title' and 'company', you MUST execute this tool immediately. Use defaults for any missing information.",
          inputSchema: ToolSchemaForAddJob,
          execute: async ({
            title,
            company,
            jobType,
            experienceLevel,
            location,
            skills,
            status
          }) => {
            try {
              const skillsArray = skills
                ? skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean) 
                    .filter(
                      (s, i, arr) =>
                        arr.findIndex(
                          (x) => x.toLowerCase() === s.toLowerCase(),
                        ) === i,
                    )
                : [];

              const addJob = await prisma.job.create({
                data: {
                  userId,
                  title,
                  company,
                  skills: skillsArray,
                  jobType: jobType || "FULL_TIME",
                  experienceLevel: experienceLevel || "Not Specified",
                  location: location || "Not Specified",
                  summary: "Not Provided",
                  salaryRange: "Not Provided",
                  status: status || "PENDING",
                },
              });
              return {
                success: true,
                jobId: addJob.id,
                message: `Success: Added new job ${title} at ${company} with status ${status}.`,
              };
            } catch (error) {
              return {
                success: false,
                message: `Failed to add job application to the database.${error}`,
              };
            }
          },
        }),
      },
      stopWhen: stepCountIs(3),
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
