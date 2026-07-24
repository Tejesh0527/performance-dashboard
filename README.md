# ⚡ PerfDash — High-Performance Real-Time Data Visualization

A Next.js 14+ App Router dashboard that renders **10,000+ data points at 60fps** with real-time updates every 100ms.

## 🚀 Setup

```bash
npm install
npm run dev
# → http://localhost:3000  (auto-redirects to /dashboard)
```

### Production Build
```bash
npm run build
npm start
```

## 📦 Feature Overview

| Feature | Implementation |
|---|---|
| **4 Chart Types** | Line, Bar, Scatter, Heatmap — all raw Canvas |
| **Real-time Updates** | 100ms interval, 6 series, sliding window |
| **Virtual Table** | Renders only visible rows (useVirtualization) |
| **Web Worker** | Aggregation + filtering off the main thread |
| **FPS Counter** | Live RAF-based measurement |
| **Memory Monitor** | `performance.memory` API (Chrome) |
| **Stress Test** | Normal (~10k), Heavy (~50k), Extreme (~100k) |
| **Time Range Presets** | 30s / 1m / 5m / 15m / 1h / All |
| **Series Toggles** | Show/hide individual series |
| **Aggregation** | 1s / 1min / 5min / 1hour buckets |

## 🏗️ Architecture

### Server vs Client

```
app/dashboard/page.tsx          ← Server Component (initial data)
  └── components/Dashboard.tsx  ← Client Component (interactive shell)
       ├── charts/LineChart.tsx  ← Client (Canvas + RAF)
       ├── charts/BarChart.tsx   ← Client (Canvas + RAF)
       ├── charts/ScatterPlot.tsx← Client (Canvas + Path2D)
       ├── charts/Heatmap.tsx    ← Client (Canvas + 2D grid)
       ├── controls/...          ← Client (useTransition)
       └── ui/DataTable.tsx      ← Client (virtual scroll)
```

### Performance Patterns

- **useMemo** — aggregations, viewRange, filtered data
- **useCallback** — all event handlers + render functions
- **React.memo** — all chart components
- **useTransition** — filter changes are non-blocking
- **RAF loop** with dirty flag — no wasted frames
- **LTTB downsampling** — preserves visual accuracy at any zoom
- **Path2D batching** — Scatter uses single path per series
- **Web Worker** — data processing off main thread

## 🌐 Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full (memory API available) |
| Firefox 88+ | ✅ Full (no memory API, shows —) |
| Safari 15+ | ✅ Full |
| Edge 90+   | ✅ Full |

## 🔧 Performance Testing

1. Open `http://localhost:3000/dashboard`
2. Watch the **FPS** counter in the top metrics bar
3. Switch **Stress Mode** in the sidebar:
   - Normal: ~10,000 points
   - Heavy: ~50,000 points
   - Extreme: ~100,000 points
4. Use React DevTools Profiler to inspect render times
5. Check Chrome `performance.memory` via DevTools Console

## 📊 Next.js Optimizations Used

- **App Router** with Server Components for zero-JS initial data
- **Suspense** boundary for progressive loading
- **Edge Runtime** on API route handler
- **`redirect()`** server-side navigation
- **Inter** font via `next/font/google` (zero layout shift)
- **Production compiler** removes `console.log`
- **Custom headers** for Web Worker caching
