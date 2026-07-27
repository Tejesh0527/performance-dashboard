import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import type { DataPoint, FilterState } from '@/lib/types'
import { generateTick, applyWindow, SERIES_CONFIGS } from '@/lib/dataGenerator'
import type { WorkerResponse } from '@/lib/types'

const MAX_POINTS_PER_SERIES = 1_700  // ~10k total across 6 series
const TICK_INTERVAL_MS      = 100

export function useDataStream(options: {
  initialData: DataPoint[]
  filters: Ref<FilterState>
  enabled: Ref<boolean>
}) {
  const { initialData, filters, enabled } = options

  const data               = ref<DataPoint[]>(initialData)
  const dataProcessingTime = ref(0)

  let worker:   Worker | null = null
  let interval: ReturnType<typeof setInterval> | null = null
  let paused = false

  // Internal mutable data ref (avoids deep reactivity cost on hot path)
  let dataStore = [...initialData]

  const maxPerSeries = () => {
    const mode = filters.value.stressMode
    return mode === '100k' ? 17_000 : mode === '50k' ? 8_500 : MAX_POINTS_PER_SERIES
  }

  function tick() {
    if (paused) return
    const t0     = performance.now()
    const tick_  = generateTick()
    const next   = applyWindow(dataStore, tick_, maxPerSeries() * SERIES_CONFIGS.length)
    dataStore    = next

    if (worker) {
      worker.postMessage({ type: 'FILTER', data: next, filters: filters.value })
    } else {
      data.value           = next
      dataProcessingTime.value = performance.now() - t0
    }
  }

  function startInterval() {
    stopInterval()
    if (!enabled.value) return
    interval = setInterval(tick, TICK_INTERVAL_MS)
  }

  function stopInterval() {
    if (interval != null) { clearInterval(interval); interval = null }
  }

  onMounted(() => {
    // Boot worker
    worker = new Worker('/workers/dataWorker.js')
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data
      if (msg.type === 'FILTER_RESULT') {
        data.value               = msg.result
        dataProcessingTime.value = msg.duration
      }
    }

    if (enabled.value) startInterval()
  })

  onUnmounted(() => {
    stopInterval()
    worker?.terminate()
    worker = null
  })

  // React to enabled toggling
  watch(enabled, (v) => { v ? startInterval() : stopInterval() })

  // Re-subscribe tick when filters change (new closure captures latest filters)
  watch(filters, () => { if (enabled.value) startInterval() }, { deep: true })

  function pause()  { paused = true  }
  function resume() { paused = false }
  function reset()  { dataStore = []; data.value = [] }

  return { data, dataProcessingTime, pause, resume, reset }
}
