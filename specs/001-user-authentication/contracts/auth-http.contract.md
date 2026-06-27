# Authentication HTTP Contract (Better Auth)

**Feature**: `001-user-authentication`

Better Auth is mounted on Express at `/api/auth/*` via `toNodeHandler(auth)`, on the same host/port
as GraphQL (`http://localhost:8082`). These endpoints are provided by the library; we configure but
do not implement them. Listed here as the contract the GraphQL layer and API clients depend on.

## Endpoints (relevant subset)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` / `POST` | `/api/auth/sign-in/social` | Begin Google sign-in; returns a redirect URL to Google's consent screen. Body/query: `{ provider: "google" }`. |
| `GET` | `/api/auth/callback/google` | OAuth callback. On success, creates/links the `user` and issues a session. With the bearer plugin, the session token is returned in the `set-auth-token` response header. |
| `GET` | `/api/auth/get-session` | Returns the current session + user for the presented credentials (cookie or bearer), or null. |
| `POST` | `/api/auth/sign-out` | Invalidates the current session. |

## Session acquisition flow (headless API client, no front end)

1. Client (or human) opens `GET /api/auth/sign-in/social?provider=google` in a **browser** — the
   Google consent screen is an unavoidable part of OAuth.
2. After consent, Google redirects to `/api/auth/callback/google`; Better Auth issues a session and
   returns the token via the `set-auth-token` header.
3. The API client stores that token and sends it on every GraphQL request:
   `Authorization: Bearer <token>`.

## How GraphQL consumes the session

The Apollo context function calls:

```
auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
```

- Valid session → resolve/attach `currentCustomer` (via the provisioning service) to context.
- No/invalid/expired → `currentCustomer = null`; protected resolvers reject as unauthorized.

## Configuration inputs

| Value | Source | Secret? |
|-------|--------|---------|
| `BETTER_AUTH_SECRET` | environment variable | **yes** |
| `GOOGLE_CLIENT_ID` | environment variable | **yes** |
| `GOOGLE_CLIENT_SECRET` | environment variable | **yes** |
| auth base URL (`http://localhost:8082`) | `src/config/config.ts` | no |
| seed admin email (`andrew.shek23@gmail.com`) | `src/config/config.ts` | no |

Google OAuth client must list `http://localhost:8082/api/auth/callback/google` as an authorized
redirect URI.
