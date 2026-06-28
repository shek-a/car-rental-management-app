---
description: "Task list for Car Photo Storage"
---

# Tasks: Car Photo Storage

**Input**: Design documents from `specs/002-car-photo-storage/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are INCLUDED and REQUIRED — the constitution mandates TDD (Red-Green-Refactor).
Each implementation task is preceded by a failing-test task. Per the TDD skill, review/approve the
test cases in each `*.test.ts` task before the implementation task makes them pass.

**Organization**: Grouped by user story. US1 (add) is the MVP. US2 (view) and US3 (remove/cascade)
depend only on the foundational layer, not on US1 — after foundation, all three can run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (user-story phases only)

## Path Conventions

Single-project backend; source at `src/`. Tests colocated `*.test.ts`. Shared mock factories in
`src/testing/utilities.ts`. Integration tests under `test/integration/`. Auth guards
(`requireAdministrator`) and the admin test factory (`createAdministrator`) already exist from
feature 001 and are reused.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration scaffolding for photo storage.

- [X] T001 [P] Add non-secret photo config to `src/config/config.ts` (`PHOTO_PATH` = `/photos`, `PHOTO_STORAGE_DIR` = `./.photo-storage`, `PHOTO_MAX_BYTES` = `5 * 1024 * 1024`, `SUPPORTED_PHOTO_CONTENT_TYPES` for JPEG/PNG/WebP) and add `.photo-storage` to `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, model, storage port + local adapter, and the car repository that ALL stories
need.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Update `src/typeDefs.ts` per `contracts/graphql-schema.delta.md`: add `type CarPhoto`, `input AddCarPhotoInput`, `Car.photo: CarPhoto`, and the `addCarPhoto` / `removeCarPhoto` mutations
- [X] T003 Run `yarn generate-graphql-types` to regenerate `src/generated/types.ts` (never hand-edit) — depends on T002
- [X] T004 [P] Add an embedded `photo` metadata subdocument (`contentType`, `storageKey`, `addedAt`) to the schema in `src/model/car.ts`
- [X] T005 [P] Define the `CarPhotoStorage` port and `StoredPhoto` type in `src/storage/carPhotoStorage.ts` per `contracts/storage-port.contract.md`
- [X] T006 [P] Write failing tests in `src/storage/localFileSystemCarPhotoStorage.test.ts`: `save` then `load` round-trips bytes + content type; `load` returns null when absent; `delete` removes and is a no-op when absent; `save` overwrites (replace) — use a temp dir
- [X] T007 Implement `src/storage/localFileSystemCarPhotoStorage.ts` (writes under `PHOTO_STORAGE_DIR`, derives extension from content type) to pass T006 — depends on T005, T006
- [X] T008 [P] Implement `src/storage/carPhotoStorageProvider.ts` — a factory returning the active `CarPhotoStorage` (local adapter now); the single seam where a future cloud adapter is selected — depends on T005
- [X] T009 [P] Write failing tests in `src/repository/carRepository.test.ts` for `findByCarId`, `setPhoto(carId, metadata)`, and `clearPhoto(carId)` (mock `CarModel` at the boundary; verify arguments via capture)
- [X] T010 Implement `src/repository/carRepository.ts` to pass T009 (abstracts `CarModel`; explicit return types) — depends on T009, T004

**Checkpoint**: Schema/types/model updated; storage port + local adapter unit-tested; car repository
ready. No user-visible behavior yet.

---

## Phase 3: User Story 1 - Administrator adds a photo to a car (Priority: P1) 🎯 MVP

**Goal**: An administrator uploads a valid image; it is stored (bytes via the port, metadata on the
car). Adding when one exists replaces it. Invalid uploads change nothing.

**Independent Test**: As an administrator, add a valid image to a car and confirm bytes are stored
and metadata is set; re-add to confirm replace; submit a non-image / oversize and confirm rejection
with no change; confirm non-admin/unauthenticated are rejected.

