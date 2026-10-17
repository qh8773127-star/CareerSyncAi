# CareerSync AI

An AI-powered job tracker with a personal career coach. Built with Next.js, Prisma, and Groq.

---

## ✨ Features

- **Agentic CRUD via Tool Calling** — Add, update, read, or delete job applications using natural language. The AI handles database mutations safely with strict Zod schemas and confirmation steps for destructive actions.
- **AI Job Extraction** — Extract role, company, skills, and salary from raw job descriptions into structured JSON.
- **AI Career Coach** — Streaming chat for resume review, interview prep, and career advice (with full context of the user's tracked jobs).
- **Application Tracking** — Track jobs through PENDING → INTERVIEW → REJECTED → HIRED.
- **Automated Evals** — Custom evaluation harness for structured LLM outputs with flakiness detection.
- **OAuth Authentication** — Sign in with Google/GitHub via NextAuth.
- **Rate Limiting** — Abuse prevention on every AI endpoint (Upstash Redis).
- **Production-Ready** — Zod validation, structured error codes, race condition prevention, and safe AI tool execution.

---

## 🛠 Tech Stack

**Frontend**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS

**Backend**
- Prisma ORM
- PostgreSQL (Neon)
- NextAuth (OAuth + sessions)

**AI & LLM**
- Vercel AI SDK (Streaming & Tool Calling)
- Groq (gpt-oss-20b for extraction, gpt-oss-120b for chat)
- Zod schemas for structured output & tool input validation

**Infrastructure**
- Upstash Redis (rate limiting)
- Vercel (deployment)

---

## 🧪 Evals

CareerSync includes an automated eval harness for the AI job extractor to prevent prompt regressions.

**Current score: 93.3%** (28/30 runs passed — 8 stable, 2 flaky, 0 errors)

**Why:** LLMs are non-deterministic. Prompt tweaks, model swaps, and temperature changes can silently break extraction. Evals catch this before shipping.

**How it works:**
1. **Golden set** — 10 job descriptions, each with manually verified expected JSON output.
2. **Runner** — Extracts each JD via AI, compares output field-by-field.
3. **Normalization** — Case, whitespace, plural, and alias tolerance (e.g., "REST APIs" → "REST API", "GCP" → "Google Cloud Platform").
4. **Flakiness detection** — Runs each case 3 times, flags unstable outputs.
5. **CI gate** — 80% pass rate + 0 flaky cases required.

**Run it:**
```bash
npm run eval