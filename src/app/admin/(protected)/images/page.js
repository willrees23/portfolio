import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { images, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCsrfToken } from "@/lib/auth/csrf";
import ImageUpload from "@/components/admin/image-upload";
import ImageGallery from "@/components/admin/image-gallery";

export default async function ImagesPage() {
  const csrfToken = await getCsrfToken();

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
      <ImageUpload csrfToken={csrfToken} />
      <ImageGallery images={allImages} csrfToken={csrfToken} />
    </div>
  );
}
