"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const REGION_COLORS = [
  "rgba(59,130,246,0.35)",
  "rgba(239,68,68,0.35)",
  "rgba(34,197,94,0.35)",
  "rgba(168,85,247,0.35)",
  "rgba(249,115,22,0.35)",
];
const REGION_BORDERS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#a855f7",
  "#f97316",
];
const HANDLE_SIZE = 8;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function RegionEditor({
  videoUrl,
  videoWidth,
  videoHeight,
  onProcess,
}) {
  const [regions, setRegions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawing, setDrawing] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [canvasDragging, setCanvasDragging] = useState(null);
  const [canvasResizing, setCanvasResizing] = useState(null);

  const videoRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const sourceContainerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Generate region ID
  const nextId = useRef(1);
  const genId = () => nextId.current++;

  // Real-time preview loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = previewCanvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const draw = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      regions.forEach((r) => {
        const sx = r.sourceX * videoWidth;
        const sy = r.sourceY * videoHeight;
        const sw = r.sourceW * videoWidth;
        const sh = r.sourceH * videoHeight;
        const dx = r.canvasX * CANVAS_WIDTH;
        const dy = r.canvasY * CANVAS_HEIGHT;
        const dw = r.canvasW * CANVAS_WIDTH;
        const dh = r.canvasH * CANVAS_HEIGHT;

        if (sw > 0 && sh > 0 && dw > 0 && dh > 0) {
          ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
        }
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [regions, videoWidth, videoHeight]);

  // Keyboard handler for delete
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId != null) {
        // Don't delete if user is typing in an input
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        setRegions((prev) => prev.filter((r) => r.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId]);

  // --- Source panel interactions ---
  const getSourceNorm = useCallback(
    (e) => {
      const rect = sourceContainerRef.current.getBoundingClientRect();
      return {
        x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
      };
    },
    []
  );

  const handleSourceMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const pos = getSourceNorm(e);

      // Check if clicking on a resize handle of selected region
      if (selectedId != null) {
        const region = regions.find((r) => r.id === selectedId);
        if (region) {
          const rect = sourceContainerRef.current.getBoundingClientRect();
          const handlePx = HANDLE_SIZE / Math.min(rect.width, rect.height);
          const corners = [
            { edge: "tl", x: region.sourceX, y: region.sourceY },
            { edge: "tr", x: region.sourceX + region.sourceW, y: region.sourceY },
            { edge: "bl", x: region.sourceX, y: region.sourceY + region.sourceH },
            { edge: "br", x: region.sourceX + region.sourceW, y: region.sourceY + region.sourceH },
          ];
          for (const c of corners) {
            if (Math.abs(pos.x - c.x) < handlePx * 2 && Math.abs(pos.y - c.y) < handlePx * 2) {
              e.preventDefault();
              setResizing({ id: region.id, edge: c.edge, startPos: pos, startRegion: { ...region } });
              return;
            }
          }
        }
      }

      // Check if clicking inside an existing region to drag
      for (let i = regions.length - 1; i >= 0; i--) {
        const r = regions[i];
        if (
          pos.x >= r.sourceX &&
          pos.x <= r.sourceX + r.sourceW &&
          pos.y >= r.sourceY &&
          pos.y <= r.sourceY + r.sourceH
        ) {
          e.preventDefault();
          setSelectedId(r.id);
          setDragging({
            id: r.id,
            offsetX: pos.x - r.sourceX,
            offsetY: pos.y - r.sourceY,
          });
          return;
        }
      }

      // Start drawing a new region
      e.preventDefault();
      setDrawing({ startX: pos.x, startY: pos.y });
      setSelectedId(null);
    },
    [regions, selectedId, getSourceNorm]
  );

  const handleSourceMouseMove = useCallback(
    (e) => {
      if (drawing) {
        const pos = getSourceNorm(e);
        const x = Math.min(drawing.startX, pos.x);
        const y = Math.min(drawing.startY, pos.y);
        const w = Math.abs(pos.x - drawing.startX);
        const h = Math.abs(pos.y - drawing.startY);
        setDrawing((prev) => ({ ...prev, x, y, w, h }));
      } else if (dragging) {
        const pos = getSourceNorm(e);
        setRegions((prev) =>
          prev.map((r) => {
            if (r.id !== dragging.id) return r;
            const newX = clamp(pos.x - dragging.offsetX, 0, 1 - r.sourceW);
            const newY = clamp(pos.y - dragging.offsetY, 0, 1 - r.sourceH);
            return { ...r, sourceX: newX, sourceY: newY };
          })
        );
      } else if (resizing) {
        const pos = getSourceNorm(e);
        const { edge, startPos, startRegion } = resizing;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        setRegions((prev) =>
          prev.map((r) => {
            if (r.id !== resizing.id) return r;
            let { sourceX, sourceY, sourceW, sourceH } = startRegion;

            if (edge.includes("l")) {
              const newX = clamp(sourceX + dx, 0, sourceX + sourceW - 0.02);
              sourceW = sourceW - (newX - sourceX);
              sourceX = newX;
            }
            if (edge.includes("r")) {
              sourceW = clamp(sourceW + dx, 0.02, 1 - sourceX);
            }
            if (edge.includes("t")) {
              const newY = clamp(sourceY + dy, 0, sourceY + sourceH - 0.02);
              sourceH = sourceH - (newY - sourceY);
              sourceY = newY;
            }
            if (edge.includes("b")) {
              sourceH = clamp(sourceH + dy, 0.02, 1 - sourceY);
            }

            return { ...r, sourceX, sourceY, sourceW, sourceH };
          })
        );
      }
    },
    [drawing, dragging, resizing, getSourceNorm]
  );

  const handleSourceMouseUp = useCallback(() => {
    if (drawing && drawing.w > 0.01 && drawing.h > 0.01) {
      const id = genId();
      const newRegion = {
        id,
        sourceX: drawing.x,
        sourceY: drawing.y,
        sourceW: drawing.w,
        sourceH: drawing.h,
        canvasX: 0,
        canvasY: regions.length * 0.3,
        canvasW: 1,
        canvasH: 0.3,
      };
      setRegions((prev) => [...prev, newRegion]);
      setSelectedId(id);
    }
    setDrawing(null);
    setDragging(null);
    setResizing(null);
  }, [drawing, regions.length]);

  // --- Canvas panel interactions ---
  const getCanvasNorm = useCallback((e) => {
    const rect = canvasContainerRef.current.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
    };
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const pos = getCanvasNorm(e);

      // Check resize handles on selected region
      if (selectedId != null) {
        const region = regions.find((r) => r.id === selectedId);
        if (region) {
          const rect = canvasContainerRef.current.getBoundingClientRect();
          const handlePx = HANDLE_SIZE / Math.min(rect.width, rect.height);
          const corners = [
            { edge: "tl", x: region.canvasX, y: region.canvasY },
            { edge: "tr", x: region.canvasX + region.canvasW, y: region.canvasY },
            { edge: "bl", x: region.canvasX, y: region.canvasY + region.canvasH },
            { edge: "br", x: region.canvasX + region.canvasW, y: region.canvasY + region.canvasH },
          ];
          for (const c of corners) {
            if (Math.abs(pos.x - c.x) < handlePx * 2 && Math.abs(pos.y - c.y) < handlePx * 2) {
              e.preventDefault();
              setCanvasResizing({ id: region.id, edge: c.edge, startPos: pos, startRegion: { ...region } });
              return;
            }
          }
        }
      }

      // Check if clicking inside a canvas region to drag
      for (let i = regions.length - 1; i >= 0; i--) {
        const r = regions[i];
        if (
          pos.x >= r.canvasX &&
          pos.x <= r.canvasX + r.canvasW &&
          pos.y >= r.canvasY &&
          pos.y <= r.canvasY + r.canvasH
        ) {
          e.preventDefault();
          setSelectedId(r.id);
          setCanvasDragging({
            id: r.id,
            offsetX: pos.x - r.canvasX,
            offsetY: pos.y - r.canvasY,
          });
          return;
        }
      }

      setSelectedId(null);
    },
    [regions, selectedId, getCanvasNorm]
  );

  const handleCanvasMouseMove = useCallback(
    (e) => {
      if (canvasDragging) {
        const pos = getCanvasNorm(e);
        setRegions((prev) =>
          prev.map((r) => {
            if (r.id !== canvasDragging.id) return r;
            const newX = clamp(pos.x - canvasDragging.offsetX, 0, 1 - r.canvasW);
            const newY = clamp(pos.y - canvasDragging.offsetY, 0, 1 - r.canvasH);
            return { ...r, canvasX: newX, canvasY: newY };
          })
        );
      } else if (canvasResizing) {
        const pos = getCanvasNorm(e);
        const { edge, startPos, startRegion } = canvasResizing;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        setRegions((prev) =>
          prev.map((r) => {
            if (r.id !== canvasResizing.id) return r;
            let { canvasX, canvasY, canvasW, canvasH } = startRegion;

            if (edge.includes("l")) {
              const newX = clamp(canvasX + dx, 0, canvasX + canvasW - 0.02);
              canvasW = canvasW - (newX - canvasX);
              canvasX = newX;
            }
            if (edge.includes("r")) {
              canvasW = clamp(canvasW + dx, 0.02, 1 - canvasX);
            }
            if (edge.includes("t")) {
              const newY = clamp(canvasY + dy, 0, canvasY + canvasH - 0.02);
              canvasH = canvasH - (newY - canvasY);
              canvasY = newY;
            }
            if (edge.includes("b")) {
              canvasH = clamp(canvasH + dy, 0.02, 1 - canvasY);
            }

            return { ...r, canvasX, canvasY, canvasW, canvasH };
          })
        );
      }
    },
    [canvasDragging, canvasResizing, getCanvasNorm]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setCanvasDragging(null);
    setCanvasResizing(null);
  }, []);

  // Global mouseup to handle dragging outside panels
  useEffect(() => {
    const handleUp = () => {
      setDrawing(null);
      setDragging(null);
      setResizing(null);
      setCanvasDragging(null);
      setCanvasResizing(null);
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  const deleteSelected = () => {
    if (selectedId != null) {
      setRegions((prev) => prev.filter((r) => r.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleProcessClick = () => {
    if (regions.length === 0) return;
    onProcess(
      regions.map((r) => ({
        sourceX: r.sourceX,
        sourceY: r.sourceY,
        sourceW: r.sourceW,
        sourceH: r.sourceH,
        canvasX: r.canvasX,
        canvasY: r.canvasY,
        canvasW: r.canvasW,
        canvasH: r.canvasH,
      }))
    );
  };

  const renderRegionOverlays = (type) => {
    const isSource = type === "source";
    return regions.map((r, i) => {
      const colorIndex = i % REGION_COLORS.length;
      const x = isSource ? r.sourceX : r.canvasX;
      const y = isSource ? r.sourceY : r.canvasY;
      const w = isSource ? r.sourceW : r.canvasW;
      const h = isSource ? r.sourceH : r.canvasH;
      const isSelected = r.id === selectedId;

      return (
        <div
          key={r.id}
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: `${w * 100}%`,
            height: `${h * 100}%`,
            backgroundColor: REGION_COLORS[colorIndex],
            border: `2px solid ${REGION_BORDERS[colorIndex]}`,
            boxSizing: "border-box",
            outline: isSelected ? "2px solid white" : "none",
            outlineOffset: "1px",
            zIndex: isSelected ? 10 : 1,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: 4,
              fontSize: 11,
              color: "white",
              fontWeight: 600,
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              pointerEvents: "none",
            }}
          >
            {i + 1}
          </span>
          {isSelected && (
            <>
              {["tl", "tr", "bl", "br"].map((corner) => {
                const isLeft = corner.includes("l");
                const isTop = corner.includes("t");
                return (
                  <div
                    key={corner}
                    style={{
                      position: "absolute",
                      width: HANDLE_SIZE,
                      height: HANDLE_SIZE,
                      backgroundColor: "white",
                      border: `1px solid ${REGION_BORDERS[colorIndex]}`,
                      left: isLeft ? -HANDLE_SIZE / 2 : "auto",
                      right: isLeft ? "auto" : -HANDLE_SIZE / 2,
                      top: isTop ? -HANDLE_SIZE / 2 : "auto",
                      bottom: isTop ? "auto" : -HANDLE_SIZE / 2,
                      cursor:
                        corner === "tl" || corner === "br"
                          ? "nwse-resize"
                          : "nesw-resize",
                      zIndex: 20,
                    }}
                  />
                );
              })}
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded border">
        <span className="text-sm text-gray-600">
          {regions.length === 0
            ? "Draw a region on the source video to begin"
            : `${regions.length} region${regions.length > 1 ? "s" : ""}`}
        </span>
        <div className="flex-1" />
        {selectedId != null && (
          <button
            onClick={deleteSelected}
            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Delete Selected
          </button>
        )}
        <button
          onClick={handleProcessClick}
          disabled={regions.length === 0}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Process Video
        </button>
      </div>

      {/* Panels */}
      <div className="flex gap-6 items-start">
        {/* Source panel */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Source Video
          </h3>
          <div
            ref={sourceContainerRef}
            className="relative bg-black rounded overflow-hidden select-none"
            style={{ aspectRatio: `${videoWidth} / ${videoHeight}` }}
            onMouseDown={handleSourceMouseDown}
            onMouseMove={handleSourceMouseMove}
            onMouseUp={handleSourceMouseUp}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              loop
              muted
              autoPlay
              playsInline
              className="w-full h-full object-contain pointer-events-none"
            />
            {renderRegionOverlays("source")}
            {/* Drawing preview */}
            {drawing && drawing.w > 0 && drawing.h > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `${drawing.x * 100}%`,
                  top: `${drawing.y * 100}%`,
                  width: `${drawing.w * 100}%`,
                  height: `${drawing.h * 100}%`,
                  border: "2px dashed white",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Canvas panel */}
        <div style={{ width: 240 }} className="flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Portrait Output (9:16)
          </h3>
          <div
            ref={canvasContainerRef}
            className="relative bg-black rounded overflow-hidden select-none"
            style={{ aspectRatio: "9 / 16" }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full"
            />
            {renderRegionOverlays("canvas")}
          </div>
        </div>
      </div>

      {/* Region list */}
      {regions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Regions</h3>
          <div className="space-y-1">
            {regions.map((r, i) => (
              <div
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm cursor-pointer transition-colors ${
                  r.id === selectedId
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-transparent hover:bg-gray-100"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor: REGION_BORDERS[i % REGION_BORDERS.length],
                  }}
                />
                <span>Region {i + 1}</span>
                <span className="text-gray-400 text-xs ml-auto">
                  {Math.round(r.sourceW * videoWidth)}x
                  {Math.round(r.sourceH * videoHeight)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
