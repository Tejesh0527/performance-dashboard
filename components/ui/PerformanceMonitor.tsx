'use client';

import React from 'react';
import type { PerformanceMetrics } from '@/lib/types';

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
}

function fpsColor(fps: number): string {
  if (fps >= 55) return 'var(--accent-green)';
  if (fps >= 30) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function memColor(used: number): string {
  if (used < 100)  return 'var(--accent-green)';
  if (used < 300)  return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function Metric({ label, value, color, unit = '' }: {
  label: string; value: string | number; color?: string; unit?: string;
}) {
  return (
    <div className="perf-metric">
      <div className="perf-metric-value" style={{ color }}>
        {value}<span style={{ fontSize: 13, opacity: 0.6, marginLeft: 2 }}>{unit}</span>
      </div>
      <div className="perf-metric-label">{label}</div>
    </div>
  );
}

function PerformanceMonitor({ metrics }: PerformanceMonitorProps) {
  const {
    fps, frameDelta, renderTime, dataProcessingTime,
    memoryUsed, memoryTotal, pointCount, droppedFrames, uptime,
  } = metrics;

  const uptimeStr = `${Math.floor(uptime / 60).toString().padStart(2,'0')}:${Math.floor(uptime % 60).toString().padStart(2,'0')}`;

  return (
    <div className="perf-monitor">
      <Metric label="FPS"          value={fps}                       color={fpsColor(fps)} />
      <Metric label="Frame Delta"  value={frameDelta.toFixed(1)}     unit="ms" />
      <Metric label="Render Time"  value={renderTime.toFixed(1)}     unit="ms" />
      <Metric label="Data Proc"    value={dataProcessingTime.toFixed(1)} unit="ms" />
      <Metric label="Points"       value={pointCount.toLocaleString()} color="var(--accent-cyan)" />
      <Metric label="Memory Used"  value={memoryUsed > 0 ? memoryUsed.toFixed(0) : '—'} unit={memoryUsed > 0 ? 'MB' : ''} color={memoryUsed > 0 ? memColor(memoryUsed) : undefined} />
      <Metric label="Mem Total"    value={memoryTotal > 0 ? memoryTotal.toFixed(0) : '—'} unit={memoryTotal > 0 ? 'MB' : ''} />
      <Metric label="Dropped"      value={droppedFrames}             color={droppedFrames > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />
      <Metric label="Uptime"       value={uptimeStr} />
    </div>
  );
}

export default React.memo(PerformanceMonitor);
