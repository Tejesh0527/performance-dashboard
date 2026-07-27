<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChartRenderer } from '@/composables/useChartRenderer'
import { clearCanvas, interpolateHeat } from '@/lib/canvasUtils'
import { aggregateData, SERIES_CONFIGS } from '@/lib/dataGenerator'
import type { RenderContext, DataPoint, HeatmapCell, TimeGranularity } from '@/lib/types'

const props = withDefaults(defineProps<{
  data:        DataPoint[]
  title?:      string
  height?:     number
  granularity?: TimeGranularity
}>(), { title: 'Heatmap', height: 280, granularity: '1min' })

const PADDING       = { top: 40, right: 20, bottom: 60, left: 80 }
const SERIES_LABELS = SERIES_CONFIGS.map(s => s.label)
const SERIES_IDS    = SERIES_CONFIGS.map(s => s.id) as string[]
const N_SERIES      = SERIES_CONFIGS.length

const canvasRef = ref<HTMLCanvasElement | null>(null)

const heatData = computed(() => {
  const agg = aggregateData(props.data, props.granularity)
  if (!agg.length) return { cells: [] as HeatmapCell[], bucketTimes: [] as number[] }
  const timeBuckets = [...new Set(agg.map(p => p.timestamp))].sort((a, b) => a - b)
  const maxVal = Math.max(...agg.map(p => p.avg), 1)
  const cells: HeatmapCell[] = []
  for (const pt of agg) {
    const xIdx = timeBuckets.indexOf(pt.timestamp)
    const yIdx = SERIES_IDS.indexOf(pt.seriesId)
    if (xIdx < 0 || yIdx < 0) continue
    cells.push({ x: xIdx, y: yIdx, value: pt.avg / maxVal, count: pt.count })
  }
  return { cells, bucketTimes: timeBuckets }
})

const cells       = computed(() => heatData.value.cells)
const bucketTimes = computed(() => heatData.value.bucketTimes)
const timeBucketCount = computed(() => cells.value.length ? Math.max(...cells.value.map(c => c.x)) + 1 : 1)

const renderFnRef = ref<(rc: RenderContext) => void>(() => {})
const { markDirty } = useChartRenderer(canvasRef, renderFnRef)

function renderChart(rc: RenderContext) {
  clearCanvas(rc)
  const { ctx } = rc
  const plot = {
    left:   PADDING.left,
    top:    PADDING.top,
    width:  rc.width  - PADDING.left - PADDING.right,
    height: rc.height - PADDING.top  - PADDING.bottom,
  }
  if (!cells.value.length || timeBucketCount.value < 1) return

  const cellW = plot.width  / timeBucketCount.value
  const cellH = plot.height / N_SERIES

  for (const cell of cells.value) {
    const x = plot.left + cell.x * cellW
    const y = plot.top  + cell.y * cellH
    ctx.fillStyle = interpolateHeat(cell.value)
    ctx.fillRect(x, y, Math.max(cellW - 1, 1), Math.max(cellH - 1, 1))
  }

  ctx.save()
  ctx.fillStyle    = 'rgba(255,255,255,0.55)'
  ctx.font         = '11px Inter, system-ui, sans-serif'
  ctx.textAlign    = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < N_SERIES; i++) {
    ctx.fillText(SERIES_LABELS[i], plot.left - 6, plot.top + i * cellH + cellH / 2)
  }

  const step = Math.max(1, Math.floor(timeBucketCount.value / 6))
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  for (let i = 0; i < timeBucketCount.value; i += step) {
    const ts = bucketTimes.value[i]
    if (ts == null) continue
    const x = plot.left + i * cellW + cellW / 2
    const d = new Date(ts)
    const label = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillText(label, x, plot.top + plot.height + 6)
  }

  const legendW = 120, legendH = 8
  const lx = plot.left + plot.width - legendW
  const ly = rc.height - 20
  const grad = ctx.createLinearGradient(lx, 0, lx + legendW, 0)
  grad.addColorStop(0,   interpolateHeat(0))
  grad.addColorStop(0.5, interpolateHeat(0.5))
  grad.addColorStop(1,   interpolateHeat(1))
  ctx.fillStyle = grad
  ctx.fillRect(lx, ly, legendW, legendH)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth   = 1
  ctx.strokeRect(lx, ly, legendW, legendH)
  ctx.fillStyle    = 'rgba(255,255,255,0.4)'
  ctx.font         = '10px Inter, system-ui, sans-serif'
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('Low', lx, ly + legendH + 3)
  ctx.textAlign = 'right'
  ctx.fillText('High', lx + legendW, ly + legendH + 3)
  ctx.restore()
}

watch([cells, timeBucketCount, bucketTimes], () => {
  renderFnRef.value = renderChart
  markDirty()
}, { immediate: true })
</script>

<template>
  <div class="chart-container" :style="{ height: `${height}px` }">
    <div class="chart-header">
      <span class="text-sm font-semibold">{{ title }}</span>
      <span class="badge badge-green">{{ cells.length.toLocaleString() }} cells</span>
    </div>
    <div class="chart-canvas-wrapper" :style="{ height: `${height - 45}px` }">
      <canvas ref="canvasRef" style="width:100%;height:100%" />
    </div>
  </div>
</template>
