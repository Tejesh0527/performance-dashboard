import type { RenderContext, AxisTick, ViewRange, DataPoint } from './types';

// ─── DPR-aware canvas setup ───────────────────────────────────────────────────

export function setupCanvas(
  canvas: HTMLCanvasElement,
  padding = { top: 40, right: 30, bottom: 50, left: 65 },
): RenderContext {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = rect.width  || canvas.offsetWidth;
  const height = rect.height || canvas.offsetHeight;

  canvas.width  = width  * dpr;
  canvas.height = height * dpr;
  canvas.style.width  = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.scale(dpr, dpr);

  return {
    canvas,
    ctx,
    width,
    height,
    dpr,
    padding,
    plotWidth:  width  - padding.left - padding.right,
    plotHeight: height - padding.top  - padding.bottom,
    viewRange: {
      timeRange:  { start: 0, end: 1 },
      valueMin: 0,
      valueMax: 1,
    },
  };
}

// ─── Coordinate mapping ────────────────────────────────────────────────────────

export function toPixelX(
  ts: number,
  rc: RenderContext,
): number {
  const { timeRange: { start, end } } = rc.viewRange;
  const ratio = end === start ? 0 : (ts - start) / (end - start);
  return rc.padding.left + ratio * rc.plotWidth;
}

export function toPixelY(
  value: number,
  rc: RenderContext,
): number {
  const { valueMin, valueMax } = rc.viewRange;
  const ratio = valueMax === valueMin ? 0 : (value - valueMin) / (valueMax - valueMin);
  return rc.padding.top + (1 - ratio) * rc.plotHeight;
}

export function fromPixelX(px: number, rc: RenderContext): number {
  const ratio = (px - rc.padding.left) / rc.plotWidth;
  const { start, end } = rc.viewRange.timeRange;
  return start + ratio * (end - start);
}

// ─── Clear helpers ────────────────────────────────────────────────────────────

export function clearCanvas(rc: RenderContext, bgColor = '#0f1117'): void {
  const { ctx, width, height } = rc;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
}

// ─── Grid & Axes ──────────────────────────────────────────────────────────────

export function drawGrid(
  rc: RenderContext,
  xTicks: AxisTick[],
  yTicks: AxisTick[],
): void {
  const { ctx, padding, plotWidth, plotHeight } = rc;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;

  // Vertical grid lines
  for (const tick of xTicks) {
    const x = padding.left + tick.position * plotWidth;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.stroke();
  }

  // Horizontal grid lines
  for (const tick of yTicks) {
    const y = padding.top + tick.position * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawAxes(
  rc: RenderContext,
  xTicks: AxisTick[],
  yTicks: AxisTick[],
  xLabel = '',
  yLabel = '',
): void {
  const { ctx, padding, plotWidth, plotHeight, height } = rc;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '11px Inter, system-ui, sans-serif';

  // X axis line
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.stroke();

  // Y axis line
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotHeight);
  ctx.stroke();

  // X tick labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const tick of xTicks) {
    const x = padding.left + tick.position * plotWidth;
    ctx.fillText(tick.label, x, padding.top + plotHeight + 8);
  }

  // Y tick labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const tick of yTicks) {
    const y = padding.top + tick.position * plotHeight;
    ctx.fillText(tick.label, padding.left - 8, y);
  }

  // Axis labels
  if (xLabel) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(xLabel, padding.left + plotWidth / 2, height - 4);
  }

  if (yLabel) {
    ctx.save();
    ctx.translate(14, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

// ─── Tick Generation ──────────────────────────────────────────────────────────

export function computeXTicks(viewRange: ViewRange, count = 6): AxisTick[] {
  const { start, end } = viewRange.timeRange;
  const step = (end - start) / count;
  const ticks: AxisTick[] = [];
  for (let i = 0; i <= count; i++) {
    const ts = start + i * step;
    const ratio = (ts - start) / (end - start);
    const d = new Date(ts);
    const label = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
    ticks.push({ value: ts, label, position: ratio });
  }
  return ticks;
}

export function computeYTicks(viewRange: ViewRange, count = 5): AxisTick[] {
  const { valueMin, valueMax } = viewRange;
  const step = (valueMax - valueMin) / count;
  const ticks: AxisTick[] = [];
  for (let i = 0; i <= count; i++) {
    const value = valueMin + i * step;
    const ratio = 1 - (value - valueMin) / (valueMax - valueMin);
    ticks.push({ value, label: formatValue(value), position: ratio });
  }
  return ticks;
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (Math.abs(v) >= 1)    return v.toFixed(1);
  return v.toFixed(2);
}

// ─── Clip region helper ───────────────────────────────────────────────────────

export function clipToPlot(rc: RenderContext): void {
  const { ctx, padding, plotWidth, plotHeight } = rc;
  ctx.beginPath();
  ctx.rect(padding.left, padding.top, plotWidth, plotHeight);
  ctx.clip();
}

// ─── Line drawing ─────────────────────────────────────────────────────────────

export function drawLineSeries(
  rc: RenderContext,
  points: DataPoint[],
  color: string,
  lineWidth = 2,
  fill = false,
): void {
  if (points.length < 2) return;
  const { ctx, padding, plotHeight } = rc;

  ctx.save();
  clipToPlot(rc);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  ctx.beginPath();
  let started = false;
  for (const pt of points) {
    const x = toPixelX(pt.timestamp, rc);
    const y = toPixelY(pt.value, rc);
    if (!started) { ctx.moveTo(x, y); started = true; }
    else           ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (fill) {
    const firstX = toPixelX(points[0].timestamp, rc);
    const lastX  = toPixelX(points[points.length - 1].timestamp, rc);
    const baseY  = padding.top + plotHeight;
    ctx.lineTo(lastX, baseY);
    ctx.lineTo(firstX, baseY);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, baseY);
    grad.addColorStop(0, color.replace(')', ',0.25)').replace('rgb', 'rgba'));
    grad.addColorStop(1, color.replace(')', ',0.00)').replace('rgb', 'rgba'));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.restore();
}

// ─── Value range computation ──────────────────────────────────────────────────

export function computeValueRange(
  data: DataPoint[],
  padding = 0.1,
): { min: number; max: number } {
  if (data.length === 0) return { min: 0, max: 100 };
  let min = Infinity, max = -Infinity;
  for (const pt of data) {
    if (pt.value < min) min = pt.value;
    if (pt.value > max) max = pt.value;
  }
  const range = max - min || 1;
  return { min: min - range * padding, max: max + range * padding };
}

// ─── Colour utilities ─────────────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function interpolateHeat(t: number): string {
  // Blue → Cyan → Green → Yellow → Red
  const stops = [
    [15,  23,  42],   // 0   - dark blue
    [6,   182, 212],  // 0.3 - cyan
    [34,  197, 94],   // 0.5 - green
    [234, 179, 8],    // 0.7 - yellow
    [239, 68,  68],   // 1   - red
  ] as const;
  const n = stops.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = t * n - i;
  const a = stops[i];
  const b = stops[i + 1];
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bv= Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r},${g},${bv})`;
}
