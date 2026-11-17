# SyncBoard authentication (Milestone 2)

## Overview

SyncBoard uses **short-lived JWT access tokens** (Bearer header, in-memory on the client) and **rotating refresh tokens** stored in **HttpOnly cookies** with **server-side hashed session records**.

## Backend

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /api/v1/auth/register` | Public | Create user + session |
| `POST /api/v1/auth/login` | Public | Authenticate + session |
| `POST /api/v1/auth/refresh` | Refresh cookie | Rotate session + new access token |
| `POST /api/v1/auth/logout` | Bearer + cookie | Revoke session |
| `GET /api/v1/auth/me` | Bearer | Current user profile |

### Passwords

- **Argon2id** via the `argon2` package.
- Minimum 8 characters with uppercase, lowercase, and digit validation.
- Emails normalized to lowercase trimmed form; unique at DB level.

### Sessions

- Refresh token: 32-byte random, base64url; only **SHA-256 hash** stored in `Session.refreshTokenHash`.
- Rotation on every refresh; previous session row gets `revokedAt` + `replacedById`.
- **Reuse detection:** presenting a refresh token for a revoked session revokes **all** active sessions for that user.

### Cookies

- Name: `syncboard_refresh` (configurable).
- `HttpOnly`, `SameSite=Lax`, `Secure` in production, path `/api/v1/auth`.
- CORS: explicit origin (no wildcard) with `credentials: true`.

### Rate limiting

`@nestjs/throttler` with tighter limits on `/auth/*` (20 req/min per IP).

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