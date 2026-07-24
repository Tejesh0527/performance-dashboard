'use client';

import React, { useMemo } from 'react';
import { useData } from '@/components/providers/DataProvider';
import { SERIES_CONFIGS } from '@/lib/dataGenerator';

import FilterPanel          from '@/components/controls/FilterPanel';
import TimeRangeSelector    from '@/components/controls/TimeRangeSelector';
import LineChart            from '@/components/charts/LineChart';
import BarChart             from '@/components/charts/BarChart';
import ScatterPlot          from '@/components/charts/ScatterPlot';
import Heatmap              from '@/components/charts/Heatmap';
import DataTable            from '@/components/ui/DataTable';
import PerformanceMonitor   from '@/components/ui/PerformanceMonitor';

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const {
    data,
    filters,
    setFilters,
    setTimeRange,
    isStreaming,
    isPaused,
    togglePause,
    toggleStream,
    reset,
    metrics,
  } = useData();

  // Visible series configs
  const visibleSeries = useMemo(
    () => SERIES_CONFIGS.filter(s => filters.visibleSeries.includes(s.id)),
    [filters.visibleSeries],
  );

  return (
    <div className="dashboard-root">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span>PerfDash</span>
          <span className="text-muted text-sm" style={{ fontWeight: 400 }}>
            — Real-time Data Visualization
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          {isStreaming && !isPaused && (
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span className="text-xs text-secondary">LIVE</span>
            </div>
          )}

          <TimeRangeSelector timeRange={filters.timeRange} onChange={setTimeRange} />

          <button
            id="btn-pause"
            className={`btn btn-sm ${isPaused ? 'btn-primary' : 'btn-ghost'}`}
            onClick={togglePause}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button
            id="btn-stream"
            className={`btn btn-sm ${isStreaming ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleStream}
          >
            {isStreaming ? '⏹ Stop' : '▶ Start'}
          </button>

          <button id="btn-reset" className="btn btn-ghost btn-sm" onClick={reset}>
            ↺ Reset
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="dashboard-body">
        <FilterPanel filters={filters} onChange={setFilters} />

        <main className="main-content">
          {/* Performance Monitor */}
          <PerformanceMonitor metrics={metrics} />

          {/* Charts Grid */}
          <div className="charts-grid">
            <LineChart
              data={data}
              series={visibleSeries}
              title="Line Chart — Time Series"
              filled
              height={300}
            />
            <BarChart
              data={data}
              series={visibleSeries}
              title="Bar Chart — Aggregated"
              height={300}
              granularity={filters.granularity}
            />
            <ScatterPlot
              data={data}
              series={visibleSeries}
              title="Scatter Plot"
              height={300}
              pointRadius={3}
            />
            <Heatmap
              data={data}
              title="Heatmap — Series × Time"
              height={300}
              granularity={filters.granularity}
            />
          </div>

          {/* Data Table */}
          <DataTable data={data} />
        </main>
      </div>
    </div>
  );
}
