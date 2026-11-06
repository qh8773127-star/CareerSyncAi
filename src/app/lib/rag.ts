import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
import { prisma } from "./prisma";
import { GetEmbedding } from "./constraints";
import { RetrievedJob } from "./constraints";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function generateAndSaveEmbedding({
  jobId,
  title,
  company,
  summary,
  skills,
}: GetEmbedding) {
  try {
    const textToEmbed = `Job Title: ${title}\nCompany: ${company}\nSummary: ${summary}\nSkills: ${skills.join(", ")}`;

    const { embedding } = await embed({
      model: google.textEmbeddingModel("gemini-embedding-001"),
      value: textToEmbed,
      providerOptions: {
        google: {
          outputDimensionality: 1536,
        },
      },
    });

    const formattedEmbedding = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      UPDATE "Job"
      SET embedding = ${formattedEmbedding}::vector
      WHERE id = ${jobId}
    `;
  } catch (error: unknown) {
    console.error(
      "❌ Failed to generate embedding:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
export async function retrieveRelevantJobs(userId: string, query: string) {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel("gemini-embedding-001"),
      value: query,
      providerOptions: {
        google: { outputDimensionality: 1536 },
      },
    });

    const formattedEmbedding = `[${embedding.join(",")}]`;
    const relevantJobs = await prisma.$queryRaw<RetrievedJob[]>`
      SELECT 
        id, 
        title, 
        company, 
        summary, 
        skills,
        1 - (embedding <-> ${formattedEmbedding}::vector) AS similarity
      FROM "Job"
      WHERE "userId" = ${userId} 
        AND embedding IS NOT NULL
      ORDER BY embedding <-> ${formattedEmbedding}::vector
      LIMIT 3;
    `;

    return relevantJobs;
  } catch (error: unknown) {
    console.error(
      "❌ Error retrieving relevant jobs:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}
