import { tool } from "ai";
import { prisma } from "../prisma";
import {
  ToolSchemaForJobStats,
  ToolSchemaForAddJob,
  ToolSchemaForDeleteJob,
  ToolSchemaForDeleteAllJobs,
} from "../validations";
import { requireAuth } from "@/app/actions/Job";
import {
  TOOL_DESC_UPDATE_JOB,
  TOOL_DESC_ADD_JOB,
  TOOL_DESC_DELETE_ONE_JOB,
  TOOL_DESC_DELETE_ALL_JOB,
} from "./prompt";

export const updateJobStatus = tool({
  description: TOOL_DESC_UPDATE_JOB,

  inputSchema: ToolSchemaForJobStats,

  execute: async ({ title, company, status }) => {
    const userId = await requireAuth();
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
});

export const addJobApplication = tool({
  description: TOOL_DESC_ADD_JOB,
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
      const userId = await requireAuth();
      const skillsArray = skills
        ? skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .filter(
              (s, i, arr) =>
                arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i,
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
        message: `Success: Added new job ${title} at ${company} with status ${status}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to add job application to the database.${error}`,
      };
    }
  },
});

export const deleteSpecificJob = tool({
  description: TOOL_DESC_DELETE_ONE_JOB,

  inputSchema: ToolSchemaForDeleteJob,
  execute: async ({ title, company }) => {
    try {
      const userId = await requireAuth();
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
});

export const deleteAllJobs = tool({
  description: TOOL_DESC_DELETE_ALL_JOB,
  inputSchema: ToolSchemaForDeleteAllJobs,
  execute: async () => {
    try {
      const userId = await requireAuth();
      const DelAll = await prisma.job.deleteMany({
        where: { userId },
      });
      if (DelAll.count === 0) {
        return {
          success: false,
          message:
            "Your tracker is already empty. You don't have any jobs to delete.",
        };
      }
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
});
