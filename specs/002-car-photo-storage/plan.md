# Implementation Plan: Car Photo Storage

**Branch**: `feature/add-photo-storage` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-car-photo-storage/spec.md`

## Summary

Add a single photo to each `Car`, managed by administrators and viewable publicly. Image **bytes**
are held behind a **platform-agnostic storage port** (`CarPhotoStorage`); this iteration ships a
**local filesystem adapter** so the feature can be demoed to stakeholders with no cloud account, and
cloud adapters (S3/GCS) can be added later by implementing the same port — no domain or resolver
changes. Uploads arrive as base64 in admin-only GraphQL mutations (`addCarPhoto`/`removeCarPhoto`),
are validated by magic-byte signature + size, and only metadata is stored in Mongo on the `Car`. The
photo is served by a public `GET /photos/:carId` route that `Car.photo.url` points at. Authorization
reuses the guards from feature 001.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js (babel-node)

**Primary Dependencies**: Apollo Server Express 3, Express 4, Mongoose 6, GraphQL 16. **No new npm
dependency** — local storage uses Node `fs/promises`; format detection uses magic-byte checks;
upload transport is base64.

**Storage**: Image bytes via the `CarPhotoStorage` port — `LocalFileSystemCarPhotoStorage` writes to
`PHOTO_STORAGE_DIR` (git-ignored). Photo **metadata** in MongoDB on the `Car` document.

**Testing**: Jest (unit, colocated, TDD); integration tests via Docker Compose Mongo + a temp
storage dir for the local adapter.

**Target Platform**: Headless Node service on port `8082` (GraphQL `/graphQL`, photos `/photos/:carId`).

**Project Type**: Single-project backend (GraphQL web service)

**Performance Goals**: Not a performance feature. One photo per car, capped at `PHOTO_MAX_BYTES`.

**Constraints**: Storage MUST be platform-agnostic (port + adapters); MUST run fully locally for
demos (no cloud, no credentials); viewing public; single photo per car (add replaces).

**Scale/Scope**: One storage port + one local adapter, one domain service, validation, a repository,
2 mutations, 1 field resolver, 1 Express route, 1 schema delta, cascade in `deleteCar`.

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. Domain-Driven Design** | PASS. `CarPhotoStorage` is a Repository-like port that speaks domain language; `CarPhotoService` holds the orchestration; the `Car` aggregate gains a photo; ubiquitous language "Car photo". |
| **II. Schema-First GraphQL** | PASS. `CarPhoto` type, `photo` field, input, and two mutations added to `typeDefs.ts`; types regenerated, never hand-edited. |
| **III. Test-First (NON-NEGOTIABLE)** | PASS (planned). Validation, service, repository, local adapter, and resolver guards are written test-first; mock only at boundaries (storage port, repository). |
| **IV. Clean Code & TypeScript Discipline** | PASS (planned). Storage interface, discriminated-union validation result, explicit return types, no `any` in new code. |
| **V. Layered Architecture & Simplicity** | PASS, no deviations. resolver → `CarPhotoService` → port + repository; the Express route is delivery. The storage abstraction is required by the explicit platform-agnostic requirement (not speculative); only the local adapter is built now (YAGNI). All config is non-secret, so — unlike feature 001 — there is **no `.env`/secrets deviation**. |

**Initial gate**: PASS (no deviations).
**Post-design gate**: PASS — design introduces a justified port abstraction and no secrets; no
Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-car-photo-storage/
├── plan.md              # This file
├── spec.md
├── research.md          # 10 decisions (storage port, local adapter, base64, serving, validation)
├── data-model.md        # Car + embedded CarPhotoMetadata; storage port; derived CarPhoto
├── contracts/
│   ├── graphql-schema.delta.md
│   ├── storage-port.contract.md
│   └── http-serving.contract.md
├── quickstart.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/
├── storage/                            # NEW — platform-agnostic storage seam
│   ├── carPhotoStorage.ts              # CarPhotoStorage port + StoredPhoto types
│   ├── localFileSystemCarPhotoStorage.ts
│   ├── localFileSystemCarPhotoStorage.test.ts
│   └── carPhotoStorageProvider.ts      # factory → active adapter (local now)
├── domain/car/                         # NEW — car photo domain logic
│   ├── carPhotoValidation.ts           # magic-byte format + size check (discriminated result)
│   ├── carPhotoValidation.test.ts
│   ├── carPhotoService.ts              # validate → store/replace/remove → update Car metadata
│   └── carPhotoService.test.ts
├── repository/
│   ├── carRepository.ts                # NEW — findByCarId / setPhoto / clearPhoto (hides Mongoose)
│   └── carRepository.test.ts
├── resolvers/
│   ├── mutations/car/
│   │   ├── addCarPhoto.ts  (+ .test.ts) # admin-only; delegates to CarPhotoService
│   │   ├── removeCarPhoto.ts (+ .test.ts)
│   │   └── deleteCar.ts                 # MODIFY — also delete the car's photo (FR-005)
│   └── car/
│       └── fetchPhotoByCar.ts (+ .test.ts) # Car.photo field resolver → { url, contentType }
├── http/
│   └── carPhotoRoute.ts                # NEW — public GET /photos/:carId (streams via port)
├── config/config.ts                    # MODIFY — PHOTO_PATH, PHOTO_STORAGE_DIR, PHOTO_MAX_BYTES, SUPPORTED_PHOTO_CONTENT_TYPES
├── model/car.ts                        # MODIFY — embedded photo metadata subdocument
├── typeDefs.ts                         # MODIFY — CarPhoto, Car.photo, AddCarPhotoInput, mutations
├── resolvers.ts                        # MODIFY — register mutations + Car.photo field
└── server.ts                           # MODIFY — mount carPhotoRoute
.gitignore                              # MODIFY — ignore PHOTO_STORAGE_DIR
```

**Structure Decision**: Single-project backend. The new `storage/` layer is the platform-agnostic
seam (port + local adapter + selecting factory); `domain/car/` holds validation + orchestration;
`repository/` hides Mongoose; `http/` holds the public serving route (delivery). Photo mutations
reuse the existing `requireAdministrator` guard from feature 001 — no new auth code.

## Complexity Tracking

No constitution deviations. The `CarPhotoStorage` abstraction is mandated by the explicit
platform-agnostic requirement (not speculative), only the local adapter is implemented now (YAGNI),
and local storage needs no secrets (so no `.env` deviation). Nothing to record here.

## Phase 0 & 1 outputs

- **Phase 0** → [research.md](./research.md): storage port + local adapter, base64 transport,
  URL-based serving, metadata/bytes split, signature validation, replace/cascade, auth reuse, config,
  schema changes.
- **Phase 1** → [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md),
  and the agent-context update (CLAUDE.md plan pointer).

## Next step

Run `/speckit-tasks` to generate the dependency-ordered, TDD-first `tasks.md`.
