"use client";

import { useState, useRef, useCallback } from "react";

const ALLOWED_EXTENSIONS = [".mp4", ".webm", ".mov"];
const MAX_SIZE_MB = 500;

export default function VideoUpload({ csrfToken, onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "File type not allowed. Use MP4, WebM, or MOV.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_SIZE_MB}MB limit.`;
    }
    return null;
  };

  const uploadFile = useCallback(
    (file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError("");
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("video", file);

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
            onUploadComplete?.(data);
          } catch {
            setError("Failed to parse upload response");
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

      xhr.open("POST", "/api/admin/video-cropper/upload");
      xhr.setRequestHeader("x-csrf-token", csrfToken);
      xhr.send(formData);
    },
    [csrfToken, onUploadComplete]
  );

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
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.webm,.mov"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Uploading... {progress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600">
              Drop or click to upload a video
            </p>
            <p className="text-xs text-gray-400 mt-1">
              MP4, WebM, or MOV up to {MAX_SIZE_MB}MB
            </p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
