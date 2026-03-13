import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { images, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getSession } from "@/lib/auth/session";
import ImageManager from "@/components/admin/image-manager";

export default async function ImagesPage() {
  const csrfToken = await getCsrfToken();
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Images</h1>
      <ImageManager
        initialImages={allImages}
        csrfToken={csrfToken}
        currentUsername={session.username}
      />
    </div>
  );
}
