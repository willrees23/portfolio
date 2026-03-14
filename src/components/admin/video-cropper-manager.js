"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import VideoUpload from "./video-upload";
import RegionEditor from "./region-editor";

export default function VideoCropperManager({ csrfToken }) {
  const [phase, setPhase] = useState("upload"); // upload | edit | processing | result
  const [videoData, setVideoData] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [outputUrl, setOutputUrl] = useState(null);
  const pollRef = useRef(null);

  const handleUploadComplete = useCallback((data) => {
    setVideoData(data);
    setPhase("edit");
  }, []);

  const handleProcess = useCallback(
    async (regions) => {
      setPhase("processing");
      setProgress(0);
      setError("");

      try {
        const res = await fetch("/api/admin/video-cropper/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            videoId: videoData.videoId,
            regions,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to start processing");
          setPhase("edit");
          return;
        }

        const data = await res.json();
        setJobId(data.jobId);
      } catch {
        setError("Network error");
        setPhase("edit");
      }
    },
    [csrfToken, videoData]
  );

  useEffect(() => {
    if (phase !== "processing" || !jobId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/admin/video-cropper/status/${jobId}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setProgress(data.progress || 0);

        if (data.status === "complete") {
          clearInterval(pollRef.current);
          setOutputUrl(data.outputUrl);
          setPhase("result");
        } else if (data.status === "error") {
          clearInterval(pollRef.current);
          setError(data.error || "Processing failed");
          setPhase("edit");
        }
      } catch {
        // ignore transient poll errors
      }
    }, 1500);

    return () => clearInterval(pollRef.current);
  }, [phase, jobId]);

  const handleStartOver = () => {
    setPhase("upload");
    setVideoData(null);
    setJobId(null);
    setProgress(0);
    setError("");
    setOutputUrl(null);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {phase === "upload" && (
        <VideoUpload
          csrfToken={csrfToken}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {phase === "edit" && videoData && (
        <RegionEditor
          videoUrl={videoData.videoUrl}
          videoWidth={videoData.width}
          videoHeight={videoData.height}
          videoDuration={videoData.duration}
          onProcess={handleProcess}
        />
      )}

      {phase === "processing" && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-4">Processing video...</p>
          <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{progress}%</p>
        </div>
      )}

      {phase === "result" && outputUrl && (
        <div className="text-center py-8">
          <p className="text-lg font-medium mb-4">Processing complete</p>
          <video
            src={outputUrl}
            controls
            className="mx-auto mb-6 max-h-[600px] rounded shadow"
          />
          <div className="flex gap-4 justify-center">
            <a
              href={outputUrl}
              download="cropped-video.mp4"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download
            </a>
            <button
              onClick={handleStartOver}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
