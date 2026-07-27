import type { DataPoint, AggregatedPoint, TimeGranularity, FilterState } from './types';

// ─── Seeded pseudo-random for deterministic initial data ─────────────────────

let seed = 42;
function seededRandom(): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return ((seed >>> 0) / 0xffffffff);
}

function resetSeed(s = 42): void { seed = s; }

// ─── Series Definitions ───────────────────────────────────────────────────────

export const SERIES_CONFIGS = [
  { id: 'cpu',     label: 'CPU Usage',    color: '#6366f1', category: 'system',  baseValue: 40, amplitude: 30, frequency: 0.002, noise: 0.15 },
  { id: 'memory',  label: 'Memory',       color: '#ec4899', category: 'system',  baseValue: 60, amplitude: 20, frequency: 0.001, noise: 0.08 },
  { id: 'network', label: 'Network I/O',  color: '#14b8a6', category: 'network', baseValue: 30, amplitude: 50, frequency: 0.005, noise: 0.3  },
  { id: 'latency', label: 'Latency',      color: '#f59e0b', category: 'network', baseValue: 20, amplitude: 40, frequency: 0.003, noise: 0.5  },
  { id: 'errors',  label: 'Error Rate',   color: '#ef4444', category: 'app',     baseValue: 2,  amplitude: 8,  frequency: 0.008, noise: 0.8  },
  { id: 'rps',     label: 'Req/sec',      color: '#22c55e', category: 'app',     baseValue: 500,amplitude: 200,frequency: 0.002, noise: 0.2  },
] as const;

export const CATEGORIES = [...new Set(SERIES_CONFIGS.map(s => s.category))];

// ─── Point Value Generator ────────────────────────────────────────────────────

function generateValue(
  series: typeof SERIES_CONFIGS[number],
  timestamp: number,
  rng: () => number,
): number {
  const t = timestamp / 1000;
  const signal = Math.sin(t * series.frequency * Math.PI * 2) * series.amplitude;
  const noise = (rng() - 0.5) * 2 * series.noise * series.amplitude;
  const spike = rng() > 0.98 ? (rng() * series.amplitude * 2) : 0;
  return Math.max(0, series.baseValue + signal + noise + spike);
}

// ─── Bulk Generator ────────────────────────────────────────────────────────────
// Generates N points spread across M series, starting from `startTime`

export function generateDataset(
  pointsPerSeries: number,
  startTime: number = Date.now() - pointsPerSeries * 100,
  intervalMs: number = 100,
): DataPoint[] {
  resetSeed();
  const points: DataPoint[] = [];

  for (const series of SERIES_CONFIGS) {
    for (let i = 0; i < pointsPerSeries; i++) {
      const timestamp = startTime + i * intervalMs;
      points.push({
        timestamp,
        value: generateValue(series, timestamp, seededRandom),
        category: series.category,
        seriesId: series.id,
      });
    }
  }

  // Sort by timestamp for easier consumption
  points.sort((a, b) => a.timestamp - b.timestamp);
  return points;
}

// ─── Real-time point emitter (one tick = one point per series) ────────────────

export function generateTick(now: number = Date.now()): DataPoint[] {
  const rng = Math.random;
  return SERIES_CONFIGS.map(series => ({
    timestamp: now,
    value: generateValue(series, now, rng),
    category: series.category,
    seriesId: series.id,
  }));
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

const GRANULARITY_MS: Record<TimeGranularity, number> = {
  '1s':    1_000,
  '1min':  60_000,
  '5min':  300_000,
  '1hour': 3_600_000,
};

export function aggregateData(
  data: DataPoint[],
  granularity: TimeGranularity,
): AggregatedPoint[] {
  if (data.length === 0) return [];

  const bucketMs = GRANULARITY_MS[granularity];
  const buckets = new Map<string, { points: number[]; first: DataPoint }>();

  for (const pt of data) {
    const bucketTime = Math.floor(pt.timestamp / bucketMs) * bucketMs;
    const key = `${pt.seriesId}__${bucketTime}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.points.push(pt.value);
    } else {
      buckets.set(key, { points: [pt.value], first: pt });
    }
  }

  const result: AggregatedPoint[] = [];
  for (const [key, { points, first }] of buckets) {
    const bucketTime = parseInt(key.split('__')[1], 10);
    const sorted = [...points].sort((a, b) => a - b);
    const sum = points.reduce((a, b) => a + b, 0);
    result.push({
      timestamp: bucketTime,
      open: points[0],
      close: points[points.length - 1],
      high: sorted[sorted.length - 1],
      low: sorted[0],
      avg: sum / points.length,
      count: points.length,
      category: first.category,
      seriesId: first.seriesId,
    });
  }

  result.sort((a, b) => a.timestamp - b.timestamp);
  return result;
}

// ─── Filter helpers ────────────────────────────────────────────────────────────

export function filterData(data: DataPoint[], filters: FilterState): DataPoint[] {
  const { categories, visibleSeries, timeRange, valueRange } = filters;
  const [vMin, vMax] = valueRange;

  return data.filter(pt =>
    pt.timestamp >= timeRange.start &&
    pt.timestamp <= timeRange.end &&
    categories.includes(pt.category) &&
    visibleSeries.includes(pt.seriesId) &&
    pt.value >= vMin &&
    pt.value <= vMax,
  );
}

// ─── Sliding window ───────────────────────────────────────────────────────────

export function applyWindow(
  existing: DataPoint[],
  newPoints: DataPoint[],
  maxPoints: number,
): DataPoint[] {
  const combined = [...existing, ...newPoints];
  if (combined.length <= maxPoints) return combined;
  return combined.slice(combined.length - maxPoints);
}
