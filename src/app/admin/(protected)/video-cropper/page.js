import { getCsrfToken } from "@/lib/auth/csrf";
import VideoCropperManager from "@/components/admin/video-cropper-manager";

export default async function VideoCropperPage() {
  const csrfToken = await getCsrfToken();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Video Cropper</h1>
      <VideoCropperManager csrfToken={csrfToken} />
    </div>
  );
}
