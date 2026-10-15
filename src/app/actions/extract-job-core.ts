import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { jobAnalysisSchema, type JobAnalysisResult } from "../lib/validations";
import { DESCRIPTION_EXTRACTOR } from "../lib/prompt";

export async function extractJobData(
  cleanJobDescription: string,
): Promise<JobAnalysisResult> {
  const { text } = await generateText({
    model: groq("openai/gpt-oss-120b"), 
    temperature: 0,
    topP: 1,
    maxRetries: 3,
    prompt: `${DESCRIPTION_EXTRACTOR}\n\nSTRICT: Output ONLY raw JSON. NO markdown.\n\n${cleanJobDescription}`,
  });

  try {
    return jobAnalysisSchema.parse(JSON.parse(text));
  } catch {}

  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlock) {
    try {
      return jobAnalysisSchema.parse(JSON.parse(codeBlock[1]));
    } catch {}
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return jobAnalysisSchema.parse(JSON.parse(jsonMatch[0]));
    } catch {}
  }

  throw new Error(`Invalid JSON from AI:\n${text.slice(0, 300)}`);
}