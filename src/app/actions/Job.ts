"use server";

import { createJobSchema } from "../lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";

//Authentication
async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized Action: User is not explicitly logged in.");
  }
  return session.user.id;
}

async function verifyJobOwnership(jobId: string) {
  const userId = await requireAuth();

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { userId: true }, // Performance optimization
  });

  if (!job) {
    throw new Error("Action Failed: Job does not exist.");
  }

  if (job.userId !== userId) {
    throw new Error("Security Alert: Unauthorized IDOR manipulation blocked.");
  }

  return userId;
}

//createJOb
export async function createJob(formData: unknown) {
  const userId = await requireAuth();

  const validation = createJobSchema.safeParse(formData);

  if (!validation.success) {
    return { success: false, error: "Invalid data format" };
  }

  try {
    await prisma.job.create({
      data: {
        title: validation.data.title,
        company: validation.data.company,
        userId: userId,
      },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Database failed to create job" };
  }
}

//DeleteJOb
export async function deleteJob(jobId: string) {
  try {
    await verifyJobOwnership(jobId);

    await prisma.job.delete({
      where: { id: jobId },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete Engine Crash:", error);
    return { success: false, error: "System failed to delete job" };
  }
}

//UpdateJObStatus
export async function UpdateJObStatus(
  jobId: string,
  newStatus: "PENDING" | "INTERVIEW" | "REJECTED" | "HIRED",
) {
  try {
    await verifyJobOwnership(jobId);

    await prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update Engine Crash:", error);
    return { success: false, error: "System failed to update status" };
  }
}

//StatusOfJOb
export async function getJobStats() {
  try {
    const userId = await requireAuth();

    const statusCounts = await prisma.job.groupBy({
      by: ["status"],
      where: {
        userId: userId,
      },
      _count: {
        status: true, //for count the objects
      },
    });

    const stats = {
      total: 0,
      PENDING: 0,
      INTERVIEW: 0,
      REJECTED: 0,
      HIRED: 0,
    };

    statusCounts.forEach((item) => {
      const count = item._count.status;
      stats[item.status as keyof typeof stats] = count;
      stats.total += count;
    });

    return stats;
  } catch (error) {
    console.error("Stats Engine Crash:", error);
    return {
      total: 0,
      PENDING: 0,
      INTERVIEW: 0,
      REJECTED: 0,
      HIRED: 0,
    };
  }
}
