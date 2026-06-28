import { PHOTO_STORAGE_DIR } from "@/config/config";
import { CarPhotoStorage } from "./carPhotoStorage";
import { createLocalFileSystemCarPhotoStorage } from "./localFileSystemCarPhotoStorage";

// The single place the active storage adapter is selected. Swapping to a cloud adapter later means
// changing only this function — the domain, resolvers, and serving route are unaffected.

let activeStorage: CarPhotoStorage | null = null;

export const carPhotoStorage = (): CarPhotoStorage => {
  if (!activeStorage) {
    activeStorage = createLocalFileSystemCarPhotoStorage(PHOTO_STORAGE_DIR);
  }
  return activeStorage;
};
