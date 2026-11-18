# SyncBoard — Project State

## Project overview

SyncBoard is a collaborative workspace platform. The monorepo provides a Next.js client, NestJS API, PostgreSQL/Prisma, shared TypeScript contracts, Docker-based local development, and milestone-gated delivery.

The project is developed using a strict implementation → independent QA → review → milestone closure workflow. ChatGPT is the technical architect and final milestone decision-maker. Cursor performs implementation and QA tasks as separately assigned.

## Current milestone

**Milestone 4 — Boards, columns and tasks: Not started**

## Completed milestones

### Milestone 1 — Project Foundation

Implementation and QA complete.

Delivered:

- pnpm monorepo with `apps/web`, `apps/api`, and `packages/shared`.
- Next.js App Router frontend and NestJS backend.
- PostgreSQL 16, Prisma and Docker Compose.
- Tailwind CSS and frontend testing infrastructure.
- API health endpoint and dashboard foundation.
- README, architecture documentation and project-state tracking.

### Milestone 2 — Authentication and user management

Implementation and QA complete.

Delivered:

- Registration, login, logout and session restoration.
- Argon2id password hashing and normalized email.
- Short-lived JWT access tokens held in frontend memory.
- HttpOnly refresh cookies with rotation and reuse detection.
- Database-backed sessions.
- Protected API routes and frontend authentication guards.
- Authentication rate limiting.
- Independent backend and browser QA passed.

### Milestone 3 — Workspaces and membership

Implementation and QA complete. **Formally closed after targeted corrective QA.**

Delivered:

- Workspace creation, listing, retrieval and renaming.
- Workspace membership and member management.
- Roles: `OWNER`, `ADMIN`, `MEMBER`.
- Centralized permission functions and `WorkspaceAccessService`.
- Workspace authorization and tenant isolation.
- Invitation creation, listing, revocation and acceptance.
- Cryptographically random invitation tokens, SHA-256 hashes stored in the database, expiration and single-use acceptance.
- Email-matched invitation acceptance with transactional locking.
- Workspace listing, creation, details, member-management and invitation UI.
- Shared workspace contracts in `@syncboard/shared`.
- Workspace architecture documentation.

QA outcomes:

- Backend authorization and tenant-isolation checks passed.
- Role/permission matrix passed at API level.
- Invitation security and concurrent acceptance passed.
- Frontend workspace and invitation happy paths passed.
- Authentication, session restoration and logout browser checks passed.
- Responsive checks passed with a known sidebar limitation.
- Playwright smoke passed with a clean full-stack environment.
- D1 error-display defect fixed and independently verified.
- Lint, typecheck, unit tests, database integration tests, API e2e and build passed.

## Pending milestones and roadmap

- **M4:** Boards, columns and tasks.
- **M5:** Drag-and-drop, ordering interactions and optimistic updates.
- **M6:** WebSocket communication foundation.
- **M7:** Real-time collaboration and user presence.
- **M8:** Redis Pub/Sub, multi-instance fan-out and event recovery.
- **M9:** Security, performance and observability hardening.
- **M10:** Automated testing and load testing.
- **M11:** AWS deployment and CI/CD.
- **M12:** Final production-readiness review.

The roadmap may be refined as architectural requirements become clearer. Each milestone must remain independently implementable and verifiable.

## Architecture decisions

### Repository and application architecture

- pnpm workspace monorepo: `apps/web`, `apps/api`, `packages/shared`.
- Next.js App Router and React with strict TypeScript.
- NestJS API.
- REST API under `/api/v1`.
- Prisma as the database access boundary.
- PostgreSQL as the primary relational database.
- Docker Compose for local infrastructure.
- Shared TypeScript contracts in `@syncboard/shared`.

### Frontend state management

- TanStack Query for server state, caching and mutations.
- Zustand for client-side authentication and UI state.
- React Hook Form and Zod for form handling and validation.
- Server data must not be unnecessarily duplicated in Zustand.
- Mutations should invalidate or update relevant TanStack Query caches.

### Authentication and authorization

- JWT access tokens held in frontend memory.
- Server-side refresh sessions using HttpOnly cookies.
- Refresh-token rotation with PostgreSQL transactions and row locking.
- Argon2id password hashing.
- Workspace-scoped authorization enforced on the backend.
- Frontend permission checks are for UI behavior only; backend authorization remains authoritative.

### Database

- PostgreSQL with Prisma.
- Additive migrations.
- Explicit relational constraints, indexes and appropriate deletion behavior.
- No destructive database resets or migrations against existing user data without explicit approval.

### Existing domain models

- `User`
- `Session`
- `Workspace`
- `WorkspaceMember`
- `WorkspaceInvitation`
- `WorkspaceRole`

### Workspace authorization

- Workspace membership is represented by `WorkspaceMember`.
- The workspace owner is represented by an OWNER membership row.
- Non-members receive appropriate non-disclosing responses on workspace-scoped routes.
- Centralized permission rules are implemented in `workspace-permissions.ts` and `WorkspaceAccessService`.
- Invitation acceptance requires matching normalized email and is transactional.

