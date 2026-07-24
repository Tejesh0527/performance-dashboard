'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { useChartRenderer, useZoomPan, buildViewRange } from '@/hooks/useChartRenderer';
import {
  clearCanvas, drawGrid, drawAxes, computeXTicks, computeYTicks,
  toPixelX, toPixelY, clipToPlot, hexToRgba,
} from '@/lib/canvasUtils';
import { aggregateData } from '@/lib/dataGenerator';
import type { RenderContext, DataPoint } from '@/lib/types';
import type { SERIES_CONFIGS } from '@/lib/dataGenerator';

interface BarChartProps {
  data: DataPoint[];
  series: (typeof SERIES_CONFIGS[number])[];
  title?: string;
  height?: number;
  granularity?: '1s' | '1min' | '5min' | '1hour';
}

function BarChart({ data, series, title = 'Bar Chart', height = 280, granularity = '1min' }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const visibleIds = useMemo(() => new Set<string>(series.map(s => s.id)), [series]);
  const filteredData = useMemo(
    () => data.filter(pt => visibleIds.has(pt.seriesId)),
    [data, visibleIds],
  );

  const aggData = useMemo(() => aggregateData(filteredData, granularity), [filteredData, granularity]);

  const baseViewRange = useMemo(() => {
    if (!aggData.length) return buildViewRange([]);
    let minT = Infinity, maxT = -Infinity, maxV = -Infinity;
    for (const pt of aggData) {
      if (pt.timestamp < minT) minT = pt.timestamp;
      if (pt.timestamp > maxT) maxT = pt.timestamp;
      if (pt.avg > maxV) maxV = pt.avg;
    }
    return { timeRange: { start: minT, end: maxT }, valueMin: 0, valueMax: maxV * 1.1 };
  }, [aggData]);

  const renderRef = useRef<(rc: RenderContext) => void>(() => {});

  const { markDirty } = useChartRenderer(canvasRef, (rc) => renderRef.current(rc), [aggData, series, granularity]);

  // Zoom + Pan
  const { zoom, zoomedViewRange, resetZoom } = useZoomPan(canvasRef, baseViewRange, markDirty);
  const viewRange = zoomedViewRange();

  renderRef.current = useCallback((rc: RenderContext) => {
    rc.viewRange = viewRange;
    clearCanvas(rc);

    const xTicks = computeXTicks(viewRange, 5);
    const yTicks = computeYTicks(viewRange, 5);
    drawGrid(rc, xTicks, yTicks);

    const bySeries = new Map<string, typeof aggData>();
    for (const pt of aggData) {
      const arr = bySeries.get(pt.seriesId) ?? [];
      arr.push(pt);
      bySeries.set(pt.seriesId, arr);
    }

    const seriesArr = [...bySeries.keys()];
    const nSeries   = seriesArr.length || 1;
    const { ctx }   = rc;

    ctx.save();
    clipToPlot(rc);

    for (let si = 0; si < seriesArr.length; si++) {
      const sid    = seriesArr[si];
      const pts    = bySeries.get(sid)!;
      const cfg    = series.find(s => s.id === sid);
      if (!cfg) continue;

      for (let i = 0; i < pts.length; i++) {
        const pt   = pts[i];
        const cx   = toPixelX(pt.timestamp, rc);
        const baseY = rc.padding.top + rc.plotHeight;

        const next = pts[i + 1];
        const bucketW = next
          ? (toPixelX(next.timestamp, rc) - cx) * 0.85
          : rc.plotWidth / (pts.length + 1) * 0.85;

        const barW  = bucketW / nSeries;
        const barX  = cx - bucketW / 2 + si * barW;
        const barH  = baseY - toPixelY(pt.avg, rc);

        const grad  = ctx.createLinearGradient(0, baseY - barH, 0, baseY);
        grad.addColorStop(0, cfg.color);
        grad.addColorStop(1, hexToRgba(cfg.color, 0.2));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, baseY - barH, barW - 2, barH, [3, 3, 0, 0]);
        ctx.fill();
      }
    }

    ctx.restore();
    drawAxes(rc, xTicks, yTicks, `Time (${granularity})`, 'Avg Value');
  }, [aggData, viewRange, series, granularity]);

  useMemo(() => { markDirty(); }, [viewRange, markDirty]);

  return (
    <div className="chart-container" style={{ height }}>
      <div className="chart-header">
        <span className="text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-2">
          {zoom.scale !== 1 && (
            <button className="btn btn-xs btn-ghost" onClick={resetZoom}>
              ↺ {zoom.scale.toFixed(1)}×
            </button>
          )}
          <span className="badge badge-cyan">{aggData.length.toLocaleString()} buckets</span>
        </div>
      </div>
      <div className="chart-canvas-wrapper" style={{ height: height - 45 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

export default React.memo(BarChart);
