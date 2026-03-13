import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { validateCsrfToken } from "@/lib/auth/csrf";
import { deleteImage } from "@/lib/upload";
import { logAudit } from "@/lib/audit";

export async function DELETE(request, { params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrfValid = validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { id } = await params;
  const imageId = parseInt(id, 10);
  if (isNaN(imageId)) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
  }

  const [image] = await db.select().from(images).where(eq(images.id, imageId)).limit(1);
  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  try {
    await deleteImage(image.storedFilename);
  } catch {
    // File may already be deleted from disk
  }

  await db.delete(images).where(eq(images.id, imageId));

  await logAudit({
    actorUserId: session.userId,
    actionType: "image_delete",
    targetType: "image",
    targetId: imageId,
    metadata: { originalFilename: image.originalFilename, storedFilename: image.storedFilename },
  });

  return NextResponse.json({ success: true });
}
