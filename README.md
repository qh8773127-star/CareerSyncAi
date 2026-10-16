# CareerSync AI

An AI-powered job tracker with a personal career coach. Built with Next.js, Prisma, and Groq.



---

## ✨ Features

- **AI Job Extraction** — Extract role, company, skills, and salary from raw job descriptions
- **AI Career Coach** — Streaming chat for resume review, interview prep, and career advice
- **Application Tracking** — Track jobs through PENDING → INTERVIEW → REJECTED → HIRED
- **OAuth Authentication** — Sign in with Google/GitHub via NextAuth
- **Rate Limiting** — Abuse prevention on every AI endpoint (Upstash Redis)
- **Production-Ready** — Zod validation, structured error codes, race condition prevention

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

**AI**

- Vercel AI SDK
- Groq (gpt-oss-20b for extraction, gpt-oss-120b for chat)
- Zod schemas for structured output

**Infrastructure**

- Upstash Redis (rate limiting)
- Vercel (deployment)

---

## 🧪 Evals

CareerSync includes an automated eval harness for the AI job extractor.

**Current score: 93.3%** (28/30 runs passed — 8 stable, 2 flaky, 0 errors)

**Why:** LLMs are non-deterministic. Prompt tweaks, model swaps, and 
temperature changes can silently break extraction. Evals catch this 
before shipping.

**How it works:**

1. **Golden set** — 10 job descriptions, each with manually verified 
   expected JSON output
2. **Runner** — extracts each JD via AI, compares output field-by-field
3. **Normalization** — case, whitespace, plural, and alias tolerance 
   (e.g., "REST APIs" → "REST API", "GCP" → "Google Cloud Platform")
4. **Flakiness detection** — runs each case 3 times, flags unstable 
   outputs
5. **CI gate** — 80% pass rate + 0 flaky cases required

**Run it:**
npm run eval

##  Status

**In development.** MVP shipping soon.

Follow progress on [LinkedIn](https://www.linkedin.com/in/ali-haider-17015734a/).

---

## 📸 Screenshots

![Dashboard](./screenshots/dashboard.png)
![AI Coach](./screenshots/coach.png)

---

## 🔗 Links

- [GitHub] (https://github.com/qh8773127-star?tab=repositories)
- [LinkedIn](https://www.linkedin.com/in/ali-haider-17015734a/)
```
