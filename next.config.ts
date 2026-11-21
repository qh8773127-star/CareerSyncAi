import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    "ai",
    "@langfuse/otel",
    "@langfuse/tracing",
    "@opentelemetry/api",
    "@opentelemetry/sdk-trace-node",
  ],
};

export default nextConfig;