- [X] T011 [P] [US1] Write failing tests in `src/domain/car/carPhotoValidation.test.ts`: accepts JPEG/PNG/WebP by magic-byte signature; rejects an undecodable string, an unsupported type (e.g. PDF/text bytes), and an over-`PHOTO_MAX_BYTES` payload; returns a discriminated `valid` | `invalid(reason)` result
- [X] T012 [US1] Implement `src/domain/car/carPhotoValidation.ts` (base64 decode + magic-byte format check + size check, discriminated-union result) to pass T011 — depends on T011
- [X] T013 [P] [US1] Write failing tests in `src/domain/car/carPhotoService.test.ts` for `addCarPhoto`: valid input → calls storage `save` then repository `setPhoto` with the right metadata (verify by capture) and returns the car; car-not-found → throws; invalid input → throws and neither `save` nor `setPhoto` is called (FR-011) — mock `CarPhotoStorage` and `carRepository`
- [X] T014 [US1] Implement the `addCarPhoto` path of `src/domain/car/carPhotoService.ts` (validate → save bytes → set metadata) to pass T013 — depends on T013, T012, T010, T008
- [X] T015 [P] [US1] Write failing tests in `src/resolvers/mutations/car/addCarPhoto.test.ts`: unauthenticated → `AuthenticationError`; non-admin → `AuthorizationError`; admin → delegates to the service with decoded args and returns the car — mock the service, use `createAdministrator`
- [X] T016 [US1] Implement `src/resolvers/mutations/car/addCarPhoto.ts` (accept `context`, `requireAdministrator`, delegate to `carPhotoService.addCarPhoto`) to pass T015 — depends on T015, T014
- [X] T017 [US1] Register `addCarPhoto` under `Mutation` in `src/resolvers.ts` — depends on T016

**Checkpoint**: US1 fully functional and independently testable — the MVP (admins can store/replace a
car photo).

---

## Phase 4: User Story 2 - Anyone viewing a car sees its photo (Priority: P1)

**Goal**: `Car.photo` exposes a public URL + content type; `GET /photos/:carId` streams the bytes;
a car with no photo yields `null` / `404` (not an error).

**Independent Test**: For a car whose photo metadata + bytes are seeded, query `car { photo { url contentType } }`
without auth and confirm the URL; `GET` it and confirm bytes + content type; for a car with no photo
confirm `null` and `404`.

- [X] T018 [P] [US2] Write failing tests in `src/resolvers/car/fetchPhotoByCar.test.ts`: returns `{ url, contentType }` (url = `AUTH_BASE_URL + PHOTO_PATH + "/" + carId`) when the car has photo metadata; returns `null` when it has none
- [X] T019 [US2] Implement `src/resolvers/car/fetchPhotoByCar.ts` (Car.photo field resolver, builds the URL from config) to pass T018 — depends on T018
- [X] T020 [US2] Register the `Car.photo` field resolver in `src/resolvers.ts` under `Car` — depends on T019
- [X] T021 [P] [US2] Write failing tests in `src/http/carPhotoRoute.test.ts`: `200` with bytes + stored `Content-Type` when the storage port has a photo; `404` when `load` returns null — mock `CarPhotoStorage`, fake `req`/`res`
- [X] T022 [US2] Implement `src/http/carPhotoRoute.ts` (public handler: `load(carId)` → stream bytes with content type, else `404`) to pass T021 — depends on T021, T008
- [X] T023 [US2] Mount the photo route at `${PHOTO_PATH}/:carId` on the Express app in `src/server.ts` — depends on T022

**Checkpoint**: US1 + US2 work — photos can be added and viewed publicly.

---

## Phase 5: User Story 3 - Administrator removes a car's photo (Priority: P2)

**Goal**: An administrator removes a car's photo (bytes + metadata); deleting a car also removes its
photo (no orphans).

**Independent Test**: For a car with a seeded photo, `removeCarPhoto` clears metadata and bytes;
non-admin/unauthenticated rejected; deleting a car removes its photo file.

