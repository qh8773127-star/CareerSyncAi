"use server";
//import
import {
  createJobSchema,
  filterJobsSchema,
  jobIdSchema,
  updateJobStatusSchema,
} from "../lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/Error";

//Oauth
export async function requireAuth(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Please sign in to continue.", 401);
  }

  return session.user.id;
}

//Error MSG
const DUPLICATE_ERROR = {
  success: false as const,
  code: "DUPLICATE_RECORD" as const,
  error: "Job already exists in your dashboard!",
};

//Create
export async function createJob(formData: unknown) {
  try {
    const userId = await requireAuth();

    const validation = createJobSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false as const,
        code: "VALIDATION_ERROR" as const,
        error: validation.error.issues[0]?.message ?? "Invalid job data",
      };
    }

    const existingJob = await prisma.job.findFirst({
      where: {
        userId,
        title: validation.data.title,
        company: validation.data.company,
      },
      select: { id: true },
    });

    if (existingJob) {
      return DUPLICATE_ERROR;
    }
    const skillsArray = validation.data.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter(
        (s, i, arr) =>
          arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i,
      );

    await prisma.job.create({
      data: {
        title: validation.data.title,
        company: validation.data.company,
        location: validation.data.location,
        skills: skillsArray,
        experienceLevel: validation.data.experienceLevel,
        jobType: validation.data.jobType,
        summary: "Manually added. No AI summary.",
        salaryRange: "Not Disclosed",
        userId,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true as const,
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false as const,
        code: error.code,
        error: error.message,
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return DUPLICATE_ERROR;
    }

    console.error("Create Job Error:", error);
    return {
      success: false as const,
      code: "INTERNAL" as const,
      error: "Failed to create job. Please try again.",
    };
  }
}

export async function deleteJob(jobId: unknown) {
  try {
    const userId = await requireAuth();

    const validation = jobIdSchema.safeParse(jobId);

    if (!validation.success) {
      return {
        success: false,
        error: "Invalid job ID",
      };
    }

    const result = await prisma.job.deleteMany({
      where: {
        id: validation.data,
        userId,
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        error: "Job not found",
      };
    }

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete Job Error:", error);

    return {
      success: false,
      error: "Failed to delete job",
    };
  }
}

export async function updateJobStatus(jobId: unknown, newStatus: unknown) {
  try {
    const userId = await requireAuth();

    const validation = updateJobStatusSchema.safeParse({
      jobId,
      status: newStatus,
    });

    if (!validation.success) {
      return {
        success: false,
        error: "Invalid update data",
      };
    }

    const result = await prisma.job.updateMany({
      where: {
        id: validation.data.jobId,
        userId,
      },
      data: {
        status: validation.data.status,
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        error: "Job not found",
      };
    }

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update Job Error:", error);

    return {
      success: false,
      error: "Failed to update job",
    };
  }
}

export async function getJobStats() {
  try {
    const userId = await requireAuth();

    const statusCounts = await prisma.job.groupBy({
      by: ["status"],
      where: {
        userId,
      },
      _count: {
        status: true,
      },
    });

    const stats = {
      total: 0,
      PENDING: 0,
      INTERVIEW: 0,
      REJECTED: 0,
      HIRED: 0,
    };

    for (const item of statusCounts) {
      const count = item._count.status;

      stats[item.status as keyof typeof stats] = count;
      stats.total += count;
    }

    return stats;
  } catch (error) {
    console.error("Get Job Stats Error:", error);

    return {
      total: 0,
      PENDING: 0,
      INTERVIEW: 0,
      REJECTED: 0,
      HIRED: 0,
    };
  }
}

export async function getFilteredJobs(inputParams: unknown) {
  try {
    const userId = await requireAuth();

    const validation = filterJobsSchema.safeParse(inputParams ?? {});

    if (!validation.success) {
      return {
        jobs: [],
        totalPages: 0,
      };
    }

    const { query, status, page, itemsPerPage } = validation.data;

    const whereClause: Prisma.JobWhereInput = {
      userId,
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          company: {
            contains: query,
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (page - 1) * itemsPerPage;

    const [jobs, totalJobsCount] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: itemsPerPage,
        skip,
      }),

      prisma.job.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalJobsCount / itemsPerPage);

    return {
      jobs,
      totalPages,
    };
  } catch (error) {
    console.error("Get Filtered Jobs Error:", error);

    return {
      jobs: [],
      totalPages: 0,
    };
  }
}
export interface ExtractedJobData {
  role: string;
  company: string;
  skills: string[];
  experienceLevel: string;
  summary: string;
  location: string;
  salaryRange: string;
  jobType: string;
}

export async function saveJobToDatabase(jobData: ExtractedJobData) {
  try {
    const userId = await requireAuth();

    const existingJob = await prisma.job.findFirst({
      where: { userId, title: jobData.role, company: jobData.company },
      select: { id: true },
    });

    if (existingJob) return DUPLICATE_ERROR;

    const newJob = await prisma.job.create({
      data: {
        title: jobData.role,
        company: jobData.company,
        skills: jobData.skills,
        experienceLevel: jobData.experienceLevel,
        summary: jobData.summary,
        location: jobData.location,
        salaryRange: jobData.salaryRange,
        jobType: jobData.jobType,
        userId,
      },
    });
    return { success: true, job: newJob };
  } catch (error) {
    console.error("Prisma Crash:", error);
    if (error instanceof AppError) {
      return {
        success: false as const,
        code: error.code,
        error: error.message,
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return DUPLICATE_ERROR;
    }

    console.error("Save Job Error:", error);
    return {
      success: false as const,
      code: "INTERNAL" as const,
      error: "Failed to save job. Please try again.",
    };
  }
}
