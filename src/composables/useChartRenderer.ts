import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { setupCanvas } from '@/lib/canvasUtils'
import { lttbDownsample } from '@/lib/performanceUtils'
import type { RenderContext, DataPoint, ViewRange, ZoomState } from '@/lib/types'

// ─── useChartRenderer ─────────────────────────────────────────────────────────

export function useChartRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  renderFn: Ref<(rc: RenderContext) => void>,
) {
  let rafId = 0
  let rc: RenderContext | null = null
  const dirty = ref(true)

  function markDirty() { dirty.value = true }

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    rc = setupCanvas(canvas)

    const observer = new ResizeObserver(() => {
      if (canvasRef.value) {
        rc = setupCanvas(canvasRef.value)
        dirty.value = true
      }
    })
    observer.observe(canvas)

    const loop = () => {
      if (dirty.value && rc) {
        renderFn.value(rc)
        dirty.value = false
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    onUnmounted(() => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    })
  })

  return { markDirty, getRc: () => rc }
}

// ─── useZoomPan ───────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.1
const MAX_ZOOM = 20

export function useZoomPan(
  canvasRef: Ref<HTMLCanvasElement | null>,
  baseViewRange: Ref<ViewRange>,
  markDirty: () => void,
) {
  const zoom = ref<ZoomState>({ scale: 1, offsetX: 0, offsetY: 0 })

  function zoomedViewRange(): ViewRange {
    const { scale, offsetX, offsetY } = zoom.value
    const { timeRange, valueMin, valueMax } = baseViewRange.value
    const tRange = (timeRange.end - timeRange.start) / scale
    const vRange = (valueMax - valueMin) / scale
    const tCenter = (timeRange.start + timeRange.end) / 2 - offsetX
    const vCenter = (valueMin + valueMax) / 2 - offsetY
    return {
      timeRange: { start: tCenter - tRange / 2, end: tCenter + tRange / 2 },
      valueMin: vCenter - vRange / 2,
      valueMax: vCenter + vRange / 2,
    }
  }

  function resetZoom() {
    zoom.value = { scale: 1, offsetX: 0, offsetY: 0 }
    markDirty()
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    // Wheel → zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      zoom.value = {
        ...zoom.value,
        scale: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value.scale * factor)),
      }
      markDirty()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Drag → pan
    let dragging = false
    let dragStart = { x: 0, y: 0, ox: 0, oy: 0 }

    const onDown = (e: MouseEvent) => {
      dragging = true
      dragStart = { x: e.clientX, y: e.clientY, ox: zoom.value.offsetX, oy: zoom.value.offsetY }
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      const { timeRange, valueMin, valueMax } = baseViewRange.value
      const rect = canvas.getBoundingClientRect()
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      const tPerPx = (timeRange.end - timeRange.start) / (rect.width * zoom.value.scale)
      const vPerPx = (valueMax - valueMin) / (rect.height * zoom.value.scale)
      zoom.value = {
        ...zoom.value,
        offsetX: dragStart.ox + dx * tPerPx,
        offsetY: dragStart.oy - dy * vPerPx,
      }
      markDirty()
    }
    const onUp = () => { dragging = false; canvas.style.cursor = 'grab' }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

    onUnmounted(() => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    })
  })

  return { zoom, zoomedViewRange, resetZoom }
}

// ─── Viewport helpers ─────────────────────────────────────────────────────────

export function buildViewRange(data: DataPoint[], paddingPct = 0.05): ViewRange {
  if (!data.length) {
    const now = Date.now()
    return { timeRange: { start: now - 30_000, end: now }, valueMin: 0, valueMax: 100 }
  }
  let minT = Infinity, maxT = -Infinity, minV = Infinity, maxV = -Infinity
  for (const pt of data) {
    if (pt.timestamp < minT) minT = pt.timestamp
    if (pt.timestamp > maxT) maxT = pt.timestamp
    if (pt.value < minV) minV = pt.value
    if (pt.value > maxV) maxV = pt.value
  }
  const vRange = (maxV - minV) || 1
  return {
    timeRange: { start: minT, end: maxT },
    valueMin: minV - vRange * paddingPct,
    valueMax: maxV + vRange * paddingPct,
  }
}

export function sampleForDisplay(data: DataPoint[], maxPixels: number): DataPoint[] {
  if (data.length <= maxPixels) return data
  const byId = new Map<string, DataPoint[]>()
  for (const pt of data) {
    const arr = byId.get(pt.seriesId) ?? []
    arr.push(pt)
    byId.set(pt.seriesId, arr)
  }
  const result: DataPoint[] = []
  for (const [, pts] of byId) {
    const sampled = lttbDownsample(pts, Math.max(2, Math.ceil(maxPixels / byId.size)))
    result.push(...(sampled as DataPoint[]))
  }
  return result
}
