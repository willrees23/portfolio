import { NextResponse } from "next/server";
import { getImagePath } from "@/lib/upload";
import fs from "fs/promises";

const FILENAME_REGEX = /^[a-f0-9]{32}\.(png|jpg|jpeg|gif|webp)$/;

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(request, { params }) {
  const { filename } = await params;

  if (!FILENAME_REGEX.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const filePath = getImagePath(filename);
    const buffer = await fs.readFile(filePath);
    const ext = "." + filename.split(".").pop();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
