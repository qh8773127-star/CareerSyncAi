# CareerSync AI

An AI-powered job tracker with a personal career coach. Built with Next.js, Prisma, and Groq.

![Dashboard](./screenshots/dashboard.png)
![AI Coach](./screenshots/coach.png)

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

## 🚀 Status

**In development.** MVP shipping soon.

Follow progress on [LinkedIn](https://www.linkedin.com/in/ali-haider-17015734a/).

---

## 📸 Screenshots

Coming soon.

---

## 🔗 Links

- [GitHub] (https://github.com/qh8773127-star?tab=repositories)
- [LinkedIn](https://www.linkedin.com/in/ali-haider-17015734a/)
