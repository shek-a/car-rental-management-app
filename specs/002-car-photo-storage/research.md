# Research: Car Photo Storage

**Feature**: `002-car-photo-storage` | **Date**: 2026-06-28

Resolves the unknowns in Technical Context. The driving constraint from the user: the storage
solution MUST be **platform-agnostic** and MUST be able to **store locally** so the feature can be
demoed to stakeholders without any cloud account.

## Decision 1 — Storage abstraction (ports & adapters / Strategy)

- **Decision**: Define a `CarPhotoStorage` **port** (interface) — `save` / `load` / `delete` keyed
  by car id — and implement a single adapter now: `LocalFileSystemCarPhotoStorage`, which writes
  bytes to a configured directory on disk. A factory (`carPhotoStorageProvider`) returns the active
  adapter. Cloud adapters (S3, GCS, Azure Blob) can be added later by implementing the same port,
  with **no change** to the domain, resolvers, or serving layer.
- **Rationale**: This is exactly the platform-agnostic requirement — the domain depends on the port,
  not on any storage technology. The local adapter satisfies the "demo to stakeholders" requirement
  with zero external infrastructure. It also aligns with the constitution: a Repository-like
  abstraction that "speaks the language of the domain," and a pattern (Strategy) introduced because
  the problem genuinely calls for it — not speculatively.
- **Alternatives considered**: Hard-coding a cloud SDK (fails "local demo" and couples the domain to
  a vendor); storing bytes directly in MongoDB/GridFS (works locally but isn't platform-agnostic at
  the storage layer and bloats the operational DB) — rejected, though GridFS remains a possible
  future adapter behind the same port.

## Decision 2 — Only build the local adapter now (YAGNI)

- **Decision**: Implement **only** `LocalFileSystemCarPhotoStorage` in this iteration. Ship the port
  and the factory seam, but write no cloud adapter yet.
- **Rationale**: The constitution forbids speculative abstractions beyond a concrete need. The
  concrete need today is local demo + a clean seam for later. Building an S3 adapter now would be
  unused code. The seam (port + factory) is the minimum that makes "platform-agnostic" real.
- **Alternatives considered**: Building an S3 adapter alongside (rejected — no current need, adds
  secrets/credentials and a cloud dependency the demo explicitly avoids).

## Decision 3 — Upload transport over GraphQL (no front end)

- **Decision**: Accept the image as a **base64-encoded string + declared content type** in a GraphQL
  mutation argument. The resolver decodes to a `Buffer` and hands the bytes to the storage port.
- **Rationale**: Works identically for the local adapter and any future cloud adapter — the API
  surface never changes. Needs no extra multipart dependency or Apollo Server 3 upload integration,
  and is trivial for a headless demo client (any GraphQL client can send a string). With a single
  photo capped at a few MB, base64's ~33% overhead is acceptable.
- **Alternatives considered**: `graphql-upload` multipart streams (more correct for very large
  files, but adds a dependency and Apollo Server 3 wiring friction, and is awkward from a plain
  GraphQL client) — rejected for this scope. Pre-signed direct-to-cloud URLs (cloud-specific, breaks
  the local-demo and platform-agnostic goals at the API surface) — rejected.

## Decision 4 — Serving / retrieval (URL, not bytes-in-GraphQL)

- **Decision**: Expose `Car.photo` as a small object carrying a **URL** and content type. The URL
  points at a public Express route, `GET /photos/:carId`, which streams the bytes from the storage
  port with the correct `Content-Type`. The local adapter streams from disk; a future cloud adapter
  could instead have the route redirect to (or the field return) the object's own URL.
- **Rationale**: Returning a URL is the standard way to surface images and keeps large binary out of
  GraphQL responses. Viewing stays public (FR-006) and platform-agnostic — the consumer always sees
  a URL regardless of where bytes live. Reuses the existing Express app and `AUTH_BASE_URL`.
- **Alternatives considered**: Returning base64 bytes directly in the `Car.photo` GraphQL field
  (simpler, but bloats every car query and couples image delivery to GraphQL) — rejected.

## Decision 5 — Metadata in Mongo, bytes in the storage provider

