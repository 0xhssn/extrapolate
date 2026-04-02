/**
 * Shared file upload validation constants and utilities.
 * Used by both client-side components and server-side actions.
 */

/** Maximum allowed file size in bytes (10 MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Human-readable max file size label */
export const MAX_FILE_SIZE_LABEL = "10 MB";

/** Allowed MIME types for uploaded images */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Human-readable list of accepted file formats */
export const ALLOWED_FORMATS_LABEL = "JPEG, PNG, WebP, GIF";

/** accept string for <input type="file"> */
export const ACCEPT_INPUT_STRING = ALLOWED_MIME_TYPES.join(",");

export type FileValidationError =
  | { type: "size"; message: string }
  | { type: "mime"; message: string }
  | null;

/**
 * Validates a file against size and type restrictions.
 * Returns null when valid, or an error object describing the problem.
 */
export function validateUploadFile(file: File): FileValidationError {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      type: "size",
      message: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      type: "mime",
      message: `Invalid file type "${file.type}". Accepted formats: ${ALLOWED_FORMATS_LABEL}.`,
    };
  }

  return null;
}

/**
 * Server-side guard – validates a File coming from FormData.
 * Returns an error response shape when invalid, or null when valid.
 */
export function validateUploadFileServer(
  file: File,
): { message: string; status: number } | null {
  if (!file || file.size === 0) {
    return { message: "Missing image", status: 400 };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
      status: 413,
    };
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      message: `Invalid file type "${file.type}". Accepted formats: ${ALLOWED_FORMATS_LABEL}.`,
      status: 415,
    };
  }

  return null;
}
