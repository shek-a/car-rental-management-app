# Authentication

Users sign in with their **Google** account. The platform never stores passwords — it relies on
Google for identity, via [Better Auth](https://better-auth.com). On a user's **first** sign-in the
backend automatically creates a `Customer` record for them (see
[authorization.md](./authorization.md)).

Authentication lives under **`/api/auth/*`** on the same origin/port as the API
(`http://localhost:8082`).

## Recommended: use the Better Auth client

The backend runs Better Auth, so the cleanest integration is the official
[`better-auth` client](https://better-auth.com/docs/concepts/client) in your web app — it speaks the
exact same protocol as the server, so you don't hand-roll the OAuth dance.

```ts
// auth-client.ts
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:8082", // the API origin; Better Auth is mounted at /api/auth
});
```

```ts
// Start Google sign-in — redirects the browser to Google, then back to callbackURL.
await authClient.signIn.social({
  provider: "google",
  callbackURL: "http://localhost:3000/after-login", // a route in YOUR app
});

// Read the current session/user (null if signed out)
const { data: session } = await authClient.getSession();

// Sign out
await authClient.signOut();
```

> Use `better-auth/react` (or the Vue/Svelte variants) for hooks like `useSession()`.

## The flow, conceptually

1. Your app calls `signIn.social({ provider: "google", callbackURL })`.
2. The browser is redirected to Google's consent screen (this redirect is inherent to OAuth — there
   is no password form to build).
3. After consent, Google returns to the backend at `/api/auth/callback/google`; Better Auth verifies
   the identity, creates/looks up the session, and redirects the browser to your `callbackURL`.
4. Your app now has an authenticated session and can call the API.

## Raw endpoints (ground truth)

If you integrate without the client library, these are the endpoints under `/api/auth` (provided by
Better Auth):

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/sign-in/social` (`{ provider: "google", callbackURL }`) | Begin Google sign-in; returns the Google redirect URL |
| `GET /api/auth/callback/google` | OAuth callback (Better Auth handles it) |
| `GET /api/auth/get-session` | Current session + user, or null |
| `POST /api/auth/sign-out` | End the session |

## Presenting the session to the GraphQL API

There are two ways to prove identity on `POST /graphQL`. Pick one.

### Option A — Bearer token (recommended for SPAs, cross-origin friendly)

Better Auth's bearer plugin is enabled. Auth responses include the session token in the
**`set-auth-token`** response header. Store it (e.g. in memory / `localStorage`) and send it on every
GraphQL request:

```ts
fetch("http://localhost:8082/graphQL", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ query, variables }),
});
```

With Apollo Client, set this in an `authLink`; with urql, in `fetchOptions`.

### Option B — Cookie session (simplest when same-origin)

If your web app is served from the **same origin** as the API (or behind a reverse proxy that makes
it same-origin), Better Auth's session cookie is sent automatically — just include credentials:

```ts
fetch("http://localhost:8082/graphQL", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables }),
});
```

Cross-origin cookies require backend CORS + `trustedOrigins` configuration (see below), so for a
separately-hosted SPA prefer **Option A**.

## Unauthenticated requests are fine for public data

You do **not** need a token to read cars or customers, or to fetch photo bytes. Send those requests
with no `Authorization` header. Auth is only required for the protected operations listed in
[authorization.md](./authorization.md).

## Prerequisites (backend team)

A deployed browser app needs these on the backend before it will work — flag them to the backend
team; the frontend cannot work around them:

- **OAuth redirect URI:** the Google OAuth client must register the callback
  `http://<api-origin>/api/auth/callback/google` (currently `http://localhost:8082/...`).
- **CORS + `trustedOrigins`:** the auth and photo routes are not yet configured to accept requests
  from a separate web origin; cross-origin cookie sessions won't work until they are.
- **Base URL:** `AUTH_BASE_URL` is hardcoded to `http://localhost:8082`; a real deployment needs it
  pointed at the deployed API origin.
- **Server secrets:** `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` must be set on
  the server (these are backend concerns, not exposed to the frontend).
