import Link from "next/link";

const BLOG_POSTS = [
  {
    slug: "how-we-built-rag-pipeline",
    category: "Architecture",
    title: "How we built a production-grade RAG pipeline",
    excerpt: "Learn how we combined pgvector, Cohere re-ranking, and Groq to build an AI that never hallucinates.",
    date: "Nov 25, 2026",
    readTime: "6 min read",
    author: "Ali Haider",
  },
  {
    slug: "llm-evaluations",
    category: "AI Engineering",
    title: "Why LLM Evaluations matter more than Prompts",
    excerpt: "Prompt engineering is dead. Discover how we use LLM-as-a-Judge to score our AI with a 90% accuracy rate.",
    date: "Nov 20, 2026",
    readTime: "5 min read",
    author: "Ali Haider",
  },
  {
    slug: "scaling-serverless-ai",
    category: "Infrastructure",
    title: "Handling background tasks in Next.js Serverless",
    excerpt: "Vercel kills your functions. Here is how we used after() and Langfuse to handle long-running AI tasks.",
    date: "Nov 15, 2026",
    readTime: "4 min read",
    author: "Ali Haider",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CareerSync <span className="text-indigo-600">AI</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-16 px-6">
        <div className="border-b border-slate-200 pb-10 mb-12">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">
            Engineering &amp; Product
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            The CareerSync Blog
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Deep dives into RAG architecture, LLM evaluation harnesses, and building reliable AI products.
          </p>
        </div>

        <div className="grid gap-6">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                    {post.category}
                  </span>
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">By {post.author}</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-600 leading-relaxed mb-5">{post.excerpt}</p>

                <div className="inline-flex items-center text-indigo-600 font-semibold text-sm">
                  Read Article
                  <span className="ml-1.5 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}