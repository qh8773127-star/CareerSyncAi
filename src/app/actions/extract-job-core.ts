import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { jobAnalysisSchema, type JobAnalysisResult } from "../lib/validations";
import { DESCRIPTION_EXTRACTOR } from "../lib/ai/prompt";
import { startActiveObservation, startObservation } from "@langfuse/tracing";

export async function extractJobData(
  cleanJobDescription: string,
): Promise<JobAnalysisResult> {
  const result = await startActiveObservation(
    "extract-job-data",
    async (span): Promise<JobAnalysisResult> => {
      span.update({ input: { textLength: cleanJobDescription.length } });

      const generation = startObservation(
        "groq-job-extraction",
        {
          model: "openai/gpt-oss-120b",
          modelParameters: { temperature: 0, topP: 1 },
          input: cleanJobDescription,
        },
        { asType: "generation" },
      );

      try {
        const { text, usage } = await generateText({
          model: groq("openai/gpt-oss-120b"),
          temperature: 0,
          topP: 1,
          maxRetries: 3,
          prompt: `${DESCRIPTION_EXTRACTOR}\n\nSTRICT: Output ONLY raw JSON. NO markdown.\n\n${cleanJobDescription}`,
        });

        let parsedData: JobAnalysisResult | null = null;
        let parseStrategy: "direct_json" | "markdown_block" | "regex_fallback" =
          "direct_json";

        try {
          parsedData = jobAnalysisSchema.parse(JSON.parse(text));
        } catch {
          const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlock) {
            try {
              parsedData = jobAnalysisSchema.parse(JSON.parse(codeBlock[1]));
              parseStrategy = "markdown_block";
            } catch {}
          }

          if (!parsedData) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsedData = jobAnalysisSchema.parse(JSON.parse(jsonMatch[0]));
                parseStrategy = "regex_fallback";
              } catch {}
            }
          }
        }

        if (!parsedData) {
          const invalidError = new Error(
            `Invalid JSON from AI:\n${text.slice(0, 300)}`,
          );
          generation.update({
            level: "ERROR",
            statusMessage: "JSON/Zod validation failed",
            output: text,
            usageDetails: {
              input: usage?.inputTokens ?? 0,
              output: usage?.outputTokens ?? 0,
            },
          });
          generation.end();
          throw invalidError;
        }

        generation.update({
          output: parsedData,
          usageDetails: {
            input: usage?.inputTokens ?? 0,
            output: usage?.outputTokens ?? 0,
          },
          metadata: { parseStrategy },
        });
        generation.end();

        span.update({
          output: parsedData,
          metadata: { parseStrategy },
        });

        return parsedData;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Job extraction failed";
        generation.update({
          level: "ERROR",
          statusMessage: message,
        });
        generation.end();

        span.update({
          level: "ERROR",
          statusMessage: message,
        });
        throw error;
      }
    },
  );

  if (!result) {
    throw new Error("Extraction pipeline returned empty result.");
  }

  return result;
}