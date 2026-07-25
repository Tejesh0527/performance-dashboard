'use client';

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { useChartRenderer, useZoomPan, buildViewRange, sampleForDisplay } from '@/hooks/useChartRenderer';
import {
  clearCanvas, drawGrid, drawLineSeries,
  computeXTicks, computeYTicks,
} from '@/lib/canvasUtils';
import type { RenderContext, DataPoint } from '@/lib/types';
import type { SERIES_CONFIGS } from '@/lib/dataGenerator';

interface LineChartProps {
  data: DataPoint[];
  series: (typeof SERIES_CONFIGS[number])[];
  title?: string;
  filled?: boolean;
  height?: number;
}

function LineChart({ data, series, title = 'Line Chart', filled = true, height = 280 }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const visibleSeriesIds = useMemo(() => new Set<string>(series.map(s => s.id)), [series]);
  const filteredData     = useMemo(
    () => data.filter(pt => visibleSeriesIds.has(pt.seriesId)),
    [data, visibleSeriesIds],
  );
  const baseViewRange = useMemo(() => buildViewRange(filteredData), [filteredData]);

  const renderRef = useRef<(rc: RenderContext) => void>(() => {});
  const stableRender = useCallback((rc: RenderContext) => renderRef.current(rc), []);

  const { markDirty } = useChartRenderer(canvasRef, stableRender, [filteredData, series, filled]);

  // Zoom + Pan
  const { zoom, zoomedViewRange, resetZoom } = useZoomPan(canvasRef, baseViewRange, markDirty);
  const viewRange = zoomedViewRange();

  // SVG axis data
  const xTicks = useMemo(() => computeXTicks(viewRange, 5), [viewRange]);
  const yTicks = useMemo(() => computeYTicks(viewRange, 5), [viewRange]);

  const renderChart = useCallback((rc: RenderContext) => {
    rc.viewRange = viewRange;
    clearCanvas(rc);

    const sampled = sampleForDisplay(filteredData, rc.plotWidth * 2);
    const xt = computeXTicks(viewRange, 5);
    const yt = computeYTicks(viewRange, 5);

    drawGrid(rc, xt, yt);

    for (const s of series) {
      const pts = sampled.filter(pt => pt.seriesId === s.id);
      if (pts.length < 2) continue;
      drawLineSeries(rc, pts, s.color, 2, filled);
    }
  }, [filteredData, viewRange, series, filled]);

  useEffect(() => {
    renderRef.current = renderChart;
  }, [renderChart]);

  useEffect(() => {
    markDirty();
  }, [viewRange, markDirty]);

  const PADDING = { top: 40, right: 30, bottom: 50, left: 65 };
  const canvasH = height - 45;

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
          <span className="badge badge-indigo">{filteredData.length.toLocaleString()} pts</span>
        </div>
      </div>
      <div className="chart-canvas-wrapper" style={{ height: canvasH, position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        {/* SVG Overlay for axes (hybrid Canvas+SVG) */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
        >
          {/* X axis labels */}
          {xTicks.map((t, i) => {
            const xPct = (PADDING.left / 800 + t.position * (1 - (PADDING.left + PADDING.right) / 800)) * 100;
            return (
              <text
                key={`x-${i}`}
                x={`${xPct}%`}
                y="96%"
                textAnchor="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize="2.5"
                fontFamily="var(--font-sans)"
              >
                {t.label}
              </text>
            );
          })}
          {/* Y axis labels */}
          {yTicks.map((t, i) => {
            const yPct = (PADDING.top / canvasH + t.position * (1 - (PADDING.top + PADDING.bottom) / canvasH)) * 100;
            return (
              <text
                key={`y-${i}`}
                x="1%"
                y={`${yPct}%`}
                textAnchor="start"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize="2.5"
                fontFamily="var(--font-mono)"
              >
                {t.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default React.memo(LineChart);
