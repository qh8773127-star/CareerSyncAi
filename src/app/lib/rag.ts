import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
import { prisma } from "./prisma";
import { GetEmbedding } from "./constraints";
import { RetrievedJob } from "./constraints";
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

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

    const initialJobs = await prisma.$queryRaw<RetrievedJob[]>`
      WITH vector_search AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <-> ${formattedEmbedding}::vector) as rank_vector
        FROM "Job" 
        WHERE "userId" = ${userId} AND embedding IS NOT NULL 
        LIMIT 15
      ),
      keyword_search AS (
        SELECT id, ROW_NUMBER() OVER (
          ORDER BY ts_rank(
            to_tsvector('english', title || ' ' || company || ' ' || COALESCE(summary, '') || ' ' || COALESCE(array_to_string(skills, ' '), '')), 
            plainto_tsquery('english', ${query})
          ) DESC
        ) as rank_keyword
        FROM "Job" 
        WHERE "userId" = ${userId} 
          AND to_tsvector('english', title || ' ' || company || ' ' || COALESCE(summary, '') || ' ' || COALESCE(array_to_string(skills, ' '), '')) @@ plainto_tsquery('english', ${query}) 
        LIMIT 15
      )
      SELECT j.id, j.title, j.company, j.summary, j.skills,
        COALESCE(1.0 / (60 + v.rank_vector), 0.0) + COALESCE(1.0 / (60 + k.rank_keyword), 0.0) AS similarity
      FROM "Job" j
      LEFT JOIN vector_search v ON j.id = v.id
      LEFT JOIN keyword_search k ON k.id = j.id
      WHERE v.id IS NOT NULL OR k.id IS NOT NULL
      ORDER BY similarity DESC 
      LIMIT 15;
    `;

    if (initialJobs.length === 0) return [];
    if (!process.env.COHERE_API_KEY) {
      return initialJobs.slice(0, 3);
    }

    try {
      const documentsToRerank = initialJobs.map(
        (job) =>
          `Title: ${job.title}\nCompany: ${job.company}\nSkills: ${job.skills?.join(", ") || "None"}\nSummary: ${job.summary || ""}`,
      );

      const rerankResponse = await cohere.rerank({
        model: "rerank-v3.5",
        query: query,
        documents: documentsToRerank,
        topN: 3,
      });

      const finalJobs = rerankResponse.results
        .filter((result) => result.relevanceScore >= 0.15)
        .map((result) => ({
          ...initialJobs[result.index],
          similarity: result.relevanceScore,
        }));

      return finalJobs;
    } catch (rerankError) {
      console.warn(
        "⚠️ Cohere rerank failed, falling back to RRF results:",
        rerankError instanceof Error ? rerankError.message : "Unknown error",
      );
      return initialJobs.slice(0, 3);
    }
  } catch (error: unknown) {
    console.error(
      "❌ Error retrieving relevant jobs:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}
