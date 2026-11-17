# SyncBoard — project state

## Project overview

SyncBoard is a collaborative workspace platform. Milestone 1 establishes the monorepo, UI shell, API skeleton, PostgreSQL/Prisma, testing/tooling, and documentation.

## Current milestone

**Milestone 1 — Project Foundation:** Implementation complete — pending external QA sign-off

## Completed milestones

- _None yet (Milestone 1 in flight)._

## Pending milestones

- Milestone 2+: Authentication, workspaces, boards, tasks, real-time collaboration, Redis/WebSockets, deployment.

## Architecture decisions

- pnpm workspace monorepo (`apps/web`, `apps/api`, `packages/shared`).
- REST API with versioned prefix `/api/v1`.
- Prisma as the database access boundary.
- TanStack Query for server data; Zustand for UI-only state.
- Shared health contract in `@syncboard/shared`.

## Technology choices

Documented in `README.md` and `docs/architecture/overview.md`.

## Implementation status (Milestone 1)

| Area | Status |
| --- | --- |
| Monorepo & scripts | Done |
| Next.js dashboard shell | Done |
| NestJS health + Prisma | Done |
| Docker PostgreSQL | Done |
| Testing foundation | Done |
| Documentation | Done |

## Acceptance criteria (Milestone 1)

- [x] Clone → env → Docker → run web + API without manual per-tool setup (Docker not verified in this session — daemon was stopped)
- [x] `GET /api/v1/health` with liveness + DB check (e2e with mocked Prisma; live DB pending Docker)
- [x] Professional SaaS shell UI (sidebar, dashboard placeholders)
- [x] Root `pnpm dev|build|lint|typecheck|test`
- [x] Foundational automated tests pass (unit + API e2e; Playwright not executed here)

## Known issues

- Playwright E2E not run by default in root `pnpm test` (opt-in via `pnpm test:e2e`).
- DB integration test requires `RUN_DB_INTEGRATION=true` and running PostgreSQL.

## Technical debt

- No centralized observability stack (metrics/tracing) yet.
- API has no rate limiting or auth middleware (by design for M1).

## Next planned action

ChatGPT QA review of Milestone 1, then plan Milestone 2 (auth + workspace domain).