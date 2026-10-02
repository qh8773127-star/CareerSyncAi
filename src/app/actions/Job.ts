"use server";

import { createJobSchema } from "../lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";

//createJOb
export async function createJob(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized access. Session not found." };
  }

  const validation = createJobSchema.safeParse(formData);

  if (!validation.success) {
    return { success: false, error: "Invalid data format" };
  }

  try {
    await prisma.job.create({
      data: {
        title: validation.data.title,
        company: validation.data.company,
        userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized request" };
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.userId !== session.user.id) {
      return { success: false, error: "Job not found or you lack ownership" };
    }

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
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized request" };
    }
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job || job.userId !== session.user.id) {
      return { success: false, error: "Job not found or you lack ownership" };
    } //IDOR (Insecure Direct Object Reference) Protection
    
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
