import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { images, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { validateCsrfToken } from "@/lib/auth/csrf";
import { validateImage, generateFilename, saveImage } from "@/lib/upload";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allImages = await db
    .select({
      id: images.id,
      storedFilename: images.storedFilename,
      originalFilename: images.originalFilename,
      mimeType: images.mimeType,
      fileSize: images.fileSize,
      createdAt: images.createdAt,
      uploaderUsername: users.username,
    })
    .from(images)
    .leftJoin(users, eq(images.uploadedBy, users.id))
    .orderBy(desc(images.createdAt));

  return NextResponse.json({ images: allImages });
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
  const file = formData.get("image");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No image file provided" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const validation = validateImage(file, buffer);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const storedFilename = generateFilename(validation.ext);
  const filePath = await saveImage(buffer, storedFilename);

  const [inserted] = await db.insert(images).values({
    storedFilename,
    originalFilename: file.name,
    filePath,
    mimeType: validation.mimeType,
    fileSize: file.size,
    uploadedBy: session.userId,
  }).returning();

  await logAudit({
    actorUserId: session.userId,
    actionType: "image_upload",
    targetType: "image",
    targetId: inserted.id,
    metadata: { originalFilename: file.name, storedFilename },
  });

  return NextResponse.json({ image: inserted }, { status: 201 });
}
