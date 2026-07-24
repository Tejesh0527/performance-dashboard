'use client';

import { useRef, useEffect, useCallback, useState, type DependencyList } from 'react';
import { setupCanvas } from '@/lib/canvasUtils';
import { lttbDownsample } from '@/lib/performanceUtils';
import type { RenderContext, DataPoint, ViewRange, ZoomState } from '@/lib/types';

// ─── useChartRenderer ─────────────────────────────────────────────────────────

export function useChartRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  renderFn: (rc: RenderContext) => void,
  deps: DependencyList = [],
) {
  const rafRef   = useRef<number>(0);
  const rcRef    = useRef<RenderContext | null>(null);
  const dirtyRef = useRef(true);

  // Mark dirty whenever deps change
  useEffect(() => { dirtyRef.current = true; }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      if (!canvasRef.current) return;
      rcRef.current    = setupCanvas(canvasRef.current);
      dirtyRef.current = true;
    });
    observer.observe(canvas);
    rcRef.current = setupCanvas(canvas);

    return () => observer.disconnect();
  }, [canvasRef]);

  // RAF loop
  useEffect(() => {
    let running = true;

    const loop = () => {
      if (!running) return;
      if (dirtyRef.current && rcRef.current) {
        renderFn(rcRef.current);
        dirtyRef.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [renderFn]);

  const markDirty = useCallback(() => { dirtyRef.current = true; }, []);

  return { markDirty, rcRef };
}

// ─── useZoomPan ───────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;

export function useZoomPan(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  baseViewRange: ViewRange,
  markDirty: () => void,
) {
  const [zoom, setZoom]       = useState<ZoomState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const isDragging            = useRef(false);
  const dragStart             = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Compute zoomed view range
  const zoomedViewRange = useCallback((): ViewRange => {
    const { scale, offsetX, offsetY } = zoom;
    const { timeRange, valueMin, valueMax } = baseViewRange;
    const tRange = (timeRange.end - timeRange.start) / scale;
    const vRange = (valueMax - valueMin) / scale;

    const tCenter = (timeRange.start + timeRange.end) / 2 - offsetX;
    const vCenter = (valueMin + valueMax) / 2 - offsetY;

    return {
      timeRange: { start: tCenter - tRange / 2, end: tCenter + tRange / 2 },
      valueMin: vCenter - vRange / 2,
      valueMax: vCenter + vRange / 2,
    };
  }, [zoom, baseViewRange]);

  // Mouse wheel → zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;

      setZoom(prev => ({
        ...prev,
        scale: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.scale * factor)),
      }));
      markDirty();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [canvasRef, markDirty]);

  // Mouse drag → pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY, ox: zoom.offsetX, oy: zoom.offsetY };
      canvas.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const { timeRange, valueMin, valueMax } = baseViewRange;
      const rect   = canvas.getBoundingClientRect();
      const dx     = e.clientX - dragStart.current.x;
      const dy     = e.clientY - dragStart.current.y;

      // Convert pixel delta to data units
      const tPerPx = (timeRange.end - timeRange.start) / (rect.width * zoom.scale);
      const vPerPx = (valueMax - valueMin) / (rect.height * zoom.scale);

      setZoom(prev => ({
        ...prev,
        offsetX: dragStart.current.ox + dx * tPerPx,
        offsetY: dragStart.current.oy - dy * vPerPx,
      }));
      markDirty();
    };

    const onUp = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [canvasRef, zoom.offsetX, zoom.offsetY, zoom.scale, baseViewRange, markDirty]);

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    markDirty();
  }, [markDirty]);

  return { zoom, zoomedViewRange, resetZoom };
}

// ─── Shared viewport helpers ──────────────────────────────────────────────────

export function buildViewRange(data: DataPoint[], paddingPct = 0.05): ViewRange {
  if (!data.length) {
    const now = Date.now();
    return { timeRange: { start: now - 30_000, end: now }, valueMin: 0, valueMax: 100 };
  }

  let minT = Infinity, maxT = -Infinity;
  let minV = Infinity, maxV = -Infinity;

  for (const pt of data) {
    if (pt.timestamp < minT) minT = pt.timestamp;
    if (pt.timestamp > maxT) maxT = pt.timestamp;
    if (pt.value < minV) minV = pt.value;
    if (pt.value > maxV) maxV = pt.value;
  }

  const vRange = (maxV - minV) || 1;
  return {
    timeRange:  { start: minT, end: maxT },
    valueMin:   minV - vRange * paddingPct,
    valueMax:   maxV + vRange * paddingPct,
  };
}

// ─── LOD helper ───────────────────────────────────────────────────────────────

export function sampleForDisplay(
  data: DataPoint[],
  maxPixels: number,
): DataPoint[] {
  if (data.length <= maxPixels) return data;
  const byId = new Map<string, DataPoint[]>();
  for (const pt of data) {
    const arr = byId.get(pt.seriesId) ?? [];
    arr.push(pt);
    byId.set(pt.seriesId, arr);
  }
  const result: DataPoint[] = [];
  for (const [, pts] of byId) {
    const sampled = lttbDownsample(pts, Math.max(2, Math.ceil(maxPixels / byId.size)));
    result.push(...(sampled as DataPoint[]));
  }
  return result;
}
