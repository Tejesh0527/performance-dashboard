<script setup lang="ts">
import { ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { useDataStream } from '@/composables/useDataStream'
import { usePerformanceMonitor } from '@/composables/usePerformanceMonitor'
import Dashboard from '@/components/Dashboard.vue'
import { generateDataset } from '@/lib/dataGenerator'

const store = useDataStore()

// Generate initial snapshot
const initialData = generateDataset(1700)
store.setData(initialData)

// Wire streaming into store
const { data, dataProcessingTime, pause, resume, reset } = useDataStream({
  initialData,
  filters:  store.$state.filters as any,
  enabled:  store.$state.isStreaming as any,
})

// Keep store data in sync with stream output
import { watch } from 'vue'
watch(data, (d) => store.setData(d))

// Performance monitor
const { metrics, resetDropped } = usePerformanceMonitor(
  store.pointCount as any,
  dataProcessingTime,
)
watch(metrics, (m) => store.setMetrics(m))

// Pause / resume bridge
watch(() => store.isPaused, (paused) => { paused ? pause() : resume() })
watch(() => store.isStreaming, (streaming) => {
  if (!streaming) { pause() } else if (!store.isPaused) { resume() }
})
watch(() => store.data.length === 0, (empty) => { if (empty) reset() })
</script>

<template>
  <Dashboard />
</template>
