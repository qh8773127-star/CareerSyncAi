import Link from "next/link";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="font-bold text-slate-900">CareerSync AI</span>
          </Link>
          <Link
            href="/blog"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← All Articles
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto py-16 px-6">
        <div className="mb-10 pb-8 border-b border-slate-200">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wide mb-4">
            Engineering Deep Dive
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 mb-5 leading-tight tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              AH
            </div>
            <div>
              <p className="font-semibold text-slate-900">Ali Haider</p>
              <p className="text-xs text-slate-500">Published Nov 25, 2026 • 6 min read</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 text-slate-700 text-lg leading-relaxed">
          <p className="text-xl text-slate-800 font-medium">
            Building reliable AI systems requires moving beyond simple prompt wrappers into measurable retrieval and evaluation pipelines.
          </p>
          <p>
            By implementing a Hybrid Search architecture combining PostgreSQL (<code className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-indigo-600">pgvector</code>) and Cohere re-ranking, we achieved a 90% pass rate on our automated Eval Harness.
          </p>
          <h2 className="text-2xl font-bold text-slate-950 pt-6">
            The System Architecture
          </h2>
          <p>
            We built the frontend with Next.js App Router to handle low-latency token streaming, while serverless background workers orchestrate embedding generation and Langfuse trace logging without blocking user responses.
          </p>
        </div>
      </article>
    </div>
  );
}