<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { SERIES_CONFIGS } from '@/lib/dataGenerator'
import FilterPanel        from '@/components/controls/FilterPanel.vue'
import TimeRangeSelector  from '@/components/controls/TimeRangeSelector.vue'
import LineChart          from '@/components/charts/LineChart.vue'
import BarChart           from '@/components/charts/BarChart.vue'
import ScatterPlot        from '@/components/charts/ScatterPlot.vue'
import Heatmap            from '@/components/charts/Heatmap.vue'
import DataTable          from '@/components/ui/DataTable.vue'
import PerformanceMonitor from '@/components/ui/PerformanceMonitor.vue'

const store = useDataStore()

const visibleSeries = computed(() =>
  SERIES_CONFIGS.filter(s => store.filters.visibleSeries.includes(s.id))
)
</script>

<template>
  <div class="dashboard-root">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="logo">
        <div class="logo-icon">⚡</div>
        <span>PerfDash</span>
        <span class="text-muted text-sm" style="font-weight:400">— Real-time Data Visualization</span>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="store.isStreaming && !store.isPaused" class="flex items-center gap-2">
          <div class="live-dot" />
          <span class="text-xs text-secondary">LIVE</span>
        </div>
        <TimeRangeSelector
          :time-range="store.filters.timeRange"
          @change="store.setTimeRange"
        />
        <button
          id="btn-pause"
          :class="`btn btn-sm ${store.isPaused ? 'btn-primary' : 'btn-ghost'}`"
          @click="store.togglePause"
        >{{ store.isPaused ? '▶ Resume' : '⏸ Pause' }}</button>
        <button
          id="btn-stream"
          :class="`btn btn-sm ${store.isStreaming ? 'btn-danger' : 'btn-primary'}`"
          @click="store.toggleStream"
        >{{ store.isStreaming ? '⏹ Stop' : '▶ Start' }}</button>
        <button id="btn-reset" class="btn btn-ghost btn-sm" @click="store.resetData">↺ Reset</button>
      </div>
    </header>

    <!-- Body -->
    <div class="dashboard-body">
      <FilterPanel />

      <main class="main-content">
        <PerformanceMonitor :metrics="store.metrics" />

        <div class="charts-grid">
          <LineChart
            :data="store.data"
            :series="visibleSeries"
            title="Line Chart — Time Series"
            :filled="true"
            :height="300"
          />
          <BarChart
            :data="store.data"
            :series="visibleSeries"
            title="Bar Chart — Aggregated"
            :height="300"
            :granularity="store.filters.granularity"
          />
          <ScatterPlot
            :data="store.data"
            :series="visibleSeries"
            title="Scatter Plot"
            :height="300"
            :point-radius="3"
          />
          <Heatmap
            :data="store.data"
            title="Heatmap — Series × Time"
            :height="300"
            :granularity="store.filters.granularity"
          />
        </div>

        <DataTable :data="store.data" />
      </main>
    </div>
  </div>
</template>
