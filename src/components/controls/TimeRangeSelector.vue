<script setup lang="ts">
import type { TimeRange } from '@/lib/types'

const props = defineProps<{ timeRange: TimeRange }>()
const emit  = defineEmits<{ change: [range: TimeRange] }>()

const PRESETS = [
  { label: '30s', ms:                  30_000 },
  { label: '1m',  ms:                  60_000 },
  { label: '5m',  ms:                 300_000 },
  { label: '15m', ms:                 900_000 },
  { label: '1h',  ms:               3_600_000 },
  { label: 'All', ms: Number.MAX_SAFE_INTEGER },
] as const

function activePreset(): number {
  return PRESETS.findIndex(p => {
    if (p.ms === Number.MAX_SAFE_INTEGER) return props.timeRange.start === 0
    return Math.abs((props.timeRange.end - props.timeRange.start) - p.ms) < 1_500
  })
}

function applyPreset(ms: number) {
  const end   = Date.now()
  const start = ms === Number.MAX_SAFE_INTEGER ? 0 : end - ms
  emit('change', { start, end })
}
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-xs text-muted" style="margin-right:4px">Range:</span>
    <button
      v-for="(p, i) in PRESETS"
      :key="p.label"
      :class="`btn btn-xs ${activePreset() === i ? 'btn-primary' : 'btn-ghost'}`"
      :aria-pressed="activePreset() === i"
      @click="applyPreset(p.ms)"
    >{{ p.label }}</button>
  </div>
</template>
