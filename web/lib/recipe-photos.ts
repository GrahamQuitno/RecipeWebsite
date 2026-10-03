import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const RECIPE_PHOTO_BUCKET = "recipe-photos";
export const RECIPE_PHOTO_MAX_BYTES = 3 * 1024 * 1024;

const acceptedTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) =>
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 },
} as const;

export class RecipePhotoValidationError extends Error {}

export async function uploadRecipePhoto(file: File): Promise<string> {
  if (file.size === 0) {
    throw new RecipePhotoValidationError("Choose a photo to upload.");
  }
  if (file.size > RECIPE_PHOTO_MAX_BYTES) {
    throw new RecipePhotoValidationError("Choose a photo no larger than 3 MiB.");
  }

  const type = acceptedTypes[file.type as keyof typeof acceptedTypes];
  if (!type) {
    throw new RecipePhotoValidationError("Use a JPEG, PNG, or WebP photo.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!type.signature(bytes)) {
    throw new RecipePhotoValidationError("The selected file does not match its image type.");
  }

  const path = `recipes/${randomUUID()}.${type.extension}`;
  const { error } = await getSupabaseAdmin()
    .storage
    .from(RECIPE_PHOTO_BUCKET)
    .upload(path, Buffer.from(bytes), {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;
  return path;
}

export async function deleteRecipePhoto(path: string): Promise<void> {
  if (!/^recipes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(path)) {
    throw new Error("Invalid stored photo path.");
  }

  const { error } = await getSupabaseAdmin().storage.from(RECIPE_PHOTO_BUCKET).remove([path]);
  if (error) throw error;
}
