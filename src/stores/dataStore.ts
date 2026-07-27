import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataPoint, FilterState, PerformanceMetrics, TimeGranularity, TimeRange } from '@/lib/types'
import { SERIES_CONFIGS, CATEGORIES } from '@/lib/dataGenerator'

// ─── Default Filter State ─────────────────────────────────────────────────────

const NOW = Date.now()

const DEFAULT_FILTERS: FilterState = {
  categories:    [...CATEGORIES],
  visibleSeries: SERIES_CONFIGS.map(s => s.id),
  timeRange:     { start: NOW - 60_000, end: NOW + 5 * 60_000 },
  granularity:   '1min',
  valueRange:    [0, 1000],
  stressMode:    'normal',
}

function emptyMetrics(): PerformanceMetrics {
  return {
    fps: 0, frameDelta: 0, renderTime: 0, dataProcessingTime: 0,
    memoryUsed: 0, memoryTotal: 0, pointCount: 0, droppedFrames: 0, uptime: 0,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDataStore = defineStore('data', () => {
  // ── State ──
  const data        = ref<DataPoint[]>([])
  const filters     = ref<FilterState>({ ...DEFAULT_FILTERS })
  const isStreaming  = ref(true)
  const isPaused    = ref(false)
  const metrics     = ref<PerformanceMetrics>(emptyMetrics())
  const isFilterPending = ref(false)

  // ── Getters ──
  const pointCount = computed(() => data.value.length)

  // ── Filter actions ──
  function setFilters(f: FilterState) {
    isFilterPending.value = true
    // Defer to yield to any ongoing render frame (useTransition equivalent)
    setTimeout(() => {
      filters.value = f
      isFilterPending.value = false
    }, 0)
  }

  function updateFilter(partial: Partial<FilterState>) {
    setFilters({ ...filters.value, ...partial })
  }

  function setTimeRange(range: TimeRange) {
    updateFilter({ timeRange: range })
  }

  function setGranularity(g: TimeGranularity) {
    updateFilter({ granularity: g })
  }

  function setStressMode(m: FilterState['stressMode']) {
    updateFilter({ stressMode: m })
  }

  function toggleSeries(id: string) {
    isFilterPending.value = true
    setTimeout(() => {
      const vs = filters.value.visibleSeries
      filters.value = {
        ...filters.value,
        visibleSeries: vs.includes(id) ? vs.filter(s => s !== id) : [...vs, id],
      }
      isFilterPending.value = false
    }, 0)
  }

  function toggleCategory(cat: string) {
    isFilterPending.value = true
    setTimeout(() => {
      const cats = filters.value.categories
      filters.value = {
        ...filters.value,
        categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat],
      }
      isFilterPending.value = false
    }, 0)
  }

  // ── Data actions ──
  function setData(d: DataPoint[]) {
    data.value = d
  }

  function resetData() {
    data.value = []
    filters.value = { ...DEFAULT_FILTERS }
  }

  // ── Metrics ──
  function setMetrics(m: PerformanceMetrics) {
    metrics.value = m
  }

  // ── Stream controls ──
  function toggleStream() {
    isStreaming.value = !isStreaming.value
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  return {
    // state
    data, filters, isStreaming, isPaused, metrics, isFilterPending,
    // getters
    pointCount,
    // actions
    setFilters, updateFilter, setTimeRange, setGranularity, setStressMode,
    toggleSeries, toggleCategory,
    setData, resetData, setMetrics,
    toggleStream, togglePause,
  }
})
