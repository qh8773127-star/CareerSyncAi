"use server";
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
import { ActionResult, AppError } from "../lib/Error";
import { type JobAnalysisResult } from "../lib/validations";
import { redis } from "../lib/redis";
import { JobStats,EMPTY_STATS } from "../lib/constraints";

export async function requireAuth(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Please sign in to continue.", 401);
  }

  return session.user.id;
}
const DUPLICATE_ERROR = {
  success: false as const,
  code: "DUPLICATE_RECORD" as const,
  error: "Job already exists in your dashboard!",
};

export async function deleteAll(): Promise<ActionResult<null>> {
  const userId = await requireAuth();
  try {
    const count = await prisma.job.count({
      where: { userId },
    });
    if (count === 0) {
      return {
        success: false,
        code: "VALIDATION_ERROR" as const,
        error: "No Jobs to Delete.",
      };
    }
    await prisma.job.deleteMany({
      where: { userId },
    });
    await redis.del(`user_jobs_stats:${userId}`);
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        code: error.code,
        error: error.message,
      };
    }
    return {
      success: false,
      code: "INTERNAL" as const,
      error: "Failed to delete jobs. Please try again.",
    };
  }
}

export async function createJob(formData: unknown) {
  const userId = await requireAuth();
  try {
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
      ? validation.data.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .filter(
            (s, i, arr) =>
              arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i,
          )
      : [];

    await prisma.job.create({
      data: {
        title: validation.data.title,
        company: validation.data.company,
        location: validation.data.location || "Not Specified",
        skills: skillsArray || "Not Specified",
        experienceLevel: validation.data.experienceLevel || "Not Specified",
        jobType: validation.data.jobType || "Not Specified",
        summary: "Manually added. No AI summary.",
        salaryRange: "Not Disclosed",
        userId,
      },
    });

    await redis.del(`user_jobs_stats:${userId}`);
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
        success: false as const,
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
        success: false as const,
        error: "Job not found",
      };
    }

    await redis.del(`user_jobs_stats:${userId}`);
    revalidatePath("/dashboard");
    return {
      success: true as const,
    };
  } catch (error) {
    console.error("Delete Job Error:", error);
    if (error instanceof AppError) {
      return {
        success: false as const,
        code: error.code,
        error: error.message,
      };
    }

    return {
      success: false as const,
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
        success: false as const,
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
        success: false as const,
        error: "Job not found",
      };
    }

    await redis.del(`user_jobs_stats:${userId}`);
    revalidatePath("/dashboard");
    return {
      success: true as const,
    };
  } catch (error) {
    console.error("Update Job Error:", error);

    return {
      success: false as const,
      error: "Failed to update job",
    };
  }
}

export async function getJobStats(): Promise<JobStats> {
  const userId = await requireAuth();
  const cacheKey = `user_jobs_stats:${userId}`;

  try {
    const cached = await redis.get<JobStats>(cacheKey);
    if (cached !== null && cached !== undefined) {
      console.log("🔥 REDIS CACHE HIT (Stats): Neon DB zinda bach gaya!");
      return cached;
    }
  } catch (redisError) {
    console.error("[REDIS_READ_ERROR_STATS]:", redisError);
  }
  console.log("💀 NEON DB HIT (Stats): Redis khali tha, DB ragra gaya!");
  const statusCounts = await prisma.job.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });
  const stats: JobStats = { ...EMPTY_STATS };

  for (const item of statusCounts) {
    const count = item._count.status;
    if (item.status in stats) {
      stats[item.status as keyof Omit<JobStats, "total">] = count;
      stats.total += count;
    }
  }
  try {
    await redis.set(cacheKey, stats, { ex: 300 });
  } catch (redisWriteError) {
    console.error("[REDIS_WRITE_ERROR_STATS]:", redisWriteError);
  }

  return stats;
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
    await redis.del(`user_jobs_stats:${userId}`);
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

export async function saveJobToDatabase(jobData: JobAnalysisResult) {
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
        experienceLevel: jobData.experienceLevel || "Not Specified",
        summary: jobData.summary || "Not Specified",
        location: jobData.location || "Not Specified",
        salaryRange: jobData.salaryRange || "Not Specified",
        jobType: jobData.jobType || "Not Specified",
        userId,
      },
    });
    await redis.del(`user_jobs_stats:${userId}`);
    return { success: true, job: newJob };
  } catch (error) {
    console.error("Prisma Crash:", error);
    if (error instanceof AppError) {
      return {
        success: false,
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
      success: false,
      code: "INTERNAL" as const,
      error: "Failed to save job. Please try again.",
    };
  }
}