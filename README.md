# SEO Audit MVP (Lean Scaffold)

A minimal Next.js app that:
- Takes a URL + optional keywords
- Runs a basic on-page audit on the server (cheerio)
- Suggests topics from your keywords (bootstrap placeholder)
- Generates simple blog/service drafts (stub or OpenAI if you add an API key)

## Quickstart
1) **Install:** `npm install`
2) **Run dev:** `npm run dev` → http://localhost:3000
3) **(Optional) AI drafts:** copy `.env.local.example` → `.env.local` and set `OPENAI_API_KEY`.

## Stack
- Next.js (App Router), React 18
- API routes: `/api/run-audit`, `/api/generate`
- Tailwind for styles
- Cheerio for HTML parsing
- Zod for simple validation

## Notes
- This is a proof-of-concept scaffold. It avoids expensive SEO APIs.
- The audit checks title/meta/H1/robots/schema/alt text presence.
- Topic suggestions are placeholders derived from your keywords.

## Deploy
- Vercel works out-of-the-box.
