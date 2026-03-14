import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { validateCsrfToken } from "@/lib/auth/csrf";
import { logAudit } from "@/lib/audit";
import { probeVideo } from "@/lib/video-processing";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const VIDEO_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads", "videos");

const ALLOWED_EXTENSIONS = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const MAX_SIZE = 500 * 1024 * 1024; // 500MB

function validateVideoBytes(buffer, ext) {
  const bytes = new Uint8Array(buffer);
  if (ext === ".mp4" || ext === ".mov") {
    // ftyp box at offset 4
    return (
      bytes.length > 8 &&
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    );
  }
  if (ext === ".webm") {
    // EBML header
    return (
      bytes.length > 4 &&
      bytes[0] === 0x1a &&
      bytes[1] === 0x45 &&
      bytes[2] === 0xdf &&
      bytes[3] === 0xa3
    );
  }
  return false;
}

export async function POST(request) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("video");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS[ext]) {
    return NextResponse.json({ error: `File type "${ext}" is not allowed` }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 500MB limit" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  if (!validateVideoBytes(buffer, ext)) {
    return NextResponse.json({ error: "File content does not match its extension" }, { status: 400 });
  }

  const storedFilename = crypto.randomBytes(16).toString("hex") + ext;
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  const filePath = path.join(VIDEO_DIR, storedFilename);

  if (!filePath.startsWith(VIDEO_DIR)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  await fs.writeFile(filePath, Buffer.from(buffer));

  let probeData;
  try {
    probeData = await probeVideo(filePath);
  } catch (err) {
    await fs.unlink(filePath).catch(() => {});
    return NextResponse.json({ error: "Could not read video metadata. Is FFmpeg installed?" }, { status: 500 });
  }

  await logAudit({
    actorUserId: session.userId,
    actionType: "video_upload",
    targetType: "video",
    targetId: storedFilename,
    metadata: { originalFilename: file.name, storedFilename },
  });

  return NextResponse.json({
    videoId: storedFilename,
    videoUrl: `/api/admin/video-cropper/files/${storedFilename}`,
    width: probeData.width,
    height: probeData.height,
    duration: probeData.duration,
  }, { status: 201 });
}
