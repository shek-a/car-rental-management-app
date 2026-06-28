# Data Model: Car Photo Storage

**Feature**: `002-car-photo-storage` | **Date**: 2026-06-28

This feature adds a **photo** to the existing `Car` aggregate. Image **bytes** live in a pluggable
storage provider (local filesystem now); only **metadata** is persisted in Mongo on the `Car`.

## Boundary map

```
GraphQL addCarPhoto (base64 + contentType, admin only)
      │  validate (magic bytes + size)
      ▼
CarPhotoService ──> CarPhotoStorage port ──> bytes  (LocalFileSystemCarPhotoStorage → disk)
      │
      └─────────────> Car aggregate ──> photo metadata (Mongo: Car collection)

GET /photos/:carId (public) ──> CarPhotoStorage.load ──> streams bytes
Car.photo (GraphQL field) ──> { url, contentType }   (url points at the route above)
```

## Domain entity: Car (aggregate root — extended)

The existing `Car` gains one optional, embedded photo-metadata value object.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `carId` | ID | yes | Existing identifier. |
| `make`, `model`, `type`, `costPerDay`, ... | — | — | Existing fields, unchanged. |
| `photo` | CarPhotoMetadata | no | **New.** Present when the car has a photo; absent/null otherwise. |

## Value object: CarPhotoMetadata (embedded on Car)

Immutable record describing the stored photo. Identity-less — replaced wholesale on add/replace.

| Field | Type | Notes |
|-------|------|-------|
| `contentType` | String | One of the supported types (JPEG/PNG/WebP), determined by validation. |
| `storageKey` | String | Key used by the storage provider. Deterministic from `carId` (one photo per car). |
| `addedAt` | Date | When the photo was added/replaced. |

**Not exposed via GraphQL directly.** The `Car.photo` GraphQL field is derived (see below); the raw
`storageKey` stays internal.

## GraphQL projection: CarPhoto (derived, read side)

What clients see. Built by the `Car.photo` field resolver from `CarPhotoMetadata`.

| Field | Type | Notes |
|-------|------|-------|
| `url` | String! | `{AUTH_BASE_URL}{PHOTO_PATH}/{carId}` — the public serving endpoint. |
| `contentType` | String! | Mirrors the stored content type. |

`Car.photo` is **null** when the car has no `CarPhotoMetadata`.

## Storage port: CarPhotoStorage (infrastructure boundary)

Conceptual contract (full signature in `contracts/storage-port.contract.md`). Speaks domain language
(car id + bytes), never a vendor API.

| Operation | Meaning |
|-----------|---------|
| `save(carId, bytes, contentType)` | Store/overwrite the car's photo bytes. |
| `load(carId)` | Return the car's photo bytes + content type, or null. |
| `delete(carId)` | Remove the car's photo bytes (no-op if none). |

## Invariants

- A car has **at most one** photo. Adding when one exists **replaces** it (overwrite bytes + update
  metadata) — FR-008.
- `Car.photo` metadata exists **iff** bytes exist in the storage provider for that car. The service
  keeps them consistent: write bytes then set metadata on add; clear metadata then delete bytes on
  remove. A failed/invalid upload changes neither (FR-011).
- Deleting a car deletes its photo bytes and metadata — no orphaned files (FR-005).
- Only a supported, signature-verified image within the size limit may become a `CarPhotoMetadata`
  (FR-009, FR-010).

## State transitions

```
no photo ──addCarPhoto(valid)──> has photo
has photo ──addCarPhoto(valid)──> has photo (replaced)
has photo ──removeCarPhoto────────> no photo
has photo ──deleteCar─────────────> (car gone; photo bytes + metadata removed)
any ──addCarPhoto(invalid)────────> unchanged (FR-011)
```

## Mapping to functional requirements

| Requirement | Data-model element |
|-------------|--------------------|
| FR-001/004 | `addCarPhoto` / `removeCarPhoto` → `CarPhotoService` → port + `Car.photo` metadata |
| FR-002 | admin-only guard on the mutations (reused from feature 001) |
| FR-003 | `storageKey` derived per car; metadata embedded on the one Car |
| FR-005 | cascade delete in `deleteCar` |
| FR-006/007 | public `GET /photos/:carId`; `Car.photo` null when absent |
| FR-008 | single embedded `photo`; add overwrites |
| FR-009/010 | validation sets `contentType`; size checked before store |
| FR-011 | write-bytes-then-metadata ordering; invalid upload is a no-op |
