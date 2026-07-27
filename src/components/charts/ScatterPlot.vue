<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChartRenderer, useZoomPan, buildViewRange, sampleForDisplay } from '@/composables/useChartRenderer'
import { clearCanvas, drawGrid, drawAxes, computeXTicks, computeYTicks, toPixelX, toPixelY, clipToPlot, hexToRgba } from '@/lib/canvasUtils'
import type { RenderContext, DataPoint } from '@/lib/types'
import type { SERIES_CONFIGS } from '@/lib/dataGenerator'

const props = withDefaults(defineProps<{
  data:         DataPoint[]
  series:       (typeof SERIES_CONFIGS[number])[]
  title?:       string
  height?:      number
  pointRadius?: number
}>(), { title: 'Scatter Plot', height: 280, pointRadius: 3 })

const canvasRef = ref<HTMLCanvasElement | null>(null)

const visibleIds   = computed(() => new Set(props.series.map(s => s.id)))
const filteredData = computed(() => props.data.filter(pt => visibleIds.value.has(pt.seriesId)))
const baseViewRange = computed(() => buildViewRange(filteredData.value))

const renderFnRef = ref<(rc: RenderContext) => void>(() => {})
const { markDirty } = useChartRenderer(canvasRef, renderFnRef)
const { zoom, zoomedViewRange, resetZoom } = useZoomPan(canvasRef, baseViewRange, markDirty)
const viewRange = computed(() => zoomedViewRange())

function renderChart(rc: RenderContext) {
  rc.viewRange = viewRange.value
  clearCanvas(rc)
  const sampled = sampleForDisplay(filteredData.value, rc.plotWidth)
  const xTicks  = computeXTicks(viewRange.value, 5)
  const yTicks  = computeYTicks(viewRange.value, 5)
  drawGrid(rc, xTicks, yTicks)

  const { ctx } = rc
  ctx.save()
  clipToPlot(rc)

  const bySeries = new Map<string, DataPoint[]>()
  for (const pt of sampled) {
    const arr = bySeries.get(pt.seriesId) ?? []
    arr.push(pt)
    bySeries.set(pt.seriesId, arr)
  }

  for (const s of props.series) {
    const pts = bySeries.get(s.id)
    if (!pts?.length) continue
    const path = new Path2D()
    for (const pt of pts) {
      const x = toPixelX(pt.timestamp, rc)
      const y = toPixelY(pt.value, rc)
      path.moveTo(x + props.pointRadius, y)
      path.arc(x, y, props.pointRadius, 0, Math.PI * 2)
    }
    ctx.fillStyle   = hexToRgba(s.color, 0.65)
    ctx.fill(path)
    ctx.strokeStyle = s.color
    ctx.lineWidth   = 0.5
    ctx.stroke(path)
  }

  ctx.restore()
  drawAxes(rc, xTicks, yTicks, 'Time', 'Value')
}

watch([filteredData, viewRange, () => props.series, () => props.pointRadius], () => {
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
        <span class="badge badge-amber">{{ filteredData.length.toLocaleString() }} pts</span>
      </div>
    </div>
    <div class="chart-canvas-wrapper" :style="{ height: `${height - 45}px` }">
      <canvas ref="canvasRef" style="width:100%;height:100%" />
    </div>
  </div>
</template>
