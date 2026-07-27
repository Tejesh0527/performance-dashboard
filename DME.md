# ⚡ Performance Dashboard — High-Performance Real-Time Data Visualization

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat-square&logo=vite)](https://vitejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2+-yellow?style=flat-square&logo=vue.js)](https://pinia.vuejs.org/)
[![Canvas API](https://img.shields.io/badge/Render-HTML5_Canvas_%2B_SVG-E34F26?style=flat-square&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

A production-quality, high-performance real-time analytics dashboard capable of rendering **10,000 to 100,000+ real-time data points at 60 FPS** with low interaction latency (< 15ms) and zero memory leaks over long sessions.

Built from scratch using **Vue 3 Composition API**, **TypeScript**, **Vite**, **Pinia**, **Web Workers**, and a **Canvas + SVG Hybrid Rendering Engine**.

---

## 📸 Feature Overview & Screenshots

### Dashboard Overview
![Performance Dashboard Overview](public/screenshots/dashboard_overview.png)
*Full interactive dashboard rendering multiple Canvas + SVG hybrid charts (Line Chart, Bar Chart, Scatter Plot, Heatmap) alongside interactive controls, time range selector, and a virtualized data table.*

### Real-Time Performance & Metrics Monitor
![Performance Metrics UI](public/screenshots/performance_metrics.png)
*Live performance telemetry showing steady 60 FPS frame rate, JS Heap memory tracking, active point counts, frame delta, render times, and dropped frame detection under heavy dataset stress testing.*

---

## 📦 Feature Overview

| Feature Category | Feature | Description & Technical Implementation |
|---|---|---|
| **Multiple Chart Types** | **4 Raw Canvas Charts** | High-performance Line Chart, Bar Chart, Scatter Plot (Path2D batched), and Heatmap (2D matrix interpolation) built from scratch with zero chart library dependencies. |
| **Hybrid Rendering** | **Canvas + SVG Architecture** | Canvas 2D context for ultra-fast data point rasterization (60 FPS); SVG overlay layer for crisp text, axes, ticks, grid lines, and interactive crosshair tooltips. |
| **Real-time Updates** | **100ms Streaming Data** | Continuous simulated telemetry stream pushing new data ticks every 100ms into a memory-managed sliding window buffer. |
| **Interactive Controls** | **Zoom & Pan** | Smooth mouse-wheel zooming and drag-to-pan capabilities with double-click reset across all chart viewports. |
| **Interactive Controls** | **Filtering & Stress Modes** | Interactive category filters, value threshold sliders, and Instant Stress Mode presets: **Normal** (~10,000 pts), **Heavy** (~50,000 pts), and **Extreme** (~100,000 pts). |
| **Time Range Selection** | **Dynamic Windowing** | Preset time slices (30s, 1m, 5m, 15m, 1h, All) to instantly focus on specific temporal windows. |
| **Data Aggregation** | **Multi-Period Aggregation** | Group datasets by time periods (Raw, 1min, 5min, 1hour) processed off the main UI thread via Web Worker. |
| **Virtual Scrolling** | **Virtualized Data Table** | Custom `useVirtualization` composable rendering only visible table rows in viewport DOM, handling 100,000+ rows effortlessly with < 35 DOM nodes. |
| **Responsive Design** | **Fluid Multi-Layout** | Fully responsive layout adapting dynamically across Desktop, Tablet, and Mobile screens with active `ResizeObserver` canvas re-scaling. |

---

## 🛠️ Technical Stack

- **Frontend Framework**: Vue 3 (Composition API with `<script setup lang="ts">`)
- **Build System**: Vite 5 (Lightning-fast HMR and optimized production bundling)
- **State Management**: Pinia (`useDataStore` with `shallowRef` optimization)
- **Language**: TypeScript 5 (Strict type safety across all components and data structures)
- **Rendering Engine**: Hybrid HTML5 Canvas 2D + SVG (Custom build, 0% D3 / Chart.js)
- **Data Processing**: Web Workers (`public/workers/dataWorker.js` for off-thread LTTB downsampling and aggregation)

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js**: v18.18.0 or higher
- **npm**: v9.0.0 or higher

### Quick Start
```bash
# 1. Navigate to the project directory
cd performance-dashboard

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev

# 4. Open http://localhost:5173 in your browser
```

### Production Build & Verification
```bash
# Type-check and build optimized production distribution
npm run build

# Preview production build locally
npm run preview
```

---

## 🔧 Performance Testing Instructions

Follow this step-by-step testing procedure to benchmark FPS, memory consumption, interaction latency, and rendering throughput:

1. **Launch Dashboard**: Open `http://localhost:5173` in a Chromium-based browser (Google Chrome or Microsoft Edge recommended for native `performance.memory` telemetry).
2. **Observe Baseline Metrics**:
   - Inspect the top **Performance Monitor** header bar.
   - Verify baseline **FPS** stays solid at **60.0 FPS**.
   - Verify **Render Time** is under **3.0 ms** and **Frame Delta** is ~**16.6 ms**.
   - Note the initial **Memory Used** (~35–45 MB JS Heap).
3. **Execute Dataset Stress Testing**:
   - Under **Stress Mode** in the control panel, click **Heavy (~50,000 points)**.
   - Observe FPS remains stable between **55–60 FPS**.
   - Select **Extreme (~100,000 points)**.
   - Verify the dashboard continues streaming and rendering smoothly at **45–60 FPS** without UI freeze or browser lockup.
4. **Test Interactive Zoom & Pan Latency**:
   - Scroll mouse wheel over the Line Chart or Scatter Plot to zoom in/out.
   - Click and drag horizontally/vertically to pan across the viewport.
   - Verify interaction response time is instant (< 15 ms). Double-click to reset zoom.
5. **Test Filter & Aggregation Responsiveness**:
   - Adjust the min/max value range sliders or toggle category checkboxes.
   - Switch data aggregation between **Raw**, **1min**, **5min**, and **1hour**.
   - Notice that aggregation runs off-thread in the Web Worker, keeping the main UI responsive.
6. **Inspect Memory & Long Tasks in Chrome DevTools**:
   - Open DevTools (`F12` / `Cmd+Option+I`) -> **Performance** tab -> Record a 10-second interaction trace.
   - Confirm zero long tasks (> 50 ms) on the main thread during data ticks.
   - Check JS Heap stability in the **Memory** tab over a 15-minute continuous run to confirm zero memory accumulation.

---

## 🌐 Browser Compatibility Notes

| Browser | Supported Version | FPS Performance | `performance.memory` API | Web Worker Support | Canvas + SVG Hybrid | Notes |
|---|---|---|---|---|---|---|
| **Google Chrome** | 90+ | ⚡ 60 FPS | ✅ Full Support | ✅ Supported | ✅ Supported | Optimal development & testing target; full memory telemetry. |
| **Microsoft Edge** | 90+ | ⚡ 60 FPS | ✅ Full Support | ✅ Supported | ✅ Supported | Identical Chromium performance and memory API support. |
| **Mozilla Firefox** | 88+ | ⚡ 60 FPS | ⚠️ Fallback (`—`) | ✅ Supported | ✅ Supported | Full 60 FPS canvas performance; memory API safely falls back to gracefully formatted placeholder. |
| **Apple Safari** | 15+ | ⚡ 60 FPS | ⚠️ Fallback (`—`) | ✅ Supported | ✅ Supported | Retina display DPI auto-scaled via `window.devicePixelRatio`. |

### Compatibility & Fallback Mechanics
- **High-DPI Display Scaling**: Uses `Math.min(window.devicePixelRatio, 2)` to automatically scale canvas coordinate systems across Apple Retina and High-DPI Windows displays while capping hardware overdraw at 2x.
- **Memory API Fallback**: Chrome/Edge expose `performance.memory`. Firefox/Safari restrict this for privacy; PerfDash detects support dynamically and displays `—` without runtime exceptions.
- **ResizeObserver**: Leverages standard `ResizeObserver` with fallback window resize event listeners for universal element dimension tracking.
