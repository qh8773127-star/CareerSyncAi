"use client";

import { useState } from "react";
import Link from "next/link";
import SignIn from "./SignIn";
import { signIn } from "../auth";

// Icons
const IconSparkles = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
    />
  </svg>
);

const IconSearch = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
  </svg>
);

const IconShield = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
  </svg>
);

const IconArrowRight = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h14m-7-7 7 7-7 7"
    />
  </svg>
);

const IconX = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 6 6 18M6 6l12 12"
    />
  </svg>
);

const IconGithub = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const IconGoogle = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const FEATURED_POSTS = [
  {
    slug: "how-we-built-rag-pipeline",
    category: "Architecture",
    title: "How we built a production-grade RAG pipeline",
    excerpt:
      "Combining pgvector, Cohere re-ranking, and Groq to eliminate hallucinations in career data.",
    date: "Nov 25, 2026",
    readTime: "6 min read",
  },
  {
    slug: "llm-evaluations",
    category: "AI Engineering",
    title: "Why LLM Evaluations matter more than Prompts",
    excerpt:
      "How we use LLM-as-a-Judge to benchmark retrieval accuracy and keep response quality above 90%.",
    date: "Nov 20, 2026",
    readTime: "5 min read",
  },
  {
    slug: "scaling-serverless-ai",
    category: "Infrastructure",
    title: "Handling background tasks in Next.js Serverless",
    excerpt:
      "Using after() and Langfuse observability to run asynchronous AI pipelines reliably on Vercel.",
    date: "Nov 15, 2026",
    readTime: "4 min read",
  },
];

export default function LandingPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
  
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              C
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CareerSync <span className="text-indigo-600">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#workflow"
              className="hover:text-slate-900 transition-colors"
            >
              How it Works
            </a>
            <Link
              href="/blog"
              className="hover:text-indigo-600 transition-colors font-semibold text-slate-800"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="md:hidden text-sm font-medium text-slate-700 px-3 py-2"
            >
              Blog
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative pt-20 pb-24 px-6 bg-white border-b border-slate-200/70">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wide mb-8">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Powered by Hybrid RAG Pipeline
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 mb-6 leading-[1.08]">
              Your Career Journey,{" "}
              <span className="block text-indigo-600 mt-1">
                Intelligent &amp; Clear.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Stop managing job hunts in messy spreadsheets. Extract role
              details automatically, track applications, and query an AI
              assistant grounded in your real career context.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                Get Started Free
                <IconArrowRight />
              </button>
              <Link
                href="/blog"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-900 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                Read Engineering Blog
              </Link>
            </div>
          </div>

          <div id="workflow" className="max-w-5xl mx-auto mt-16">
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-2 shadow-xl">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs text-slate-400 font-mono">
                  careersync.ai/dashboard — Agentic Workspace
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-4 p-6 bg-slate-950 rounded-b-xl text-left">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-mono text-indigo-400 mb-1">
                      USER PROMPT
                    </p>
                    <p className="text-sm text-slate-200">
                      &ldquo;Move my Senior Backend Engineer application at
                      Stripe to Technical Interview and summarize the required
                      stack.&rdquo;
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/50">
                    <p className="text-xs font-mono text-emerald-400 mb-1">
                      CAREERSYNC AGENT • VERIFIED
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Updated{" "}
                      <span className="text-white font-semibold">
                        Stripe — Senior Backend Engineer
                      </span>{" "}
                      status to{" "}
                      <span className="text-emerald-400 font-medium">
                        Technical Interview
                      </span>
                      . Key stack retrieved from JD: Go, Ruby, Distributed
                      Systems, and PostgreSQL.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Pipeline Snapshot
                    </p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-slate-300">
                        <span>Applied</span>
                        <span className="font-mono font-semibold text-white">
                          18
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Interviews</span>
                        <span className="font-mono font-semibold text-indigo-400">
                          05
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Offers</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          02
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-800 text-xs text-slate-400">
                    Retrieval Latency:{" "}
                    <span className="text-slate-200 font-mono">142ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Core Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Everything you need to run a structured job search
            </h2>
            <p className="text-slate-600 text-lg">
              Built with production AI infrastructure so your application data
              stays accurate, searchable, and actionable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="Agentic AI Chat"
              desc="Add, update, or filter job applications using natural language commands instead of manual form entry."
              icon={<IconSparkles className="w-6 h-6 text-indigo-600" />}
            />
            <FeatureCard
              title="Hybrid Search (RAG)"
              desc="Combines pgvector semantic embeddings with full-text keyword search and Cohere re-ranking for exact recall."
              icon={<IconSearch className="w-6 h-6 text-emerald-600" />}
            />
            <FeatureCard
              title="Zero Hallucinations"
              desc="Backed by Langfuse observability and automated LLM-as-a-Judge evaluations so answers stay strictly grounded."
              icon={<IconShield className="w-6 h-6 text-amber-600" />}
            />
          </div>
        </section>

        {/* LATEST FROM THE BLOG SECTION */}
        <section className="py-24 px-6 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                  From Our Blog
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Engineering &amp; Career Insights
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all articles <IconArrowRight />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURED_POSTS.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col justify-between p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 text-xs font-medium text-slate-500">
                    <span>{post.date}</span>
                    <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Read →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="text-base font-bold text-white">
              CareerSync AI
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CareerSync AI. All rights reserved.
          </p>
        </div>
      </footer>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <IconX />
            </button>

            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md text-white font-bold text-xl">
                C
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Welcome back
              </h2>
              <p className="text-slate-500 text-sm">
                Sign in to access your CareerSync dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-800 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                <IconGoogle /> Continue with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="grow border-t border-slate-200" />
                <span className="shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  Or
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                  <div className="relative w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-2xl">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      aria-label="Close modal"
                      className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                    >
                      <IconX />
                    </button>

                    <div className="text-center mb-8">
                      <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md text-white font-bold text-xl">
                        C
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        Welcome back
                      </h2>
                      <p className="text-slate-500 text-sm">
                        Sign in to access your CareerSync dashboard.
                      </p>
                    </div>

                    {/* Tumhara Server Action wala SignIn component */}
                    <SignIn />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