## Technology choices

Documented in:

- `README.md`
- `docs/architecture/overview.md`
- `docs/architecture/authentication.md`
- `docs/architecture/workspaces.md`

## Milestone 3 — Final implementation status

| Area                             | Status                             |
| -------------------------------- | ---------------------------------- |
| Workspace API                    | Done                               |
| Workspace membership             | Done                               |
| OWNER / ADMIN / MEMBER roles     | Done                               |
| Backend authorization            | Done                               |
| Tenant isolation                 | Done                               |
| Invitation lifecycle             | Done                               |
| Concurrent invitation acceptance | Verified                           |
| Workspace frontend               | Done                               |
| Invitation frontend              | Done                               |
| Shared workspace contracts       | Done                               |
| Architecture documentation       | Done                               |
| D1 error-display correction      | Done and independently QA-verified |
| M3 independent QA                | Passed                             |
| M3 closure                       | Complete                           |

## Known issues

- Mobile/tablet dashboard sidebar has a fixed width of approximately 256px and crowds narrow viewports. This is an M1 carryover, not an M3 regression.
- Stale Next.js development processes or `.next` artifacts can cause missing CSS or webpack chunks. Clean generated artifacts and restart the full stack when this occurs.
- Playwright smoke requires a clean full-stack environment. Ensure ports 3000 and 3001 are available when running the CI-style command.
- DB-backed tests require `RUN_DB_INTEGRATION=true` and a running PostgreSQL instance.

## Technical debt

### Security and account management

- No email verification.
- No password recovery.
- No OAuth.
- CSRF protection currently relies on SameSite cookies; no double-submit token.

### Observability and operations

- No centralized observability stack for metrics and distributed tracing.

### Testing and frontend

- Add automated browser coverage for workspace creation, listing, and invitation acceptance.
- Add browser coverage for empty workspace state and invitation error cases.
- Add explicit malformed JSON and null/undefined response-body tests to shared API error parsing.
- Revisit the fixed-width mobile/tablet sidebar.

### Workspace limitations

- No ownership transfer.
- No workspace deletion.
- These were intentionally excluded from M3.

## Milestone 4 — Boards, columns and tasks

**Status: Not started**

### Objective

Introduce the core board and task-management domain inside workspaces.

Members should be able to create and manage multiple boards, organize each board into columns, and create, edit, view and delete tasks.

### Planned scope

- Board creation, listing, retrieval, renaming and deletion.
- Multiple boards per workspace.
- Board access enforced through workspace membership.
- Column creation, listing, renaming and deletion.
- Ordered columns with persisted positions.
- Task creation, listing, retrieval, editing and deletion.
- Tasks belong to a column and inherit access from their board and workspace.
- Persisted task positions sufficient for stable ordering.
- Task fields and validation appropriate for the initial product.
- Frontend board listing and board detail experience.
- Column-based task presentation.
- Shared contracts and API validation.
- Backend authorization and tenant isolation.
- Unit, integration and frontend tests.
- Architecture documentation.

### Explicit exclusions

Do not implement these as part of M4:

- Drag-and-drop interactions.
- Optimistic task movement.
- Real-time synchronization.
- WebSockets.
- User presence.
- Redis Pub/Sub.
- Multi-instance event distribution.
- Advanced activity feeds or notifications.
- Complex task assignment, labels or automation unless separately approved.

These features belong to later milestones.

### M4 acceptance criteria

- A workspace member can create and view boards within their workspace.
- Multiple boards can exist in one workspace.
- Board data is isolated across workspaces.
- Columns can be created, listed, renamed and deleted according to the defined rules.
- Column order is persisted.
- Tasks can be created, listed, viewed, edited and deleted.
- Tasks remain associated with the correct board and column.
- Task ordering is persisted.
- Invalid references and cross-workspace IDs cannot be used to access or modify another workspace's data.
- Backend authorization is enforced independently of frontend UI visibility.
- Existing workspace and authentication behavior remains intact.
- Shared contracts and documentation are updated.
- Automated tests, lint, typecheck and build pass.
- Independent browser QA verifies the actual board and task workflows.

### Next planned action

Plan and implement M4 — Boards, columns and tasks.

Cursor must first inspect this file, the existing Prisma schema and migrations, workspace authorization services, shared contracts, frontend architecture and existing tests.

Do not assume that M4 has already started.

## Future architectural direction

The intended evolution is:

1. Establish reliable board, column and task CRUD.
2. Add drag-and-drop and optimistic updates.
3. Introduce WebSocket communication.
4. Implement real-time task synchronization and presence.
5. Add Redis Pub/Sub for multi-instance event distribution.
6. Handle event ordering, duplicate events, reconnection and missed-event recovery.
7. Improve security, observability and performance.
8. Add load testing and production deployment infrastructure.
9. Deploy using AWS services and CI/CD.
10. Perform a final production-readiness review.

All future implementation must preserve the milestone-gated workflow and avoid prematurely introducing distributed-system complexity.