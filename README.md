# SyncBoard

Production-oriented real-time collaborative workspace (foundation milestone).

## Technology stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod
- **Backend:** NestJS, PostgreSQL, Prisma
- **Tooling:** pnpm workspaces, Docker Compose, ESLint, Prettier, Vitest, Jest, Playwright

## Architecture overview

Monorepo with `apps/web`, `apps/api`, `packages/shared`, and Dockerized PostgreSQL. See [docs/architecture/overview.md](docs/architecture/overview.md).

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

## Installation

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Build shared types (required before API/web production builds):

```bash
pnpm --filter @syncboard/shared build
```

## Environment configuration

| Variable | App | Description |
| --- | --- | --- |
| `DATABASE_URL` | API | PostgreSQL connection string |
| `PORT` | API | API port (default `3001`) |
| `API_CORS_ORIGIN` | API | Allowed browser origin (must match web origin for cookies) |
| `JWT_ACCESS_SECRET` | API | Secret for signing access JWTs (long random string) |
| `JWT_ACCESS_EXPIRES_IN` | API | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_DAYS` | API | Refresh session lifetime in days |
| `REFRESH_COOKIE_NAME` | API | HttpOnly refresh cookie name (default `syncboard_refresh`) |
| `NEXT_PUBLIC_API_URL` | Web | Public API base URL |
| `POSTGRES_*` | Docker | Database credentials |

Never expose server-only variables to the frontend.

## Docker setup

```bash
pnpm db:up
pnpm db:migrate
```

## Local development quick start

From the repo root, on a clean machine:

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm --filter @syncboard/shared build   # once after install or shared type changes
pnpm dev                                # web http://localhost:3000 + API http://localhost:3001
```

Open [http://localhost:3000](http://localhost:3000) (dashboard; sign in at `/login` or register at `/register`).

Ensure `apps/api/.env` includes `JWT_ACCESS_SECRET` (see `apps/api/.env.example`).

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Web `:3000` + API `:3001` |
| `pnpm --filter @syncboard/web dev` | Web only |
| `pnpm --filter @syncboard/api dev` | API only (Nest build + watch) |
| `pnpm db:up` / `pnpm db:down` | Start or stop Postgres container |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm build` | Production build (all packages) |
| `pnpm lint` | ESLint (all packages) |
| `pnpm typecheck` | TypeScript (all packages) |
| `pnpm test` | Unit tests (api + web) |
| `pnpm test:e2e` | Playwright smoke test (web) |

API health check:

```bash
curl http://localhost:3001/api/v1/health
```

## Troubleshooting

### UI has no styles (CSS 404)

Usually a **stale Next.js dev server** on port `3000` serving HTML that points at missing `/_next/static/css/...` assets.

```bash
# macOS: stop whatever is listening on 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

rm -rf apps/web/.next
pnpm --filter @syncboard/web dev
```

Hard-refresh the browser (Cmd+Shift+R). If you use `pnpm dev` instead, stop that process first, clear `.next`, then start again.

### Port already in use

```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null || true   # web
lsof -ti :3001 | xargs kill -9 2>/dev/null || true   # API
```

### API / database

- Postgres must be running: `pnpm db:up` then `pnpm db:migrate`.
- Auth and health need the API up; check `curl http://localhost:3001/api/v1/health`.

## Authentication (Milestone 2)

Registration and login use **JWT access tokens** (Bearer, in-memory in the browser) plus **HttpOnly refresh cookies** with server-side session rotation. See [docs/architecture/authentication.md](docs/architecture/authentication.md).

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | JSON body: `name`, `email`, `password` |
| `POST` | `/api/v1/auth/login` | JSON body: `email`, `password` |
| `POST` | `/api/v1/auth/refresh` | Requires refresh cookie (`credentials` from browser) |
| `POST` | `/api/v1/auth/logout` | Bearer access token + refresh cookie |
| `GET` | `/api/v1/auth/me` | Bearer access token |

Development flow:

1. Start Postgres (`pnpm db:up`) and apply migrations (`pnpm db:migrate`).
2. Set `JWT_ACCESS_SECRET` in `apps/api/.env`.
3. Run `pnpm dev`, open `http://localhost:3000/register` or `/login`.
4. Dashboard (`/`) is protected; unauthenticated users are redirected to `/login`.

Cookie path is scoped to `/api/v1/auth`; the web client calls the API with `credentials: 'include'`.

Database integration test (optional):

```bash
RUN_DB_INTEGRATION=true pnpm --filter @syncboard/api test:integration:db
RUN_DB_INTEGRATION=true pnpm --filter @syncboard/api test:e2e   # includes auth flows
```

## Testing commands

```bash
pnpm test
pnpm --filter @syncboard/web test
pnpm --filter @syncboard/api test
pnpm --filter @syncboard/api test:e2e
```

## Project status

See [PROJECT_STATE.md](PROJECT_STATE.md) for milestone tracking.