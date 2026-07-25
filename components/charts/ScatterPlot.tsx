'use client';

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { useChartRenderer, useZoomPan, buildViewRange, sampleForDisplay } from '@/hooks/useChartRenderer';
import {
  clearCanvas, drawGrid, drawAxes, computeXTicks, computeYTicks,
  toPixelX, toPixelY, clipToPlot, hexToRgba,
} from '@/lib/canvasUtils';
import type { RenderContext, DataPoint } from '@/lib/types';
import type { SERIES_CONFIGS } from '@/lib/dataGenerator';

interface ScatterPlotProps {
  data: DataPoint[];
  series: (typeof SERIES_CONFIGS[number])[];
  title?: string;
  height?: number;
  pointRadius?: number;
}

function ScatterPlot({ data, series, title = 'Scatter Plot', height = 280, pointRadius = 3 }: ScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const visibleIds = useMemo(() => new Set<string>(series.map(s => s.id)), [series]);
  const filteredData = useMemo(
    () => data.filter(pt => visibleIds.has(pt.seriesId)),
    [data, visibleIds],
  );
  const baseViewRange = useMemo(() => buildViewRange(filteredData), [filteredData]);

  const renderRef = useRef<(rc: RenderContext) => void>(() => {});
  const stableRender = useCallback((rc: RenderContext) => renderRef.current(rc), []);

  const { markDirty } = useChartRenderer(canvasRef, stableRender, [filteredData, series, pointRadius]);

  // Zoom + Pan
  const { zoom, zoomedViewRange, resetZoom } = useZoomPan(canvasRef, baseViewRange, markDirty);
  const viewRange = zoomedViewRange();

  const renderChart = useCallback((rc: RenderContext) => {
    rc.viewRange = viewRange;
    clearCanvas(rc);

    const sampled = sampleForDisplay(filteredData, rc.plotWidth);
    const xTicks  = computeXTicks(viewRange, 5);
    const yTicks  = computeYTicks(viewRange, 5);

    drawGrid(rc, xTicks, yTicks);

    const { ctx } = rc;
    ctx.save();
    clipToPlot(rc);

    const bySeries = new Map<string, DataPoint[]>();
    for (const pt of sampled) {
      const arr = bySeries.get(pt.seriesId) ?? [];
      arr.push(pt);
      bySeries.set(pt.seriesId, arr);
    }

    for (const s of series) {
      const pts = bySeries.get(s.id);
      if (!pts?.length) continue;

      const path = new Path2D();
      for (const pt of pts) {
        const x = toPixelX(pt.timestamp, rc);
        const y = toPixelY(pt.value, rc);
        path.moveTo(x + pointRadius, y);
        path.arc(x, y, pointRadius, 0, Math.PI * 2);
      }

      ctx.fillStyle   = hexToRgba(s.color, 0.65);
      ctx.fill(path);
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = 0.5;
      ctx.stroke(path);
    }

    ctx.restore();
    drawAxes(rc, xTicks, yTicks, 'Time', 'Value');
  }, [filteredData, viewRange, series, pointRadius]);

  useEffect(() => {
    renderRef.current = renderChart;
  }, [renderChart]);

  useEffect(() => {
    markDirty();
  }, [viewRange, markDirty]);

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
          <span className="badge badge-amber">{filteredData.length.toLocaleString()} pts</span>
        </div>
      </div>
      <div className="chart-canvas-wrapper" style={{ height: height - 45 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

export default React.memo(ScatterPlot);
