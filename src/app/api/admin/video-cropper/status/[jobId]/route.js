import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getJob } from "@/lib/video-jobs";

export async function GET(request, { params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    error: job.error,
    outputUrl: job.outputUrl,
  });
}
