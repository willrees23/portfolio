import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import fs from "fs/promises";
import path from "path";

const VIDEO_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads", "videos");

const FILENAME_REGEX = /^[a-f0-9]{32}\.(mp4|webm|mov)$/;

const MIME_TYPES = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(request, { params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;

  if (!FILENAME_REGEX.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(VIDEO_DIR, filename);
  if (!filePath.startsWith(VIDEO_DIR)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const ext = "." + filename.split(".").pop();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const fileSize = stat.size;

  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const buffer = await fs.readFile(filePath);
      const chunk = buffer.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": String(chunk.length),
          "Accept-Ranges": "bytes",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  const buffer = await fs.readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
