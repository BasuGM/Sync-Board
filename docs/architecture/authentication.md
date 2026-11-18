# SyncBoard authentication (Milestone 2)

## Overview

SyncBoard uses **short-lived JWT access tokens** (Bearer header, in-memory on the client) and **rotating refresh tokens** stored in **HttpOnly cookies** with **server-side hashed session records**.

## Backend

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /api/v1/auth/register` | Public | Create user + session |
| `POST /api/v1/auth/login` | Public | Authenticate + session |
| `POST /api/v1/auth/refresh` | Refresh cookie | Rotate session + new access token |
| `POST /api/v1/auth/logout` | Refresh cookie | Revoke current session (no access JWT required) |
| `GET /api/v1/auth/me` | Bearer | Current user profile |

### Passwords

- **Argon2id** via the `argon2` package.
- Minimum 8 characters with uppercase, lowercase, and digit validation.
- Emails normalized to lowercase trimmed form; unique at DB level.

### Sessions

- Refresh token: 32-byte random, base64url; only **SHA-256 hash** stored in `Session.refreshTokenHash`.
- Rotation on every refresh inside a single database transaction with `SELECT ... FOR UPDATE` on the matching session row.
- Concurrent refresh requests for the same cookie are serialized by PostgreSQL; **exactly one** rotation succeeds.
- A losing concurrent request receives `401 Session expired` and does **not** trigger mass revocation.
- **Reuse detection:** presenting a refresh token that was revoked **without** rotation (`replacedById` is null)—for example after logout—revokes all active sessions for that user.
- Presenting an already-rotated token (`replacedById` set) returns `401 Session expired` only (covers normal rotation losers and stolen rotated tokens without nuking unrelated sessions).

### Cookies

- Name: `syncboard_refresh` (configurable).
- `HttpOnly`, `SameSite=Lax`, `Secure` in production, path `/api/v1/auth`.
- CORS: explicit origin (no wildcard) with `credentials: true`.

### Rate limiting

`@nestjs/throttler` with tighter limits on `/auth/*` (20 req/min per IP).

### Registration names

- Names are trimmed and internal whitespace collapsed (`"  John   Doe  "` → `"John Doe"`).
- Empty or whitespace-only names are rejected before persistence.

### API bootstrap

- `cookie-parser` is loaded with a namespace import (`import * as cookieParser`) so the compiled CommonJS entrypoint invokes the middleware function correctly (avoid `default` interop crashes at runtime).

## Frontend

- Access token in **Zustand memory only** (never `localStorage` / `sessionStorage`).
- `credentials: 'include'` on API calls for refresh cookie.
- Single-flight refresh to avoid concurrent refresh storms.
- `AuthProvider` restores session via `/auth/refresh` on load.
- `AuthGuard` protects dashboard routes; backend remains authoritative.

## Security trade-offs

- **SameSite=Lax** balances local dev ergonomics vs CSRF; production should use HTTPS and strong `JWT_ACCESS_SECRET`.
- Registration/login errors are generic where practical to reduce email enumeration.
- No roles/workspace ACL in this milestone.