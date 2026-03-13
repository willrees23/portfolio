"use client";

import { useState, useRef, useCallback } from "react";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_SIZE_MB = 10;

export default function ImageUpload({ csrfToken, onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "File type not allowed. Use PNG, JPG, GIF, or WebP.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_SIZE_MB}MB limit.`;
    }
    return null;
  };

  const uploadFile = useCallback((file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      setUploading(false);
      if (xhr.status === 201) {
        try {
          const data = JSON.parse(xhr.responseText);
          onUploadComplete?.(data.image);
        } catch {
          onUploadComplete?.();
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || "Upload failed");
        } catch {
          setError("Upload failed");
        }
      }
    });

    xhr.addEventListener("error", () => {
      setUploading(false);
      setError("Network error during upload");
    });

    xhr.open("POST", "/api/admin/images");
    xhr.setRequestHeader("x-csrf-token", csrfToken);
    xhr.send(formData);
  }, [csrfToken, onUploadComplete]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  return (
    <div className="mb-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gif,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">Uploading... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600">Drop an image here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WebP up to {MAX_SIZE_MB}MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
