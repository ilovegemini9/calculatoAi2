# Professional Calculator Platform

A full-stack calculator platform with AI-powered article generation, keyword research, and an admin panel.

## Architecture

- **Frontend** (`artifacts/calculator-platform/`): Next.js 15 app — public-facing calculator pages, article pages, and admin panel
- **API Server** (`artifacts/api-server/`): Express + TypeScript backend — REST API, session auth, Prisma ORM
- **Database** (`lib/db/`): Drizzle schema for app state; Prisma schema for users, sessions, calculators, articles, analytics
- **Shared libs** (`lib/`): `@workspace/db` (Drizzle), `@workspace/api-spec`, `@workspace/api-zod`, `@workspace/api-client-react`

## How to Run

Both services start automatically via the configured workflows:

- **API Server** — `PORT=8080 pnpm --filter @workspace/api-server run dev` (builds with esbuild, then starts)
- **Frontend** — `PORT=23007 BASE_PATH=/ pnpm --filter @workspace/calculator-platform run dev`

## Required Environment Variables

| Variable | Where | Notes |
|---|---|---|
| `SESSION_SECRET` | Secret | Session signing key (already set) |
| `ADMIN_PASSWORD` | Secret | Admin panel login password (already set) |
| `ADMIN_USERNAME` | Env var (shared) | Defaults to `admin` |
| `BASE_PATH` | Env var (shared) | Set to `/` |
| `DATABASE_URL` | Runtime-managed | Provided automatically by Replit |

## Optional Environment Variables

| Variable | Notes |
|---|---|
| `OPENROUTER_API_KEY` | Enables AI article generation and keyword scoring |
| `SERPAPI_API_KEY` | Enables live search research for keyword suggestions |
| `APP_URL` | Canonical public origin (for sitemap and robots.txt) |

## Database Setup

The project uses two database layers:

1. **Drizzle** (`lib/db`) — `app_state` and `app_state_backups` tables (JSON blob store for app state)
2. **Prisma** (`prisma/`) — full relational schema (users, sessions, calculators, articles, analytics, etc.)

To re-apply schema from scratch:
```bash
# Drizzle tables
pnpm --filter @workspace/db run push

# Prisma client generation
pnpm exec prisma generate

# Prisma schema (first time baseline)
psql $DATABASE_URL -f prisma/migrations/20260725161112_init/migration.sql
pnpm exec prisma migrate resolve --applied 20260725161112_init
```

## Admin Panel

Visit `/admin` to access the admin panel. Login with:
- **Username**: value of `ADMIN_USERNAME` env var (default: `admin`)
- **Password**: value of `ADMIN_PASSWORD` secret

## User Preferences

- Keep the project's existing monorepo structure (pnpm workspaces)
- Do not restructure or migrate the stack unless explicitly asked
