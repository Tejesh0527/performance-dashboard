<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChartRenderer, useZoomPan, buildViewRange, sampleForDisplay } from '@/composables/useChartRenderer'
import { clearCanvas, drawGrid, drawLineSeries, computeXTicks, computeYTicks } from '@/lib/canvasUtils'
import type { RenderContext, DataPoint } from '@/lib/types'
import type { SERIES_CONFIGS } from '@/lib/dataGenerator'

const props = withDefaults(defineProps<{
  data:      DataPoint[]
  series:    (typeof SERIES_CONFIGS[number])[]
  title?:    string
  filled?:   boolean
  height?:   number
}>(), { title: 'Line Chart', filled: true, height: 280 })

const canvasRef = ref<HTMLCanvasElement | null>(null)

const visibleSeriesIds = computed(() => new Set(props.series.map(s => s.id)))
const filteredData     = computed(() => props.data.filter(pt => visibleSeriesIds.value.has(pt.seriesId)))
const baseViewRange    = computed(() => buildViewRange(filteredData.value))

// Stable render function ref so RAF loop always calls the latest version
const renderFnRef = ref<(rc: RenderContext) => void>(() => {})

const { markDirty } = useChartRenderer(canvasRef, renderFnRef)
const { zoom, zoomedViewRange, resetZoom } = useZoomPan(canvasRef, baseViewRange, markDirty)

const viewRange = computed(() => zoomedViewRange())
const xTicks    = computed(() => computeXTicks(viewRange.value, 5))
const yTicks    = computed(() => computeYTicks(viewRange.value, 5))
const canvasH   = computed(() => props.height - 45)
const PADDING   = { top: 40, right: 30, bottom: 50, left: 65 }

function renderChart(rc: RenderContext) {
  rc.viewRange = viewRange.value
  clearCanvas(rc)
  const sampled = sampleForDisplay(filteredData.value, rc.plotWidth * 2)
  const xt = computeXTicks(viewRange.value, 5)
  const yt = computeYTicks(viewRange.value, 5)
  drawGrid(rc, xt, yt)
  for (const s of props.series) {
    const pts = sampled.filter(pt => pt.seriesId === s.id)
    if (pts.length < 2) continue
    drawLineSeries(rc, pts, s.color, 2, props.filled)
  }
}

// Keep render fn ref up-to-date and mark dirty on data changes
watch([filteredData, viewRange, () => props.series, () => props.filled], () => {
  renderFnRef.value = renderChart
  markDirty()
}, { immediate: true })
</script>

<template>
  <div class="chart-container" :style="{ height: `${height}px` }">
    <div class="chart-header">
      <span class="text-sm font-semibold">{{ title }}</span>
      <div class="flex items-center gap-2">
        <button v-if="zoom.scale !== 1" class="btn btn-xs btn-ghost" @click="resetZoom">
          ↺ {{ zoom.scale.toFixed(1) }}×
        </button>
        <span class="badge badge-indigo">{{ filteredData.length.toLocaleString() }} pts</span>
      </div>
    </div>
    <div class="chart-canvas-wrapper" :style="{ height: `${canvasH}px`, position: 'relative' }">
      <canvas ref="canvasRef" style="width:100%;height:100%" />
      <!-- SVG overlay for axis labels (Canvas + SVG hybrid) -->
      <svg
        style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <text
          v-for="(t, i) in xTicks"
          :key="`x-${i}`"
          :x="`${(PADDING.left / 800 + t.position * (1 - (PADDING.left + PADDING.right) / 800)) * 100}%`"
          y="96%"
          text-anchor="middle"
          fill="rgba(255,255,255,0.5)"
          font-size="2.5"
          font-family="var(--font-sans)"
        >{{ t.label }}</text>
        <text
          v-for="(t, i) in yTicks"
          :key="`y-${i}`"
          x="1%"
          :y="`${(PADDING.top / canvasH + t.position * (1 - (PADDING.top + 50) / canvasH)) * 100}%`"
          text-anchor="start"
          dominant-baseline="middle"
          fill="rgba(255,255,255,0.5)"
          font-size="2.5"
          font-family="var(--font-mono)"
        >{{ t.label }}</text>
      </svg>
    </div>
  </div>
</template>
