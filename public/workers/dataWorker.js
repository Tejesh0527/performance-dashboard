// Web Worker for off-main-thread data processing
// This file runs in a Worker context — no DOM, no React.

/* global self */

// ─── Aggregate ────────────────────────────────────────────────────────────────

const GRANULARITY_MS = {
  '1s':    1_000,
  '1min':  60_000,
  '5min':  300_000,
  '1hour': 3_600_000,
};

function aggregateData(data, granularity) {
  if (!data.length) return [];
  const bucketMs = GRANULARITY_MS[granularity];
  const buckets  = new Map();

  for (const pt of data) {
    const bt  = Math.floor(pt.timestamp / bucketMs) * bucketMs;
    const key = `${pt.seriesId}__${bt}`;
    const b   = buckets.get(key);
    if (b) b.points.push(pt.value);
    else   buckets.set(key, { points: [pt.value], first: pt });
  }

  const result = [];
  for (const [key, { points, first }] of buckets) {
    const bt     = parseInt(key.split('__')[1], 10);
    const sum    = points.reduce((a, b) => a + b, 0);
    const sorted = [...points].sort((a, b) => a - b);
    result.push({
      timestamp: bt,
      open:  points[0],
      close: points[points.length - 1],
      high:  sorted[sorted.length - 1],
      low:   sorted[0],
      avg:   sum / points.length,
      count: points.length,
      category: first.category,
      seriesId: first.seriesId,
    });
  }
  result.sort((a, b) => a.timestamp - b.timestamp);
  return result;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

function filterData(data, filters) {
  const { categories, visibleSeries, timeRange, valueRange } = filters;
  const [vMin, vMax] = valueRange;
  return data.filter(pt =>
    pt.timestamp >= timeRange.start &&
    pt.timestamp <= timeRange.end   &&
    categories.includes(pt.category)    &&
    visibleSeries.includes(pt.seriesId) &&
    pt.value >= vMin &&
    pt.value <= vMax,
  );
}

// ─── Compute range ────────────────────────────────────────────────────────────

function computeRange(data) {
  let min = Infinity, max = -Infinity;
  for (const pt of data) {
    if (pt.value < min) min = pt.value;
    if (pt.value > max) max = pt.value;
  }
  return { min: isFinite(min) ? min : 0, max: isFinite(max) ? max : 100 };
}

// ─── Message Handler ──────────────────────────────────────────────────────────

self.onmessage = function (e) {
  const { type } = e.data;
  const t0 = performance.now();
  try {
    if (type === 'AGGREGATE') {
      const result = aggregateData(e.data.data, e.data.granularity);
      self.postMessage({ type: 'AGGREGATE_RESULT', granularity: e.data.granularity, result, duration: performance.now() - t0 });
    } else if (type === 'FILTER') {
      const result = filterData(e.data.data, e.data.filters);
      self.postMessage({ type: 'FILTER_RESULT', result, duration: performance.now() - t0 });
    } else if (type === 'COMPUTE_RANGE') {
      const { min, max } = computeRange(e.data.data);
      self.postMessage({ type: 'RANGE_RESULT', min, max, duration: performance.now() - t0 });
    }
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: String(err) });
  }
};
