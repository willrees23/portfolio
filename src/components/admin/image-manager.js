"use client";

import { useState } from "react";
import ImageUpload from "./image-upload";
import ImageGallery from "./image-gallery";

export default function ImageManager({ initialImages, csrfToken, currentUsername }) {
  const [images, setImages] = useState(initialImages);

  function handleUploadComplete(newImage) {
    if (newImage) {
      setImages((prev) => [{
        ...newImage,
        uploaderUsername: currentUsername,
      }, ...prev]);
    }
  }

  function handleDelete(id) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <>
      <ImageUpload csrfToken={csrfToken} onUploadComplete={handleUploadComplete} />
      <ImageGallery images={images} csrfToken={csrfToken} onDelete={handleDelete} />
    </>
  );
}
