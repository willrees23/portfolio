"use client";

import { useState } from "react";

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export default function ImageGallery({ images, csrfToken, onDelete }) {
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    const res = await fetch(`/api/admin/images/${id}`, {
      method: "DELETE",
      headers: { "x-csrf-token": csrfToken },
    });

    if (res.ok) {
      onDelete?.(id);
      if (preview?.id === id) setPreview(null);
    }
  }

  function copyLink(filename) {
    const baseUrl = window.location.origin;
    copyToClipboard(`${baseUrl}/api/images/${filename}`);
    setCopied(filename);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      {images.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              <div
                className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer"
                onClick={() => setPreview(img)}
              >
                <img
                  src={`/api/images/${img.storedFilename}`}
                  alt={img.originalFilename}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate" title={img.originalFilename}>
                  {img.originalFilename}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(img.fileSize)} &middot; {img.uploaderUsername}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(img.createdAt)}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => copyLink(img.storedFilename)}
                    className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copied === img.storedFilename ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
          onClick={() => setPreview(null)}
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">{preview.originalFilename}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(preview.fileSize)} &middot; {preview.mimeType} &middot; {preview.uploaderUsername}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <img
              src={`/api/images/${preview.storedFilename}`}
              alt={preview.originalFilename}
              className="max-w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
