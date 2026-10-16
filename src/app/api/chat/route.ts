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
  ToolSchemaForDeleteJob,
  ToolSchemaForDeleteAllJobs,
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
            status,
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
        deleteSpecificJob: tool({
          description:
            "Permanently remove ONE specific tracked job application from the user's tracker.USE THIS TOOL WHEN:- User says delete my X application or remove Y from my tracker- User says untrack this job or I don't want to track X anymore- User says remove the Z role at [Company]- User explicitly requests removal of a specific tracked job- User mentions a specific title, company, or both DO NOT USE:- For deleting ALL jobs (use deleteAllJobs instead)- For status changes like REJECTED or HIRED (use updateJobStatus)- For adding new jobs (use addJobApplication)- For searching or viewing jobs (use searchJobApplication)- When user is just venting about a rejection — they often want to KEEP the record for tracking purposes- When user asks a question about a jobCRITICAL — ALWAYS CONFIRM BEFORE DELETING:- Deletion is PERMANENT and cannot be undone- Before executing, respond to the user: Just to confirm — do you want me to permanently delete your [title] application at [company]? Reply yes to confirm.- Only call this tool AFTER the user confirms with yes, confirm, delete it, or similar affirmation- If the user's intent is ambiguous, ask for clarification instead of assumingEXTRACT FROM USER'S MESSAGE:- title: The role/position (e.g., Backend Engineer)- company: The company name (e.g., Uber)If title OR company is missing, do NOT guess. Ask the user which application they want to delete.If multiple applications match the same title and company, do not guess — ask the user to specify.",

          inputSchema: ToolSchemaForDeleteJob,
          execute: async ({ title, company }) => {
            try {
              const DelJob = await prisma.job.deleteMany({
                where: { userId, title, company },
              });
              if (DelJob.count === 0) {
                return {
                  success: false,
                  message: `Failed: Could not find ${title} at ${company} in the database. Nothing was deleted.`,
                };
              }
              return {
                success: true,
                message: `Success: Successfully deleted ${title} at ${company} from the database.`,
              };
            } catch (error) {
              return {
                success: false,
                message: `Failed to delte job application to the database.${error}`,
              };
            }
          },
        }),
        deleteAllJobs: tool({
          description:
            "Permanently remove ALL tracked job applications from the user's tracker.USE THIS TOOL WHEN:- User says delete all my jobs or clear my tracker- User says remove everything or wipe all applications- User says I want to start fresh or reset my job list- User explicitly requests removing the ENTIRE job listDO NOT USE:- For deleting a SINGLE specific job (use deleteJobApplication instead)- When user mentions a specific title or company — that means they want one job deleted, not all- For status changes like REJECTED or HIRED (use updateJobStatus)- For adding new jobs (use addJobApplication)- When user's intent is unclear — always prefer askingCRITICAL — ALWAYS CONFIRM WITH EXTRA CAUTION:- This deletes ALL job applications. It is IRREVERSIBLE.- This is a HIGH-RISK action. Be extra careful about intent.- Before executing, respond: Just to confirm — this will permanently delete ALL your tracked job applications. This cannot be undone. Reply DELETE ALL to confirm.- Require explicit confirmation phrase DELETE ALL, not just yes- Only call this tool AFTER the user confirms with the exact phrase- If the user's message is ambiguous (e.g., they mention a specific job), do NOT assume they mean all jobsEXTRACT FROM USER'S MESSAGE: No fields requiredIf user's phrasing suggests deleting specific jobs, switch to deleteJobApplication instead.If the user explicitly asks to clear the tracker or delete all jobs, and they provide ANY confirmation like 'yes', 'yep', or 'delete all' (regardless of uppercase or lowercase), YOU MUST EXECUTE THIS TOOL IMMEDIATELY. DO NOT get stuck in a loop asking them to repeat the exact phrase 'DELETE ALL",
          inputSchema: ToolSchemaForDeleteAllJobs,
          execute: async () => {
            try {
              const DelAll = await prisma.job.deleteMany({
                where: { userId },
              });
              return {
                success: true,
                message: `Success: Cleared the tracker. Deleted ${DelAll.count} jobs from the database.`,
              };
            } catch (error) {
              return {
                success: false,
                message: `Failed to delte job application to the database.${error}`,
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
