# Storage Port Contract: CarPhotoStorage

**Feature**: `002-car-photo-storage`

The platform-agnostic seam. The domain depends on this interface; storage technologies implement it.
This iteration ships one implementation (`LocalFileSystemCarPhotoStorage`); cloud adapters implement
the same contract later with no change to callers.

## Interface

```ts
export interface StoredPhoto {
  bytes: Buffer;
  contentType: string;
}

export interface CarPhotoStorage {
  /** Store or overwrite the photo bytes for a car. */
  save(carId: string, bytes: Buffer, contentType: string): Promise<void>;

  /** Return the car's photo bytes + content type, or null if none. */
  load(carId: string): Promise<StoredPhoto | null>;

  /** Remove the car's photo bytes. No-op if none exist. */
  delete(carId: string): Promise<void>;
}
```

## Behavioural contract (every adapter MUST satisfy)

1. `save` is **idempotent on the key**: calling it again for the same `carId` overwrites (replace).
2. After `save(carId, b, ct)`, `load(carId)` returns `{ bytes: b, contentType: ct }`.
3. `load` returns `null` (never throws) when the car has no stored photo.
4. `delete` succeeds whether or not a photo exists (no-op when absent).
5. Adapters MUST NOT interpret bytes — validation happens before `save` in the domain service.
6. `carId` is used to derive the storage key; adapters MUST keep distinct cars' photos distinct.

## Active-adapter selection

`carPhotoStorageProvider` returns the configured `CarPhotoStorage`. Only
`LocalFileSystemCarPhotoStorage` is wired now; this factory is the single place a future cloud
adapter is selected — no domain/resolver/serving change required.

## LocalFileSystemCarPhotoStorage (this iteration)

- Writes bytes to `PHOTO_STORAGE_DIR/<carId>.<ext>` where `<ext>` derives from the content type.
- `load` reads the file and infers the content type from the stored extension/metadata.
- `delete` unlinks the file if present.
- `PHOTO_STORAGE_DIR` is created on demand and is git-ignored (demo uploads are not committed).
