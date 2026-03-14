import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { validateCsrfToken } from "@/lib/auth/csrf";
import { createJob, updateJob, cleanupJobs } from "@/lib/video-jobs";
import { processVideo, probeVideo } from "@/lib/video-processing";
import crypto from "crypto";
import path from "path";

const VIDEO_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads", "videos");

function validateRegions(regions) {
  if (!Array.isArray(regions) || regions.length === 0) return false;
  return regions.every((r) => {
    const fields = [
      "sourceX", "sourceY", "sourceW", "sourceH",
      "canvasX", "canvasY", "canvasW", "canvasH",
    ];
    return fields.every((f) => {
      const v = r[f];
      return typeof v === "number" && v >= 0 && v <= 1;
    }) && r.sourceW > 0 && r.sourceH > 0 && r.canvasW > 0 && r.canvasH > 0;
  });
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { videoId, regions } = body;

  if (!videoId || typeof videoId !== "string") {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  if (!validateRegions(regions)) {
    return NextResponse.json(
      { error: "Invalid regions. Need at least 1 region with all values between 0 and 1." },
      { status: 400 }
    );
  }

  const inputPath = path.join(VIDEO_DIR, videoId);
  if (!inputPath.startsWith(VIDEO_DIR)) {
    return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
  }

  const jobId = crypto.randomBytes(16).toString("hex");
  const outputFilename = crypto.randomBytes(16).toString("hex") + ".mp4";
  const outputPath = path.join(VIDEO_DIR, outputFilename);

  createJob(jobId, { videoId, outputFilename });

  // Clean up old jobs periodically
  cleanupJobs();

  // Spawn FFmpeg processing without awaiting
  (async () => {
    try {
      const probe = await probeVideo(inputPath);
      await processVideo(
        inputPath,
        outputPath,
        regions,
        probe.width,
        probe.height,
        1080,
        1920,
        probe.duration,
        (progress) => updateJob(jobId, { progress })
      );
      updateJob(jobId, {
        status: "complete",
        progress: 100,
        outputUrl: `/api/admin/video-cropper/files/${outputFilename}`,
      });
    } catch (err) {
      updateJob(jobId, {
        status: "error",
        error: err.message || "Processing failed",
      });
    }
  })();

  return NextResponse.json({ jobId });
}
