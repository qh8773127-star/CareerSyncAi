import {  z } from "zod";
import { JobStatus } from "@prisma/client";

export const createJobSchema = z.object({
  title: z.string().trim().min(2, "Title too short").max(50, "Title too long"),

  company: z
    .string()
    .trim()
    .min(2, "Company name too short")
    .max(50, "Company name too long"),

  location: z
    .string()
    .trim()
    .min(2, "Location is too short")
    .max(100, "Location is too long")
    .optional(),

  skills: z.string().trim().min(1, "Please add at least one skill").optional(),

  experienceLevel: z.enum(["ENTRY", "MID", "SENIOR"]).optional(),

  jobType: z.enum(["PART_TIME", "FULL_TIME", "CONTRACT", "INTERNSHIP"]).optional(),
});

export const jobIdSchema = z.string().uuid("Invalid Job ID format");

export const updateJobStatusSchema = z.object({
  jobId: z.string().uuid("Invalid Job ID format"),

  status: z.enum(JobStatus),
});

export const filterJobsSchema = z.object({
  query: z.string().trim().max(100, "Search query is too long").optional(),

  status: z.enum(["ALL", ...Object.values(JobStatus)]).optional(),

  page: z.number().int().min(1).default(1),

  itemsPerPage: z.number().int().min(1).max(50).default(10),
});

//ai
export const jobAnalysisSchema = z.object({
  role: z.string().describe("Exact job title, for example Full Stack Engineer"),

  company: z.string().describe("Company name if mentioned, otherwise Unknown"),

  skills: z
    .array(z.string())
    .optional()
    .describe("Core technical skills required for this job"),

  experienceLevel: z
    .enum(["ENTRY", "MID", "SENIOR"])
    .optional()
    .describe("0-2 years = ENTRY, 3-5 years = MID, 5+ years = SENIOR"),

  location: z
    .string()
    .optional()
    .describe(
      "Extract the job location exactly as stated in the job description. " +
        "If the position is explicitly remote, return 'Remote'. " +
        "If a city and country are provided, return them in 'City, Country' format. " +
        "If the location is not mentioned or cannot be determined with confidence, " +
        "return exactly 'Not Specified'. Do not infer or guess the location.",
    ),

  salaryRange: z
    .string()
    .optional()
    .describe(
      "Extract the salary or compensation range exactly as stated in the job description, " +
        "including the currency and relevant pay period when available. " +
        "Preserve the original numeric values and range. " +
        "If salary or compensation information is not disclosed or not mentioned, " +
        "return exactly 'Not Disclosed'. Do not estimate, infer, or fabricate salary information.",
    ),

  jobType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"])
    .optional()
    .describe(
      "Classify the employment type based strictly on the job description. " +
        "Use 'FULL_TIME' for full-time positions, 'PART_TIME' for part-time positions, " +
        "'CONTRACT' for contract or temporary contract positions, and 'INTERNSHIP' for internships. " +
        "If the employment type is not explicitly stated or cannot be determined with confidence, " +
        "default to 'FULL_TIME'. Do not infer a different type from unrelated job details.",
    ),

  summary: z
    .string()
    .optional()
    .describe("Exactly 2 sentences explaining what the job is about"),
});
export type JobAnalysisResult = z.infer<typeof jobAnalysisSchema>;

export const chatRequestSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            id: z.string().optional(),
            role: z.enum(["user", "assistant", "system"]),
            parts: z.array(
              z
                .object({
                  type: z.string(),
                  text: z.string().max(2000).optional(),
                })
                .passthrough(),
            ),
          })
          .passthrough(),
      )
      .max(50),
  })
  .passthrough();

export const ToolSchemaForJobStats = z.object({
  title: z.string().describe("search this title in the jobstats"),
  company: z.string().describe("search this company alos in jobstats"),
  status: z.enum(JobStatus).optional().describe("The exact new status"),
});

export const ToolSchemaForAddJob = z.object({
  title: z.string().min(1, "Title cannot be empty").describe("The job role/position"),
  company: z.string().min(1, "Company cannot be empty").describe("The company name"),
  jobType: z.string().optional().describe("E.g., FULL_TIME, PART_TIME, REMOTE."),
  experienceLevel: z.string().optional().describe("Experience required, e.g., '0-1 years'"),
  location: z.string().optional().describe("Location e.g., UK, London, PAK"),
  status: z.enum(JobStatus)
  .optional()
  .describe("Job status if user explicitly mentions it (e.g., 'got rejected', 'have an interview')."),
  skills: z.string().optional().describe("Comma separated skills (e.g., react, mysql, typescript)")
});