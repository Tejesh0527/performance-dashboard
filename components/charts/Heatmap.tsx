'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { clearCanvas, interpolateHeat } from '@/lib/canvasUtils';
import { aggregateData, SERIES_CONFIGS } from '@/lib/dataGenerator';
import type { RenderContext, DataPoint, HeatmapCell } from '@/lib/types';

interface HeatmapProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  granularity?: '1s' | '1min' | '5min' | '1hour';
}

const PADDING = { top: 40, right: 20, bottom: 60, left: 80 };
const SERIES_LABELS = SERIES_CONFIGS.map(s => s.label);
const SERIES_IDS    = SERIES_CONFIGS.map(s => s.id) as string[];
const N_SERIES      = SERIES_CONFIGS.length;

function Heatmap({ data, title = 'Heatmap', height = 280, granularity = '1min' }: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { cells, bucketTimes } = useMemo(() => {
    const agg = aggregateData(data, granularity);
    if (!agg.length) return { cells: [], bucketTimes: [] };

    const timeBuckets = [...new Set(agg.map(p => p.timestamp))].sort((a, b) => a - b);
    const maxVal = Math.max(...agg.map(p => p.avg), 1);

    const cellsArr: HeatmapCell[] = [];
    for (const pt of agg) {
      const xIdx = timeBuckets.indexOf(pt.timestamp);
      const yIdx = SERIES_IDS.indexOf(pt.seriesId);
      if (xIdx < 0 || yIdx < 0) continue;
      cellsArr.push({ x: xIdx, y: yIdx, value: pt.avg / maxVal, count: pt.count });
    }
    return { cells: cellsArr, bucketTimes: timeBuckets };
  }, [data, granularity]);

  const timeBucketCount = useMemo(
    () => (cells.length ? Math.max(...cells.map(c => c.x)) + 1 : 1),
    [cells],
  );

  const render = useCallback((rc: RenderContext) => {
    clearCanvas(rc);
    const { ctx } = rc;
    const plot = {
      left:   PADDING.left,
      top:    PADDING.top,
      width:  rc.width  - PADDING.left - PADDING.right,
      height: rc.height - PADDING.top  - PADDING.bottom,
    };

    if (!cells.length || timeBucketCount < 1) return;

    const cellW = plot.width  / timeBucketCount;
    const cellH = plot.height / N_SERIES;

    // Draw heat cells
    for (const cell of cells) {
      const x = plot.left + cell.x * cellW;
      const y = plot.top  + cell.y * cellH;
      ctx.fillStyle = interpolateHeat(cell.value);
      ctx.fillRect(x, y, Math.max(cellW - 1, 1), Math.max(cellH - 1, 1));
    }

    ctx.save();

    // Y axis labels (series names)
    ctx.fillStyle    = 'rgba(255,255,255,0.55)';
    ctx.font         = '11px Inter, system-ui, sans-serif';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N_SERIES; i++) {
      const y = plot.top + i * cellH + cellH / 2;
      ctx.fillText(SERIES_LABELS[i], plot.left - 6, y);
    }

    // X axis time labels
    const step = Math.max(1, Math.floor(timeBucketCount / 6));
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < timeBucketCount; i += step) {
      const ts = bucketTimes[i];
      if (ts == null) continue;
      const x = plot.left + i * cellW + cellW / 2;
      const d = new Date(ts);
      const label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(label, x, plot.top + plot.height + 6);
    }

    // Colour scale legend
    const legendW = 120, legendH = 8;
    const lx = plot.left + plot.width - legendW;
    const ly = rc.height - 20;
    const grad = ctx.createLinearGradient(lx, 0, lx + legendW, 0);
    grad.addColorStop(0,   interpolateHeat(0));
    grad.addColorStop(0.5, interpolateHeat(0.5));
    grad.addColorStop(1,   interpolateHeat(1));
    ctx.fillStyle = grad;
    ctx.fillRect(lx, ly, legendW, legendH);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(lx, ly, legendW, legendH);

    ctx.fillStyle    = 'rgba(255,255,255,0.4)';
    ctx.font         = '10px Inter, system-ui, sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Low', lx, ly + legendH + 3);
    ctx.textAlign = 'right';
    ctx.fillText('High', lx + legendW, ly + legendH + 3);

    ctx.restore();
  }, [cells, timeBucketCount, bucketTimes]);

  useChartRenderer(canvasRef, render, [cells]);

  return (
    <div className="chart-container" style={{ height }}>
      <div className="chart-header">
        <span className="text-sm font-semibold">{title}</span>
        <span className="badge badge-green">{cells.length.toLocaleString()} cells</span>
      </div>
      <div className="chart-canvas-wrapper" style={{ height: height - 45 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

export default React.memo(Heatmap);
