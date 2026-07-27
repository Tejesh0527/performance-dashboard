import { ref, watch, onMounted, onUnmounted } from 'vue'
import { MetricsCollector } from '@/lib/performanceUtils'
import type { PerformanceMetrics } from '@/lib/types'

const EMPTY_METRICS: PerformanceMetrics = {
  fps: 0, frameDelta: 0, renderTime: 0, dataProcessingTime: 0,
  memoryUsed: 0, memoryTotal: 0, pointCount: 0, droppedFrames: 0, uptime: 0,
}

export function usePerformanceMonitor(
  pointCount:         ReturnType<typeof ref<number>>,
  dataProcessingTime: ReturnType<typeof ref<number>>,
) {
  const metrics   = ref<PerformanceMetrics>({ ...EMPTY_METRICS })
  const collector = new MetricsCollector()
  let rafId = 0

  // Sync collector when external data changes
  watch([pointCount, dataProcessingTime], ([pc, dt]) => {
    collector.recordDataProcessing(dt as number, pc as number)
  })

  onMounted(() => {
    const loop = () => {
      collector.fps.tick()
      collector.render.begin()
      Promise.resolve().then(() => {
        collector.render.end()
        metrics.value = collector.collect()
      })
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  })

  onUnmounted(() => cancelAnimationFrame(rafId))

  function resetDropped() { collector.render.resetDropped() }

  return { metrics, resetDropped }
}
