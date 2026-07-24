// ─── Core Data Types ────────────────────────────────────────────────────────

export interface DataPoint {
  timestamp: number;   // Unix ms
  value: number;
  category: string;
  seriesId: string;
  metadata?: Record<string, unknown>;
}

export interface AggregatedPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  avg: number;
  count: number;
  category: string;
  seriesId: string;
}

export type TimeGranularity = '1s' | '1min' | '5min' | '1hour';

// ─── Chart Config ────────────────────────────────────────────────────────────

export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

export interface SeriesConfig {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  chartType: ChartType;
  lineWidth?: number;
  pointRadius?: number;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  series: SeriesConfig[];
  xLabel?: string;
  yLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
}

// ─── Viewport / Range ────────────────────────────────────────────────────────

export interface TimeRange {
  start: number;   // Unix ms
  end: number;     // Unix ms
}

export interface ViewRange {
  timeRange: TimeRange;
  valueMin: number;
  valueMax: number;
}

export interface ZoomState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface FilterState {
  categories: string[];
  visibleSeries: string[];
  timeRange: TimeRange;
  granularity: TimeGranularity;
  valueRange: [number, number];
  stressMode: 'normal' | '50k' | '100k';
}

// ─── Performance Metrics ──────────────────────────────────────────────────────

export interface PerformanceMetrics {
  fps: number;
  frameDelta: number;   // ms between frames
  renderTime: number;   // ms to render last frame
  dataProcessingTime: number;
  memoryUsed: number;   // MB
  memoryTotal: number;  // MB
  pointCount: number;
  droppedFrames: number;
  uptime: number;       // seconds
}

// ─── Dashboard State ──────────────────────────────────────────────────────────

export interface DashboardState {
  data: DataPoint[];
  aggregatedData: Map<TimeGranularity, AggregatedPoint[]>;
  filters: FilterState;
  metrics: PerformanceMetrics;
  isStreaming: boolean;
  isPaused: boolean;
}

// ─── Canvas Render Context ────────────────────────────────────────────────────

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  padding: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
  viewRange: ViewRange;
}

export interface AxisTick {
  value: number;
  label: string;
  position: number;  // pixel position
}

// ─── Worker Messages ─────────────────────────────────────────────────────────

export type WorkerRequest =
  | { type: 'AGGREGATE'; data: DataPoint[]; granularity: TimeGranularity }
  | { type: 'FILTER'; data: DataPoint[]; filters: FilterState }
  | { type: 'COMPUTE_RANGE'; data: DataPoint[] };

export type WorkerResponse =
  | { type: 'AGGREGATE_RESULT'; granularity: TimeGranularity; result: AggregatedPoint[]; duration: number }
  | { type: 'FILTER_RESULT'; result: DataPoint[]; duration: number }
  | { type: 'RANGE_RESULT'; min: number; max: number; duration: number }
  | { type: 'ERROR'; message: string };

// ─── Heatmap ─────────────────────────────────────────────────────────────────

export interface HeatmapCell {
  x: number;      // time bucket index
  y: number;      // category index
  value: number;  // intensity
  count: number;
}

// ─── Virtual Table ────────────────────────────────────────────────────────────

export interface TableColumn<T = DataPoint> {
  key: keyof T;
  label: string;
  width: number;
  formatter?: (value: unknown) => string;
  align?: 'left' | 'right' | 'center';
}
