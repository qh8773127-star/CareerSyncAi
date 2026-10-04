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

async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user.id;
}

export async function createJob(formData: unknown) {
  try {
    const userId = await requireAuth();

    const validation = createJobSchema.safeParse(formData);

    if (!validation.success) {
      return {
        success: false,
        error: "Invalid job data",
      };
    }

    await prisma.job.create({
      data: {
        title: validation.data.title,
        company: validation.data.company,
        userId,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Create Job Error:", error);

    return {
      success: false,
      error: "Failed to create job",
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
