import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
import { prisma } from "./prisma";
import { GetEmbedding, RetrievedJob } from "./constraints";
import { CohereClient } from "cohere-ai";
import { startActiveObservation } from "@langfuse/tracing";

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
}: GetEmbedding): Promise<void> {
  if (!jobId || !title?.trim()) {
    return;
  }

  try {
    const formattedSkills = skills?.length ? skills.join(", ") : "None";
    const textToEmbed = `Job Title: ${title.trim()}\nCompany: ${company?.trim() || "Unknown"}\nSummary: ${summary?.trim() || "N/A"}\nSkills: ${formattedSkills}`;

    const { embedding } = await embed({
      model: google.textEmbeddingModel("gemini-embedding-001"),
      value: textToEmbed,
      providerOptions: {
        google: {
          outputDimensionality: 1536,
        },
      },
    });

    if (!embedding || embedding.length === 0) {
      return;
    }

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

export async function retrieveRelevantJobs(
  userId: string,
  query: string,
): Promise<RetrievedJob[]> {
  const cleanQuery = query?.trim();
  if (!userId || !cleanQuery) {
    return [];
  }

  const jobs = await startActiveObservation(
    "hybrid-rerank-retrieval",
    async (span): Promise<RetrievedJob[]> => {
      try {
        const { embedding } = await embed({
          model: google.textEmbeddingModel("gemini-embedding-001"),
          value: cleanQuery,
          providerOptions: { google: { outputDimensionality: 1536 } },
          experimental_telemetry: {
            isEnabled: true,
            functionId: "rag-query-embedding",
          },
        });

        if (!embedding || embedding.length === 0) {
          span.update({
            level: "WARNING",
            statusMessage: "Empty embedding returned",
            input: { query: cleanQuery },
            output: [],
          });
          return [];
        }

        const formattedEmbedding = `[${embedding.join(",")}]`;

        const initialJobs = await prisma.$queryRaw<RetrievedJob[]>`
          WITH parsed_query AS (
            SELECT regexp_replace(plainto_tsquery('english', ${cleanQuery})::text, '&', '|', 'g') AS ts_q
          ),
          vector_search AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <-> ${formattedEmbedding}::vector) AS rank_vector
            FROM "Job" 
            WHERE "userId" = ${userId} AND embedding IS NOT NULL 
            LIMIT 15
          ),
          keyword_search AS (
            SELECT j.id, ROW_NUMBER() OVER (
              ORDER BY ts_rank(
                to_tsvector('english', j.title || ' ' || j.company || ' ' || COALESCE(j.summary, '') || ' ' || COALESCE(array_to_string(j.skills, ' '), '')), 
                to_tsquery('english', pq.ts_q)
              ) DESC
            ) AS rank_keyword
            FROM "Job" j
            CROSS JOIN parsed_query pq
            WHERE j."userId" = ${userId}
              AND pq.ts_q <> ''
              AND to_tsvector('english', j.title || ' ' || j.company || ' ' || COALESCE(j.summary, '') || ' ' || COALESCE(array_to_string(j.skills, ' '), '')) 
              @@ to_tsquery('english', pq.ts_q)
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

        if (initialJobs.length === 0) {
          span.update({
            input: { query: cleanQuery },
            output: [],
            metadata: { initialJobsFound: 0, rerankUsed: false },
          });
          return [];
        }

        if (!process.env.COHERE_API_KEY) {
          const fallback = initialJobs.slice(0, 3);
          span.update({
            input: { query: cleanQuery },
            output: fallback.map((j) => ({
              id: j.id,
              title: j.title,
              company: j.company,
              similarity: j.similarity,
            })),
            metadata: {
              initialJobsFound: initialJobs.length,
              rerankUsed: false,
            },
          });
          return fallback;
        }

        try {
          const documentsToRerank = initialJobs.map(
            (job) =>
              `Title: ${job.title}\nCompany: ${job.company}\nSkills: ${job.skills?.length ? job.skills.join(", ") : "None"}\nSummary: ${job.summary || ""}`,
          );

          const rerankResponse = await cohere.rerank({
            model: "rerank-v3.5",
            query: cleanQuery,
            documents: documentsToRerank,
            topN: Math.min(3, documentsToRerank.length),
          });

          const finalJobs = rerankResponse.results
            .filter(
              (result) =>
                result.relevanceScore >= 0.05 &&
                Boolean(initialJobs[result.index]),
            )
            .map((result) => ({
              ...initialJobs[result.index],
              similarity: result.relevanceScore,
            }));

          span.update({
            input: { query: cleanQuery },
            output: finalJobs.map((j) => ({
              id: j.id,
              title: j.title,
              company: j.company,
              similarity: j.similarity,
            })),
            metadata: {
              initialJobsFound: initialJobs.length,
              rerankUsed: true,
              topRerankScore: finalJobs[0]?.similarity ?? 0,
            },
          });

          return finalJobs;
        } catch (rerankError) {
          const fallback = initialJobs.slice(0, 3);
          span.update({
            level: "WARNING",
            statusMessage:
              rerankError instanceof Error
                ? rerankError.message
                : "Cohere failed",
            input: { query: cleanQuery },
            output: fallback.map((j) => ({
              id: j.id,
              title: j.title,
              company: j.company,
              similarity: j.similarity,
            })),
            metadata: {
              initialJobsFound: initialJobs.length,
              rerankUsed: false,
              rerankError: true,
            },
          });
          return fallback;
        }
      } catch (error: unknown) {
        span.update({
          level: "ERROR",
          statusMessage:
            error instanceof Error ? error.message : "RAG Pipeline failed",
        });
        console.error(
          "❌ Error retrieving relevant jobs:",
          error instanceof Error ? error.message : "Unknown error",
        );
        return [];
      }
    },
    { asType: "retriever" },
  );

  return jobs ?? [];
}
