# Workspaces & membership (Milestone 3)

## Data model

- **Workspace** — `name`, unique `slug`, timestamps. Ownership is represented only by a `WorkspaceMember` row with role `OWNER` (no separate owner column).
- **WorkspaceMember** — links `User` ↔ `Workspace` with role `OWNER | ADMIN | MEMBER`. Unique `(workspaceId, userId)`.
- **WorkspaceInvitation** — pending invite for a normalized email, assigned role, SHA-256 `tokenHash`, expiry, `acceptedAt`, `revokedAt`.

Workspace creation and initial `OWNER` membership run in one Prisma transaction. Invitation acceptance locks the invitation row (`SELECT … FOR UPDATE`), creates membership, and sets `acceptedAt` in one transaction.

## Permission matrix

| Operation | OWNER | ADMIN | MEMBER |
| --- | --- | --- | --- |
| View workspace | Yes | Yes | Yes |
| List members | Yes | Yes | Yes |
| Update workspace name | Yes | Yes | No |
| Create invitations | Yes (ADMIN/MEMBER) | Yes (MEMBER only) | No |
| Revoke invitations | Yes | Yes | No |
| Change member roles | Yes | No | No |
| Remove MEMBER | Yes | Yes | No |
| Remove ADMIN | Yes | No | No |
| Remove OWNER | No | No | No |
| Leave workspace | No* | Yes | Yes |

\* Owners cannot leave via the leave action because ownership transfer is out of scope.

Enforcement is centralized in `workspace-permissions.ts` and applied through `WorkspaceAccessService` before mutating state.

## API (`/api/v1`, JWT required)

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/workspaces` | Create workspace + owner membership |
| `GET` | `/workspaces` | List caller's workspaces |
| `GET` | `/workspaces/:workspaceId` | Workspace detail + members |
| `PATCH` | `/workspaces/:workspaceId` | Rename workspace |
| `GET` | `/workspaces/:workspaceId/members` | List members |
| `PATCH` | `/workspaces/:workspaceId/members/:memberId` | Change role (OWNER only) |
| `DELETE` | `/workspaces/:workspaceId/members/:memberId` | Remove member or leave (self) |
| `POST` | `/workspaces/:workspaceId/invitations` | Create invitation (returns shareable URL once) |
| `GET` | `/workspaces/:workspaceId/invitations` | List pending invitations (no raw tokens) |
| `DELETE` | `/workspaces/:workspaceId/invitations/:invitationId` | Revoke invitation |
| `POST` | `/invitations/accept` | Accept invitation (`{ token }`) |

Non-members receive `404` on workspace-scoped routes to reduce IDOR leakage.

## Invitation lifecycle

1. **Create** — OWNER/ADMIN creates invite; API stores `sha256(token)` only and returns `{ invitationUrl }` built from `API_CORS_ORIGIN` + `/invitations/accept?token=…`.
2. **Share** — Inviter copies the URL manually (no email delivery in M3).
3. **Accept** — Authenticated user's normalized email must match the invitation email; invalid/expired/revoked/already-accepted invites are rejected.
4. **Revoke** — OWNER/ADMIN sets `revokedAt`.

Default expiry: `WORKSPACE_INVITATION_EXPIRES_DAYS` (default `7`).

## Security notes

- Raw invitation tokens are never persisted or returned in list endpoints.
- Membership and invitation acceptance use database transactions and row locking for concurrency safety.
- Role checks run on every workspace-scoped operation; workspace IDs from the client are never treated as authorization proof.