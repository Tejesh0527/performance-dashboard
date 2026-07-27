<script setup lang="ts">
import { computed, watch } from 'vue'
import { useVirtualization } from '@/composables/useVirtualization'
import type { DataPoint, TableColumn } from '@/lib/types'

const props = defineProps<{ data: DataPoint[] }>()

const ITEM_H      = 32
const CONTAINER_H = 300
const COLUMNS: TableColumn[] = [
  { key: 'timestamp', label: 'Time',     width: 150, formatter: v => new Date(v as number).toLocaleTimeString('en', { hour12: false, fractionalSecondDigits: 3 }) },
  { key: 'seriesId',  label: 'Series',   width: 100 },
  { key: 'category',  label: 'Category', width: 100 },
  { key: 'value',     label: 'Value',    width: 100, formatter: v => (v as number).toFixed(3), align: 'right' },
]
const colWidths = COLUMNS.map(c => `${c.width}px`).join(' ')

const sorted = computed(() => [...props.data].sort((a, b) => b.timestamp - a.timestamp))

const { range, onScroll, updateTotal } = useVirtualization({
  totalItems:      sorted.value.length,
  itemHeight:      ITEM_H,
  containerHeight: CONTAINER_H,
  overscan:        8,
})

watch(() => sorted.value.length, (n) => updateTotal(n))
</script>

<template>
  <div class="table-wrapper">
    <div class="card-header">
      <span class="text-sm font-semibold">Data Table</span>
      <span class="badge badge-indigo">{{ sorted.length.toLocaleString() }} rows</span>
    </div>

    <!-- Column headers -->
    <div class="table-header" :style="{ display: 'grid', gridTemplateColumns: colWidths }">
      <div v-for="col in COLUMNS" :key="col.key as string" class="table-col-header">
        {{ col.label }}
      </div>
    </div>

    <!-- Virtualized body -->
    <div class="table-body" :style="{ height: `${CONTAINER_H}px`, overflowY: 'auto' }" @scroll="onScroll">
      <div :style="{ height: `${range.totalHeight}px`, position: 'relative' }">
        <div :style="{ position: 'absolute', top: `${range.offsetTop}px`, left: 0, right: 0 }">
          <div
            v-for="(row, i) in sorted.slice(range.startIndex, range.endIndex + 1)"
            :key="`${row.seriesId}-${row.timestamp}-${i}`"
            class="table-row"
            :style="{ display: 'grid', gridTemplateColumns: colWidths, height: `${ITEM_H}px` }"
          >
            <div
              v-for="col in COLUMNS"
              :key="col.key as string"
              class="table-cell"
              :style="{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }"
            >
              {{ col.formatter ? col.formatter(row[col.key as keyof DataPoint]) : String(row[col.key as keyof DataPoint]) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
