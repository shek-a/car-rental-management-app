# Cross-Origin & Configurable Base URL Contract

**Feature**: `003-fleet-details-and-rentals`

Lets a browser web app served from a different origin call the API, the auth routes, and the photo
route — and makes the API's public address configurable per environment.

## CORS

- Mount the **`cors`** middleware on the Express app **before** the Better Auth handler, the GraphQL
  middleware, and the photo route, so all three surfaces send CORS headers.
- Configuration:
  - `origin`: the configured **allowed origins** list (not `*`).
  - `credentials: true` (so a browser using cookie sessions can send them; bearer-token clients work
    too).
  - Allowed methods include `GET, POST, OPTIONS`; allowed headers include `Content-Type` and
    `Authorization`.
- Also set Better Auth's **`trustedOrigins`** to the same allowed-origins list, so Better Auth accepts
  cross-origin auth requests.

## Configuration inputs

| Value | Source | Default (local dev) |
|-------|--------|---------------------|
| `AUTH_BASE_URL` (public API base address) | environment variable, else `config.ts` default | `http://localhost:8082` |
| Allowed origins (CORS + `trustedOrigins`) | environment variable (comma-separated), else `config.ts` default | the local web-app dev origin (e.g. `http://localhost:3000`) + `http://localhost:8082` |

- Local development keeps working with **no `.env`** (defaults apply), preserving the constitution's
  local-first property.
- Photo URLs and the sign-in redirect already build from `AUTH_BASE_URL`, so pointing it at a deployed
  address makes generated links environment-correct automatically (FR-013 / SC-006).

## Behaviour

| Scenario | Expected |
|----------|----------|
| Request from an **allowed** origin to `/graphQL`, `/api/auth/*`, or `/photos/:carId` | Browser permits the response (CORS headers present) |
| Request from a **disallowed** origin | Browser blocks it (no CORS headers) — expected, not a server error |
| `AUTH_BASE_URL` set to a deployed address | `Car.photo.url` and auth redirects use that address |

## Out of scope

- HTTPS/TLS termination, cookie `SameSite=None; Secure` tuning for production, and multi-subdomain
  cookie sharing — deployment concerns beyond the demo.
