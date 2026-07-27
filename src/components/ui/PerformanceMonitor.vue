<script setup lang="ts">
import type { PerformanceMetrics } from '@/lib/types'

defineProps<{ metrics: PerformanceMetrics }>()

function fpsColor(fps: number) {
  if (fps >= 55) return 'var(--accent-green)'
  if (fps >= 30) return 'var(--accent-amber)'
  return 'var(--accent-red)'
}
function memColor(used: number) {
  if (used < 100)  return 'var(--accent-green)'
  if (used < 300)  return 'var(--accent-amber)'
  return 'var(--accent-red)'
}
function uptimeStr(uptime: number) {
  return `${Math.floor(uptime / 60).toString().padStart(2,'0')}:${Math.floor(uptime % 60).toString().padStart(2,'0')}`
}
</script>

<template>
  <div class="perf-monitor">
    <div class="perf-metric">
      <div class="perf-metric-value" :style="{ color: fpsColor(metrics.fps) }">
        {{ metrics.fps }}<span style="font-size:13px;opacity:0.6;margin-left:2px"></span>
      </div>
      <div class="perf-metric-label">FPS</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value">{{ metrics.frameDelta.toFixed(1) }}<span style="font-size:13px;opacity:0.6;margin-left:2px">ms</span></div>
      <div class="perf-metric-label">Frame Delta</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value">{{ metrics.renderTime.toFixed(1) }}<span style="font-size:13px;opacity:0.6;margin-left:2px">ms</span></div>
      <div class="perf-metric-label">Render Time</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value">{{ metrics.dataProcessingTime.toFixed(1) }}<span style="font-size:13px;opacity:0.6;margin-left:2px">ms</span></div>
      <div class="perf-metric-label">Data Proc</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value" style="color:var(--accent-cyan)">{{ metrics.pointCount.toLocaleString() }}</div>
      <div class="perf-metric-label">Points</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value" :style="{ color: metrics.memoryUsed > 0 ? memColor(metrics.memoryUsed) : undefined }">
        {{ metrics.memoryUsed > 0 ? metrics.memoryUsed.toFixed(0) : '—' }}
        <span v-if="metrics.memoryUsed > 0" style="font-size:13px;opacity:0.6;margin-left:2px">MB</span>
      </div>
      <div class="perf-metric-label">Memory Used</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value">{{ metrics.memoryTotal > 0 ? metrics.memoryTotal.toFixed(0) : '—' }}<span v-if="metrics.memoryTotal > 0" style="font-size:13px;opacity:0.6;margin-left:2px">MB</span></div>
      <div class="perf-metric-label">Mem Total</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value" :style="{ color: metrics.droppedFrames > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }">{{ metrics.droppedFrames }}</div>
      <div class="perf-metric-label">Dropped</div>
    </div>
    <div class="perf-metric">
      <div class="perf-metric-value">{{ uptimeStr(metrics.uptime) }}</div>
      <div class="perf-metric-label">Uptime</div>
    </div>
  </div>
</template>
