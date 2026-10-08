import { z } from "zod";
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
    .max(100, "Location is too long"),

  skills: z
    .string()
    .trim()
    .min(1, "Please add at least one skill"),

  experienceLevel: z.enum(["ENTRY", "MID", "SENIOR"]),

  jobType: z.enum(["PART_TIME", "FULL_TIME"]),
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
