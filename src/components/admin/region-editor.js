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
const SNAP_THRESHOLD_PX = 6;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function snapRegion({ rect, edges, mode, others, panelRect, snapEnabled, shiftHeld }) {
  const thresholdX = SNAP_THRESHOLD_PX / panelRect.width;
  const thresholdY = SNAP_THRESHOLD_PX / panelRect.height;

  const xCandidates = [];
  const yCandidates = [];
  if (snapEnabled) {
    xCandidates.push(0, 1);
    yCandidates.push(0, 1);
    for (const o of others) {
      xCandidates.push(o.x, o.x + o.w);
      yCandidates.push(o.y, o.y + o.h);
    }
  }
  if (shiftHeld) {
    xCandidates.push(0.5);
    yCandidates.push(0.5);
  }

  const guides = [];
  let { x, y, w, h } = rect;

  const pickBest = (probeValues, candidates, threshold) => {
    let best = null;
    for (const pv of probeValues) {
      for (const c of candidates) {
        const d = Math.abs(pv - c);
        if (d < threshold && (best == null || d < best.dist)) {
          best = { dist: d, delta: c - pv, pos: c };
        }
      }
    }
    return best;
  };

  if (mode === "move") {
    const xProbes = [];
    if (edges.left) xProbes.push(x);
    if (edges.right) xProbes.push(x + w);
    if (shiftHeld) xProbes.push(x + w / 2);
    const bestX = pickBest(xProbes, xCandidates, thresholdX);
    if (bestX) {
      x += bestX.delta;
      guides.push({ axis: "x", pos: bestX.pos });
    }

    const yProbes = [];
    if (edges.top) yProbes.push(y);
    if (edges.bottom) yProbes.push(y + h);
    if (shiftHeld) yProbes.push(y + h / 2);
    const bestY = pickBest(yProbes, yCandidates, thresholdY);
    if (bestY) {
      y += bestY.delta;
      guides.push({ axis: "y", pos: bestY.pos });
    }
  } else {
    if (edges.left) {
      const right = x + w;
      const best = pickBest([x], xCandidates, thresholdX);
      if (best && best.pos < right - 0.02) {
        x = best.pos;
        w = right - x;
        guides.push({ axis: "x", pos: best.pos });
      }
    }
    if (edges.right) {
      const best = pickBest([x + w], xCandidates, thresholdX);
      if (best && best.pos > x + 0.02) {
        w = best.pos - x;
        guides.push({ axis: "x", pos: best.pos });
      }
    }
    if (edges.top) {
      const bottom = y + h;
      const best = pickBest([y], yCandidates, thresholdY);
      if (best && best.pos < bottom - 0.02) {
        y = best.pos;
        h = bottom - y;
        guides.push({ axis: "y", pos: best.pos });
      }
    }
    if (edges.bottom) {
      const best = pickBest([y + h], yCandidates, thresholdY);
      if (best && best.pos > y + 0.02) {
        h = best.pos - y;
        guides.push({ axis: "y", pos: best.pos });
      }
    }
  }

  return { x, y, w, h, guides };
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
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [guides, setGuides] = useState({ source: [], canvas: [] });

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

  // Track Shift key for center snapping + guide visibility
  useEffect(() => {
    const onDown = (e) => { if (e.key === "Shift") setShiftHeld(true); };
    const onUp = (e) => { if (e.key === "Shift") setShiftHeld(false); };
    const onBlur = () => setShiftHeld(false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

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
        const panelRect = sourceContainerRef.current.getBoundingClientRect();
        const rawX = Math.min(drawing.startX, pos.x);
        const rawY = Math.min(drawing.startY, pos.y);
        const rawW = Math.abs(pos.x - drawing.startX);
        const rawH = Math.abs(pos.y - drawing.startY);
        const others = regions.map((r) => ({
          x: r.sourceX, y: r.sourceY, w: r.sourceW, h: r.sourceH,
        }));
        const edges = {
          left: pos.x < drawing.startX,
          right: pos.x > drawing.startX,
          top: pos.y < drawing.startY,
          bottom: pos.y > drawing.startY,
        };
        const snapped = snapRegion({
          rect: { x: rawX, y: rawY, w: rawW, h: rawH },
          edges, mode: "draw", others, panelRect, snapEnabled, shiftHeld,
        });
        setGuides((g) => ({ ...g, source: snapped.guides }));
        setDrawing((prev) => ({
          ...prev, x: snapped.x, y: snapped.y, w: snapped.w, h: snapped.h,
        }));
      } else if (dragging) {
        const pos = getSourceNorm(e);
        const panelRect = sourceContainerRef.current.getBoundingClientRect();
        const moving = regions.find((r) => r.id === dragging.id);
        if (!moving) return;
        const rawX = clamp(pos.x - dragging.offsetX, 0, 1 - moving.sourceW);
        const rawY = clamp(pos.y - dragging.offsetY, 0, 1 - moving.sourceH);
        const others = regions
          .filter((r) => r.id !== dragging.id)
          .map((r) => ({ x: r.sourceX, y: r.sourceY, w: r.sourceW, h: r.sourceH }));
        const snapped = snapRegion({
          rect: { x: rawX, y: rawY, w: moving.sourceW, h: moving.sourceH },
          edges: { left: true, right: true, top: true, bottom: true },
          mode: "move", others, panelRect, snapEnabled, shiftHeld,
        });
        const newX = clamp(snapped.x, 0, 1 - moving.sourceW);
        const newY = clamp(snapped.y, 0, 1 - moving.sourceH);
        setGuides((g) => ({ ...g, source: snapped.guides }));
        setRegions((prev) =>
          prev.map((r) => (r.id === dragging.id ? { ...r, sourceX: newX, sourceY: newY } : r))
        );
      } else if (resizing) {
        const pos = getSourceNorm(e);
        const panelRect = sourceContainerRef.current.getBoundingClientRect();
        const { edge, startPos, startRegion } = resizing;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        let sourceX = startRegion.sourceX;
        let sourceY = startRegion.sourceY;
        let sourceW = startRegion.sourceW;
        let sourceH = startRegion.sourceH;

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

        const others = regions
          .filter((r) => r.id !== resizing.id)
          .map((r) => ({ x: r.sourceX, y: r.sourceY, w: r.sourceW, h: r.sourceH }));
        const edges = {
          left: edge.includes("l"),
          right: edge.includes("r"),
          top: edge.includes("t"),
          bottom: edge.includes("b"),
        };
        const snapped = snapRegion({
          rect: { x: sourceX, y: sourceY, w: sourceW, h: sourceH },
          edges, mode: "resize", others, panelRect, snapEnabled, shiftHeld,
        });
        setGuides((g) => ({ ...g, source: snapped.guides }));
        setRegions((prev) =>
          prev.map((r) =>
            r.id === resizing.id
              ? { ...r, sourceX: snapped.x, sourceY: snapped.y, sourceW: snapped.w, sourceH: snapped.h }
              : r
          )
        );
      }
    },
    [drawing, dragging, resizing, getSourceNorm, regions, snapEnabled, shiftHeld]
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
        const panelRect = canvasContainerRef.current.getBoundingClientRect();
        const moving = regions.find((r) => r.id === canvasDragging.id);
        if (!moving) return;
        const rawX = clamp(pos.x - canvasDragging.offsetX, 0, 1 - moving.canvasW);
        const rawY = clamp(pos.y - canvasDragging.offsetY, 0, 1 - moving.canvasH);
        const others = regions
          .filter((r) => r.id !== canvasDragging.id)
          .map((r) => ({ x: r.canvasX, y: r.canvasY, w: r.canvasW, h: r.canvasH }));
        const snapped = snapRegion({
          rect: { x: rawX, y: rawY, w: moving.canvasW, h: moving.canvasH },
          edges: { left: true, right: true, top: true, bottom: true },
          mode: "move", others, panelRect, snapEnabled, shiftHeld,
        });
        const newX = clamp(snapped.x, 0, 1 - moving.canvasW);
        const newY = clamp(snapped.y, 0, 1 - moving.canvasH);
        setGuides((g) => ({ ...g, canvas: snapped.guides }));
        setRegions((prev) =>
          prev.map((r) =>
            r.id === canvasDragging.id ? { ...r, canvasX: newX, canvasY: newY } : r
          )
        );
      } else if (canvasResizing) {
        const pos = getCanvasNorm(e);
        const panelRect = canvasContainerRef.current.getBoundingClientRect();
        const { edge, startPos, startRegion } = canvasResizing;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        let canvasX = startRegion.canvasX;
        let canvasY = startRegion.canvasY;
        let canvasW = startRegion.canvasW;
        let canvasH = startRegion.canvasH;

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

        const others = regions
          .filter((r) => r.id !== canvasResizing.id)
          .map((r) => ({ x: r.canvasX, y: r.canvasY, w: r.canvasW, h: r.canvasH }));
        const edges = {
          left: edge.includes("l"),
          right: edge.includes("r"),
          top: edge.includes("t"),
          bottom: edge.includes("b"),
        };
        const snapped = snapRegion({
          rect: { x: canvasX, y: canvasY, w: canvasW, h: canvasH },
          edges, mode: "resize", others, panelRect, snapEnabled, shiftHeld,
        });
        setGuides((g) => ({ ...g, canvas: snapped.guides }));
        setRegions((prev) =>
          prev.map((r) =>
            r.id === canvasResizing.id
              ? { ...r, canvasX: snapped.x, canvasY: snapped.y, canvasW: snapped.w, canvasH: snapped.h }
              : r
          )
        );
      }
    },
    [canvasDragging, canvasResizing, getCanvasNorm, regions, snapEnabled, shiftHeld]
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
      setGuides({ source: [], canvas: [] });
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

  const renderGuides = (type) => {
    const list = type === "source" ? guides.source : guides.canvas;
    if (!list || list.length === 0) return null;
    return list.map((g, i) => {
      if (g.axis === "x") {
        return (
          <div
            key={`g-${type}-${i}`}
            style={{
              position: "absolute",
              left: `${g.pos * 100}%`,
              top: 0,
              bottom: 0,
              width: 0,
              borderLeft: "1px dashed rgba(255,255,255,0.85)",
              pointerEvents: "none",
              zIndex: 30,
            }}
          />
        );
      }
      return (
        <div
          key={`g-${type}-${i}`}
          style={{
            position: "absolute",
            top: `${g.pos * 100}%`,
            left: 0,
            right: 0,
            height: 0,
            borderTop: "1px dashed rgba(255,255,255,0.85)",
            pointerEvents: "none",
            zIndex: 30,
          }}
        />
      );
    });
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
        <button
          onClick={() => setSnapEnabled((v) => !v)}
          title="Snap region edges/corners to other regions and panel edges. Hold Shift to also snap to center."
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            snapEnabled
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Snap: {snapEnabled ? "On" : "Off"}
        </button>
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
            {renderGuides("source")}
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
            {renderGuides("canvas")}
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
