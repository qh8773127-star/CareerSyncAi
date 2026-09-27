"use server";

// 1. Correct Import: apni custom singleton file se la rahe hain, npm package se nahi!
import { prisma } from "../lib/prisma"; 
import { createJobSchema } from "../lib/validations";

export async function createJob(data: unknown) {
  // 1. Zod Validation (Guard)
  const validatedData = createJobSchema.safeParse(data);

  if (!validatedData.success) {
    return { success: false, error: "Invalid data format" };
  }

  // 2. Database Insertion (Prisma)
  try {
    // Model ka naam lowercase 'job' hoga
    const newJob = await prisma.job.create({
      data: validatedData.data,
    });
    return { success: true, job: newJob };
  } catch (error) {
    // Error ab use ho raha hai (terminal mein print hoga)
    console.error("Database Error:", error); 
    return { success: false, error: "Database failed to create job" };
  }
}