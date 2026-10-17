import { prisma } from "../prisma";
import { requireAuth } from "@/app/actions/Job";

export async function getJobsContext() {
  try {
    const userId=await requireAuth();
    const jobsData = await prisma.job.findMany({
      where: { userId },
      select: { title: true, company: true, status: true },
    });

    if (jobsData.length === 0) {
      return "User has not tracked any jobs yet.";
    }

    return jobsData
      .map(
        (data) =>
          `[${data.title}] at [${data.company}] (Status: ${data.status})`,
      )
      .join("\n");
  } catch {
    return "User context unavailable.";
  }
}

