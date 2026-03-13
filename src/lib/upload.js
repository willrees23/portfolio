import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

const ALLOWED_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const MAGIC_BYTES = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": null, // checked separately: RIFF....WEBP
};

function checkMagicBytes(buffer, mimeType) {
  if (mimeType === "image/webp") {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 &&
      buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 &&
      buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }
  const expected = MAGIC_BYTES[mimeType];
  if (!expected) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

export function validateImage(file, buffer) {
  const ext = path.extname(file.name).toLowerCase();
  const mimeType = ALLOWED_TYPES[ext];

  if (!mimeType) {
    return { valid: false, error: `File type "${ext}" is not allowed` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  if (!checkMagicBytes(new Uint8Array(buffer), mimeType)) {
    return { valid: false, error: "File content does not match its extension" };
  }

  return { valid: true, mimeType, ext };
}

export function generateFilename(ext) {
  return crypto.randomBytes(16).toString("hex") + ext;
}

export async function saveImage(buffer, filename) {
  const uploadDir = path.resolve(UPLOAD_DIR);
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);

  // Path traversal check
  if (!filePath.startsWith(uploadDir)) {
    throw new Error("Invalid filename");
  }

  await fs.writeFile(filePath, Buffer.from(buffer));
  return filePath;
}

export async function deleteImage(filename) {
  const uploadDir = path.resolve(UPLOAD_DIR);
  const filePath = path.join(uploadDir, filename);

  if (!filePath.startsWith(uploadDir)) {
    throw new Error("Invalid filename");
  }

  await fs.unlink(filePath);
}

export function getImagePath(filename) {
  const uploadDir = path.resolve(UPLOAD_DIR);
  const filePath = path.join(uploadDir, filename);

  if (!filePath.startsWith(uploadDir)) {
    throw new Error("Invalid filename");
  }

  return filePath;
}
