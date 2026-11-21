import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { trace, context, propagation } from "@opentelemetry/api";

const globalForLangfuse = globalThis as unknown as {
  langfuseSpanProcessor?: LangfuseSpanProcessor;
  otelRegistered?: boolean;
};

export const langfuseSpanProcessor =
  globalForLangfuse.langfuseSpanProcessor ??
  new LangfuseSpanProcessor({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
    exportMode: "immediate",
  });

if (!globalForLangfuse.otelRegistered) {
  trace.disable();
  context.disable();
  propagation.disable();

  const provider = new NodeTracerProvider({
    spanProcessors: [langfuseSpanProcessor],
  });

  provider.register();

  globalForLangfuse.langfuseSpanProcessor = langfuseSpanProcessor;
  globalForLangfuse.otelRegistered = true;
}