# WebAngle

Developer-first outreach intelligence: paste a website URL, get a fast teardown with actionable pitch angles for cold outreach.

## Monorepo

- **apps/web** — React + Vite UI with Clerk auth; routes: Websites, Analyze, How it works
- **apps/api** — Node API with auth: `POST /analyze`, `GET /websites`, `DELETE /websites`, `GET /analyze?url=`
- **packages/types** — Shared TypeScript types and response schema
- **packages/scraper** — Fetch + Cheerio (contact, meta, scripts, CTAs)
- **packages/analyzer** — Tech detection, PageSpeed, site classification
- **packages/ai** — OpenAI prompt + client for upgrade opportunities

## Setup

```bash
pnpm install
```

## Environment

- **API**: set `OPENAI_API_KEY` for AI-generated pitch angles.
- **API**: set `DATABASE_URL` for Prisma (default: `file:./data/cache.db` in `apps/api/.env`).
- **API**: set `CLERK_SECRET_KEY` for auth (create app at [dashboard.clerk.com](https://dashboard.clerk.com)).
- **Web**: set `VITE_CLERK_PUBLISHABLE_KEY` in `apps/web/.env` (copy from `.env.example`).
- Optional: `PORT` (default `3001`) for the API.

## Database (Prisma + SQLite)

The API uses **Prisma** with **SQLite** to cache analysis results. Schema and migrations live in `apps/api/prisma/`.

- **Apply migrations** (e.g. after clone or before first run):  
  `cd apps/api && pnpm db:migrate`
- **Create a new migration** after editing `prisma/schema.prisma`:  
  `cd apps/api && pnpm db:migrate:dev`
- **Regenerate Prisma Client** (after schema change):  
  `cd apps/api && pnpm db:generate`

## Run

```bash
# API (from repo root)
pnpm dev:api

# Web (separate terminal)
pnpm dev:web
```

- Web: http://localhost:5173 — sign in required; routes: `/websites`, `/analyze`, `/how-it-works` (public)
- API: http://localhost:3001 — all endpoints require `Authorization: Bearer <Clerk session token>`

## Build

```bash
pnpm build
```

## Success criteria (MVP)

- Paste a URL → credible teardown in &lt;10 seconds
- Copy a pitch angle into a cold email or DM
- Output is specific, not generic or spammy