- [X] T024 [P] [US3] Write failing tests in `src/domain/car/carPhotoService.test.ts` for `removeCarPhoto`: calls repository `clearPhoto` and storage `delete` for the car and returns the car; car-not-found → throws — mock `CarPhotoStorage` and `carRepository`
- [X] T025 [US3] Add the `removeCarPhoto` path to `src/domain/car/carPhotoService.ts` to pass T024 — depends on T024, T010, T008
- [X] T026 [P] [US3] Write failing tests in `src/resolvers/mutations/car/removeCarPhoto.test.ts`: unauthenticated → `AuthenticationError`; non-admin → `AuthorizationError`; admin → delegates and returns the car
- [X] T027 [US3] Implement `src/resolvers/mutations/car/removeCarPhoto.ts` (`requireAdministrator`, delegate) and register it under `Mutation` in `src/resolvers.ts` — depends on T026, T025
- [X] T028 [P] [US3] Extend `src/resolvers/mutations/car/deleteCar.test.ts` with a failing case: deleting a car also deletes its photo via the storage port (verify `delete` called with the car id)
- [X] T029 [US3] Modify `src/resolvers/mutations/car/deleteCar.ts` to delete the car's photo bytes through the storage port as part of deletion (FR-005) — depends on T028, T008

**Checkpoint**: All user stories functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification, quality gates, and docs.

- [X] T030 [P] Add integration test `test/integration/carPhotoStorage.integration.test.ts`: against the real local adapter (temp dir) + Docker Mongo — add → load via the route handler, replace, remove, and cascade-on-car-delete leave no orphaned file — depends on T029
- [X] T031 [P] Run `yarn test` (all unit green) and `npx tsc --noEmit`; fix any type/lint issues in new code (no `any`, explicit return types)
- [ ] T032 [P] Execute quickstart scenarios A–F in `specs/002-car-photo-storage/quickstart.md` against a running server with an admin token (note: requires the feature-001 sign-in flow)
- [X] T033 Update `README.md` with the photo endpoints (`addCarPhoto`/`removeCarPhoto`, `GET /photos/:carId`), the base64 upload note, and the local `PHOTO_STORAGE_DIR` demo config

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend only on Foundational.
  - **US1 (P1)** — the MVP (add/replace).
  - **US2 (P1)** and **US3 (P2)** — depend on Foundational, **not** on US1 (they read/remove and can
    seed data directly). US1/US2/US3 may run in parallel after Foundational.
- **Polish (Phase 6)**: Depends on the user stories being delivered.

### Critical path

- T002 → T003 (schema before type regen); many foundational tasks depend on regenerated types.
- T005 (port) → T007/T008 (adapter/factory) → consumed by all stories.
- Registration tasks touch `src/resolvers.ts` (T017, T020, T027) and `src/server.ts` (T023) — keep
  them sequential per file.

### Within each user story

- The `*.test.ts` task (failing) comes first; implementation makes it pass; refactor while green.

---

## Parallel Execution Examples

**Foundational — independent files after T003:**

```bash
Task: T004 Add photo subdoc to src/model/car.ts
Task: T005 Define port in src/storage/carPhotoStorage.ts
Task: T006 Write src/storage/localFileSystemCarPhotoStorage.test.ts
Task: T009 Write src/repository/carRepository.test.ts
```

**After Foundational, the three stories in parallel (different files):**

```bash
# Developer A — US1: T011/T012 validation, T013/T014 service.add, T015/T016 resolver
# Developer B — US2: T018/T019 field resolver, T021/T022 serving route
# Developer C — US3: T024/T025 service.remove, T026/T027 resolver, T028/T029 cascade
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & VALIDATE** (admin can
   store/replace a car photo; invalid uploads rejected) → demo to stakeholders using local storage.

### Incremental Delivery

1. Foundation ready → 2. US1 (add/replace) → 3. US2 (public view + serving) → 4. US3 (remove +
   cascade) → 5. Polish. Each increment is independently testable and adds value.
