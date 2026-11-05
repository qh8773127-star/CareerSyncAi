import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
import { prisma } from "./prisma";
import { GetEmbedding } from "./constraints";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function generateAndSaveEmbedding({ jobId, title, company, summary, skills }: GetEmbedding) {
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
    console.log(`✅ Embedding saved for Job ID: ${jobId}`);
  } catch (error) {
    console.error("❌ Failed to generate embedding:", error);
  }
}
