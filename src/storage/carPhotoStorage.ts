// Platform-agnostic storage port. The domain depends on this interface, never on a storage
// technology. The local filesystem adapter implements it now; cloud adapters can implement it later
// with no change to callers.

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
