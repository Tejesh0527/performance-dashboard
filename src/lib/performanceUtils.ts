import type { PerformanceMetrics } from './types';

// ─── FPS Tracker ─────────────────────────────────────────────────────────────

export class FPSTracker {
  private frames: number[] = [];
  private readonly windowMs = 1000;

  tick(): number {
    const now = performance.now();
    this.frames.push(now);
    // Evict frames outside the 1s window
    const cutoff = now - this.windowMs;
    let i = 0;
    while (i < this.frames.length && this.frames[i] < cutoff) i++;
    if (i > 0) this.frames.splice(0, i);
    return this.frames.length;
  }

  getFPS(): number { return this.frames.length; }

  getLastDelta(): number {
    if (this.frames.length < 2) return 0;
    return this.frames[this.frames.length - 1] - this.frames[this.frames.length - 2];
  }
}

// ─── Render Timer ─────────────────────────────────────────────────────────────

export class RenderTimer {
  private start = 0;
  private lastDuration = 0;
  private droppedFrames = 0;
  private readonly targetMs = 1000 / 60;

  begin(): void { this.start = performance.now(); }

  end(): number {
    this.lastDuration = performance.now() - this.start;
    if (this.lastDuration > this.targetMs * 1.5) this.droppedFrames++;
    return this.lastDuration;
  }

  getDuration(): number   { return this.lastDuration; }
  getDropped():  number   { return this.droppedFrames; }
  resetDropped(): void    { this.droppedFrames = 0; }
}

// ─── Memory reader ────────────────────────────────────────────────────────────

interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export function readMemory(): { used: number; total: number } {
  const perf = performance as ExtendedPerformance;
  if (!perf.memory) return { used: 0, total: 0 };
  return {
    used:  perf.memory.usedJSHeapSize   / 1_048_576,
    total: perf.memory.totalJSHeapSize  / 1_048_576,
  };
}

// ─── Uptime tracker ───────────────────────────────────────────────────────────

export class UptimeTracker {
  private startTime = Date.now();
  getSeconds(): number { return (Date.now() - this.startTime) / 1000; }
  reset():      void   { this.startTime = Date.now(); }
}

// ─── Metrics Aggregator ───────────────────────────────────────────────────────

export class MetricsCollector {
  readonly fps      = new FPSTracker();
  readonly render   = new RenderTimer();
  readonly uptime   = new UptimeTracker();
  private dataMs    = 0;
  private pointsCnt = 0;

  recordDataProcessing(ms: number, count: number): void {
    this.dataMs    = ms;
    this.pointsCnt = count;
  }

  collect(): PerformanceMetrics {
    const { used, total } = readMemory();
    return {
      fps:                 this.fps.getFPS(),
      frameDelta:          this.fps.getLastDelta(),
      renderTime:          this.render.getDuration(),
      dataProcessingTime:  this.dataMs,
      memoryUsed:          used,
      memoryTotal:         total,
      pointCount:          this.pointsCnt,
      droppedFrames:       this.render.getDropped(),
      uptime:              this.uptime.getSeconds(),
    };
  }
}

// ─── Debounce / throttle ──────────────────────────────────────────────────────

export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
): (...args: T) => void {
  let id: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

export function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
): (...args: T) => void {
  let last = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

// ─── Downsampling (LTTB algorithm) ────────────────────────────────────────────
// Largest-Triangle-Three-Buckets – preserves visual shape at lower resolution.

export function lttbDownsample(
  data: Array<{ timestamp: number; value: number }>,
  threshold: number,
): Array<{ timestamp: number; value: number }> {
  const n = data.length;
  if (threshold >= n || threshold === 0) return data;

  const sampled: Array<{ timestamp: number; value: number }> = [data[0]];
  const every = (n - 2) / (threshold - 2);
  let a = 0;

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd   = Math.min(Math.floor((i + 2) * every) + 1, n);
    let avgX = 0, avgY = 0;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].timestamp;
      avgY += data[j].value;
    }
    const len = avgRangeEnd - avgRangeStart;
    avgX /= len; avgY /= len;

    // Point with largest triangle area in current bucket
    const rangeStart = Math.floor(i * every) + 1;
    const rangeEnd   = Math.min(Math.floor((i + 1) * every) + 1, n);
    const { timestamp: ax, value: ay } = data[a];
    let maxArea = -1, maxIdx = rangeStart;

    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (ax - avgX) * (data[j].value - ay) -
        (ax - data[j].timestamp) * (avgY - ay),
      ) * 0.5;
      if (area > maxArea) { maxArea = area; maxIdx = j; }
    }
    sampled.push(data[maxIdx]);
    a = maxIdx;
  }

  sampled.push(data[n - 1]);
  return sampled;
}
