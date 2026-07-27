<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChartRenderer, useZoomPan, buildViewRange } from '@/composables/useChartRenderer'
import { clearCanvas, drawGrid, drawAxes, computeXTicks, computeYTicks, toPixelX, toPixelY, clipToPlot, hexToRgba } from '@/lib/canvasUtils'
import { aggregateData } from '@/lib/dataGenerator'
import type { RenderContext, DataPoint, TimeGranularity } from '@/lib/types'
import type { SERIES_CONFIGS } from '@/lib/dataGenerator'

const props = withDefaults(defineProps<{
  data:        DataPoint[]
  series:      (typeof SERIES_CONFIGS[number])[]
  title?:      string
  height?:     number
  granularity?: TimeGranularity
}>(), { title: 'Bar Chart', height: 280, granularity: '1min' })

const canvasRef = ref<HTMLCanvasElement | null>(null)

const visibleIds   = computed(() => new Set(props.series.map(s => s.id)))
const filteredData = computed(() => props.data.filter(pt => visibleIds.value.has(pt.seriesId)))
const aggData      = computed(() => aggregateData(filteredData.value, props.granularity))
const baseViewRange = computed(() => {
  if (!aggData.value.length) return buildViewRange([])
  let minT = Infinity, maxT = -Infinity, maxV = -Infinity
  for (const pt of aggData.value) {
    if (pt.timestamp < minT) minT = pt.timestamp
    if (pt.timestamp > maxT) maxT = pt.timestamp
    if (pt.avg > maxV) maxV = pt.avg
  }
  return { timeRange: { start: minT, end: maxT }, valueMin: 0, valueMax: maxV * 1.1 }
})

const renderFnRef = ref<(rc: RenderContext) => void>(() => {})
const { markDirty } = useChartRenderer(canvasRef, renderFnRef)
const { zoom, zoomedViewRange, resetZoom } = useZoomPan(canvasRef, baseViewRange, markDirty)
const viewRange = computed(() => zoomedViewRange())

function renderChart(rc: RenderContext) {
  rc.viewRange = viewRange.value
  clearCanvas(rc)
  const xTicks = computeXTicks(viewRange.value, 5)
  const yTicks = computeYTicks(viewRange.value, 5)
  drawGrid(rc, xTicks, yTicks)

  const bySeries = new Map<string, typeof aggData.value>()
  for (const pt of aggData.value) {
    const arr = bySeries.get(pt.seriesId) ?? []
    arr.push(pt)
    bySeries.set(pt.seriesId, arr)
  }

  const seriesArr = [...bySeries.keys()]
  const nSeries   = seriesArr.length || 1
  const { ctx }   = rc

  ctx.save()
  clipToPlot(rc)

  for (let si = 0; si < seriesArr.length; si++) {
    const sid = seriesArr[si]
    const pts = bySeries.get(sid)!
    const cfg = props.series.find(s => s.id === sid)
    if (!cfg) continue

    for (let i = 0; i < pts.length; i++) {
      const pt    = pts[i]
      const cx    = toPixelX(pt.timestamp, rc)
      const baseY = rc.padding.top + rc.plotHeight
      const next  = pts[i + 1]
      const bW    = next ? (toPixelX(next.timestamp, rc) - cx) * 0.85 : rc.plotWidth / (pts.length + 1) * 0.85
      const barW  = bW / nSeries
      const barX  = cx - bW / 2 + si * barW
      const barH  = baseY - toPixelY(pt.avg, rc)

      const grad = ctx.createLinearGradient(0, baseY - barH, 0, baseY)
      grad.addColorStop(0, cfg.color)
      grad.addColorStop(1, hexToRgba(cfg.color, 0.2))
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(barX, baseY - barH, barW - 2, barH, [3, 3, 0, 0])
      ctx.fill()
    }
  }
  ctx.restore()
  drawAxes(rc, xTicks, yTicks, `Time (${props.granularity})`, 'Avg Value')
}

watch([aggData, viewRange, () => props.series, () => props.granularity], () => {
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
        <span class="badge badge-cyan">{{ aggData.length.toLocaleString() }} buckets</span>
      </div>
    </div>
    <div class="chart-canvas-wrapper" :style="{ height: `${height - 45}px` }">
      <canvas ref="canvasRef" style="width:100%;height:100%" />
    </div>
  </div>
</template>
