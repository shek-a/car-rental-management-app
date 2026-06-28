# Frontend Integration Guide

Everything a frontend developer needs to build a **web app** on the Car Rental Management platform.

> Target: browser single-page apps (React, Vue, Svelte, etc.). Mobile is out of scope for this guide.

## The platform in 60 seconds

A Node.js + Apollo **GraphQL** backend for a car rental business. Two roles — **Customer** (rents
cars) and **Administrator** (manages the fleet). Customers sign in with their **Google** account; the
platform stores no passwords. Each car can have one photo.

**Base URL (local dev):** `http://localhost:8082`

Three surfaces your app talks to:

| Surface | Endpoint | Use |
|---------|----------|-----|
| GraphQL API | `POST /graphQL` | All data: query cars/customers, rent/return, admin operations |
| Authentication | `/api/auth/*` | Google sign-in, session, sign-out (Better Auth) |
| Photo bytes | `GET /photos/:carId` | Fetch a car's image (public) |

## Read these in order

1. **[authentication.md](./authentication.md)** — sign a user in with Google and get a token.
2. **[authorization.md](./authorization.md)** — roles, who can do what (the authorization matrix).
3. **[api-reference.md](./api-reference.md)** — every query, mutation, type, enum, and input.
4. **[photos.md](./photos.md)** — upload and display car photos.
5. **[errors.md](./errors.md)** — how errors come back and how to handle them.
6. **[recipes.md](./recipes.md)** — end-to-end flows (sign in → browse → rent; admin manage fleet).

## Schema & codegen

The full schema is committed as **[`schema.graphql`](./schema.graphql)** (regenerate with
`yarn export-schema`). Point [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) or Apollo
codegen at it to produce typed operations and hooks. The running dev server also supports GraphQL
introspection if you prefer to pull the schema live.

## ⚠️ Prerequisites & current limitations (read before you start)

This backend is currently set up for **local development**. Before a deployed browser app on a
different origin can use it, the **backend team** must address the following — they are not things the
frontend can work around:

- **Cross-origin (CORS):** the GraphQL endpoint allows cross-origin requests by default, but the auth
  (`/api/auth/*`) and photo (`/photos/*`) routes, and Better Auth's `trustedOrigins`, are **not**
  configured for a separate web origin. Cookie-based sessions across origins will not work until this
  is set up. See [authentication.md](./authentication.md#prerequisites-backend-team).
- **Hardcoded base URL:** the OAuth callback and `AUTH_BASE_URL` are fixed to
  `http://localhost:8082`. Deploying elsewhere requires a backend config change.
- **Unprotected mutations:** `updateCustomer`, `deleteCustomer`, and `updateCar` currently have **no
  authorization checks** — any caller can invoke them. Do not rely on them being safe; see the
  matrix in [authorization.md](./authorization.md).
- **Photos:** one photo per car; JPEG/PNG/WebP only; max 5 MB; bytes are served from a local
  filesystem in the current deployment.

Each limitation is called out again in the relevant doc so you don't miss it.
