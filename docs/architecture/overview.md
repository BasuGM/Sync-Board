# SyncBoard architecture (Milestone 1)

## Goals

SyncBoard is a real-time collaborative workspace delivered as a **pnpm monorepo** with clear boundaries between the web client, REST API, shared contracts, and infrastructure.

## Monorepo layout

| Path | Responsibility |
| --- | --- |
| `apps/web` | Next.js App Router UI, client state, API consumption |
| `apps/api` | NestJS REST API, validation, persistence |
| `packages/shared` | Cross-cutting TypeScript contracts (health, auth, workspace) |
| `infrastructure/docker` | Notes and future infra assets; PostgreSQL compose at repo root |

## Frontend / backend separation

- The web app only talks to the API over HTTP using `NEXT_PUBLIC_API_URL` (no secrets in the browser).
- Business rules stay out of React components; UI composes layout shells and calls API/query layers.
- NestJS controllers remain thin; `HealthService` and `PrismaService` own behavior and data access.

## API communication

- API global prefix: `/api/v1`.
- Shared types (e.g. `HealthResponse`) live in `@syncboard/shared` to avoid drift.
- TanStack Query manages server state; Zustand manages purely client UI state (sidebar).

## Database integration

- PostgreSQL runs via Docker Compose (`docker-compose.yml`).
- Prisma is the ORM boundary in `apps/api/prisma`.
- `AppMetadata` is a minimal bootstrap table for migration verification.

## State management boundaries

| Concern | Tool |
| --- | --- |
| Remote data | TanStack Query |
| Ephemeral UI | Zustand (`useUiStore`) |
| Forms / validation | React Hook Form + Zod |

## Testing strategy

| Layer | Tooling |
| --- | --- |
| Web unit/component | Vitest + RTL + MSW |
| API unit/e2e | Jest + Supertest |
| DB integration | Jest gate (`RUN_DB_INTEGRATION=true`) |
| Browser E2E foundation | Playwright (smoke shell test) |

## Future real-time direction

Milestone 1 deliberately excludes Redis, WebSockets, and presence. Planned evolution:

1. Authentication and workspace domain APIs (REST).
2. Redis for pub/sub and horizontal scaling of real-time events.
3. WebSocket gateway (likely NestJS) for board updates and presence.
4. Optimistic UI + CRDT/OT decisions per entity type.

## Decision log

1. **Monorepo with pnpm workspaces** — single toolchain, shared types, aligned versions.
2. **REST first** — simpler operations and testing before real-time complexity.
3. **Prisma over raw SQL** — type-safe schema evolution for a growing domain.
4. **Health endpoint with liveness + DB readiness** — supports orchestration and dashboard status without auth.

## Domain architecture docs

- [Authentication](authentication.md) (Milestone 2)
- [Workspaces & membership](workspaces.md) (Milestone 3)