"use server";

import { createJobSchema } from "../lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";

export async function createJob(formData: unknown) {

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized access. Session not found." };
  }
 
  const validation = createJobSchema.safeParse(formData);

  if (!validation.success) {
    return { success: false, error: "Invalid data format" };
  }

  // 2. Database Insertion (Prisma)
  try {
 
   await prisma.job.create({
      data: {
        title: validation.data.title,
        company: validation.data.company,
        userId: session.user.id, // Hacker isay change nahi kar sakta!
      },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    // Error ab use ho raha hai (terminal mein print hoga)
    console.error("Database Error:", error); 
    return { success: false, error: "Database failed to create job" };
  }
}