- **Decision**: Persist only **photo metadata** on the `Car` document — `contentType`, `storageKey`,
  `addedAt`. The image **bytes** live in the storage provider (local disk now). The `storageKey` is
  derived deterministically from the car id (one photo per car).
- **Rationale**: Keeps the operational DB small, keeps storage pluggable, and makes "does this car
  have a photo?" a cheap metadata read. The deterministic key makes replace/delete trivial.
- **Alternatives considered**: Storing bytes in the Car document (couples DB size to image size,
  not platform-agnostic) — rejected.

## Decision 6 — Validation (trust nothing about the upload)

- **Decision**: A `carPhotoValidation` unit validates each upload: (a) the bytes decode from base64;
  (b) the **actual** format is JPEG, PNG, or WebP, determined by inspecting magic-byte signatures
  (not merely the client-declared content type); (c) the decoded size is within the configured
  maximum. Return a discriminated-union result (`valid` | `invalid` with a reason). On any failure,
  nothing is stored and any pre-existing photo is left intact (FR-011).
- **Rationale**: A declared content type is attacker-controlled; sniffing magic bytes prevents a
  document/video/script being stored as an "image." Discriminated unions match the TypeScript skill.
- **Alternatives considered**: Trusting the client `contentType` (insecure) — rejected.

## Decision 7 — Replace, remove, and cascade-on-car-delete

- **Decision**: Because there is one photo per car, **add** overwrites the bytes at the car's key and
  updates metadata (replace). **Remove** deletes the bytes and clears the metadata. **Deleting a
  car** also deletes its photo — wired into the existing `deleteCar` resolver/flow (FR-005).
- **Rationale**: Deterministic key makes replace a plain overwrite. Cascade prevents orphaned files.
- **Alternatives considered**: Versioned/multiple photos (out of scope per the spec) — rejected.

## Decision 8 — Authorization (reuse feature 001)

- **Decision**: `addCarPhoto` and `removeCarPhoto` reuse the existing `requireAdministrator` guard.
  The serving route `GET /photos/:carId` is public (no guard).
- **Rationale**: Photo management is fleet management (admin-only, FR-002); viewing is public
  (FR-006). Reuses the authorization layer already in `src/auth/authorization.ts` — no new auth code.
- **Alternatives considered**: A new permission model (unnecessary — the two existing roles suffice).

## Decision 9 — Configuration (all non-secret)

- **Decision**: Add non-secret config to `src/config/config.ts`: `PHOTO_PATH` (`/photos`),
  `PHOTO_STORAGE_DIR` (local directory, e.g. `./.photo-storage`), `PHOTO_MAX_BYTES` (e.g.
  `5 * 1024 * 1024`), and `SUPPORTED_PHOTO_CONTENT_TYPES` (JPEG/PNG/WebP).
- **Rationale**: Local storage needs no credentials, so — unlike feature 001 — there is **no secret
  and no constitution deviation** here. Everything is hardcoded config per the constitution.
  `PHOTO_STORAGE_DIR` is added to `.gitignore` so demo uploads aren't committed.
- **Alternatives considered**: Env-var config (unneeded without secrets) — rejected for simplicity.

## Decision 10 — GraphQL schema changes

- **Decision**: Update `src/typeDefs.ts` and regenerate types:
  - `type CarPhoto { url: String!  contentType: String! }`
  - `Car.photo: CarPhoto` (nullable — a car may have none)
  - `input AddCarPhotoInput { data: String!  contentType: String! }` (`data` is base64)
  - `addCarPhoto(carId: ID!, input: AddCarPhotoInput!): Car`
  - `removeCarPhoto(carId: ID!): Car`
- **Rationale**: Schema-first is mandatory; types are regenerated, never hand-edited.

## Summary of new dependencies

| Need | Choice |
|------|--------|
| Image bytes storage | Node `fs/promises` (local adapter) — **no new npm dependency** |
| Format detection | Magic-byte signature check — small hand-rolled check, **no new dependency** |
| Upload transport | base64 string in GraphQL — **no new dependency** |

No new packages are required for this iteration. Future cloud adapters would add their vendor SDK
behind the existing port.
