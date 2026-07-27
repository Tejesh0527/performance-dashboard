<script setup lang="ts">
import { useDataStore } from '@/stores/dataStore'
import { SERIES_CONFIGS, CATEGORIES } from '@/lib/dataGenerator'
import type { FilterState } from '@/lib/types'

const store = useDataStore()
</script>

<template>
  <div class="sidebar">
    <!-- Series Visibility -->
    <div class="sidebar-section">
      <div class="sidebar-section-title">Series</div>
      <div v-for="s in SERIES_CONFIGS" :key="s.id" class="series-row">
        <input
          type="checkbox"
          class="toggle"
          :checked="store.filters.visibleSeries.includes(s.id)"
          :id="`series-toggle-${s.id}`"
          @change="store.toggleSeries(s.id)"
        />
        <div class="series-swatch" :style="{ background: s.color }" />
        <label
          :for="`series-toggle-${s.id}`"
          :class="`series-label ${store.filters.visibleSeries.includes(s.id) ? 'active' : ''}`"
        >{{ s.label }}</label>
      </div>
    </div>

    <!-- Categories -->
    <div class="sidebar-section">
      <div class="sidebar-section-title">Categories</div>
      <div v-for="cat in CATEGORIES" :key="cat" class="series-row">
        <input
          type="checkbox"
          class="toggle"
          :checked="store.filters.categories.includes(cat)"
          :id="`cat-toggle-${cat}`"
          @change="store.toggleCategory(cat)"
        />
        <label
          :for="`cat-toggle-${cat}`"
          :class="`series-label ${store.filters.categories.includes(cat) ? 'active' : ''}`"
          style="text-transform:capitalize"
        >{{ cat }}</label>
      </div>
    </div>

    <!-- Value Range -->
    <div class="sidebar-section">
      <div class="sidebar-section-title">Value Range</div>
      <div class="flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted" style="width:32px">Min</span>
          <input
            type="range" min="0" max="500"
            :value="store.filters.valueRange[0]"
            style="flex:1"
            id="filter-value-min"
            @input="e => store.updateFilter({ valueRange: [+(e.target as HTMLInputElement).value, store.filters.valueRange[1]] })"
          />
          <span class="font-mono text-xs" style="width:36px;text-align:right">{{ store.filters.valueRange[0] }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted" style="width:32px">Max</span>
          <input
            type="range" min="0" max="1000"
            :value="store.filters.valueRange[1]"
            style="flex:1"
            id="filter-value-max"
            @input="e => store.updateFilter({ valueRange: [store.filters.valueRange[0], +(e.target as HTMLInputElement).value] })"
          />
          <span class="font-mono text-xs" style="width:36px;text-align:right">{{ store.filters.valueRange[1] }}</span>
        </div>
      </div>
    </div>

    <!-- Aggregation -->
    <div class="sidebar-section">
      <div class="sidebar-section-title">Aggregation</div>
      <select
        class="select"
        style="width:100%"
        :value="store.filters.granularity"
        id="filter-granularity"
        @change="e => store.setGranularity((e.target as HTMLSelectElement).value as FilterState['granularity'])"
      >
        <option value="1s">1 Second</option>
        <option value="1min">1 Minute</option>
        <option value="5min">5 Minutes</option>
        <option value="1hour">1 Hour</option>
      </select>
    </div>

    <!-- Stress Mode -->
    <div class="sidebar-section">
      <div class="sidebar-section-title">Stress Mode</div>
      <div class="flex-col gap-2">
        <label
          v-for="mode in ['normal', '50k', '100k'] as FilterState['stressMode'][]"
          :key="mode"
          class="flex items-center gap-2"
          style="cursor:pointer"
        >
          <input
            type="radio"
            name="stressMode"
            :value="mode"
            :checked="store.filters.stressMode === mode"
            :id="`stress-${mode}`"
            style="accent-color:var(--accent-primary)"
            @change="store.setStressMode(mode)"
          />
          <span class="text-sm" :style="{ color: store.filters.stressMode === mode ? 'var(--text-primary)' : 'var(--text-muted)' }">
            {{ mode === 'normal' ? 'Normal (~10k)' : mode === '50k' ? 'Heavy (~50k)' : 'Extreme (~100k)' }}
          </span>
        </label>
      </div>
    </div>

    <!-- Interactions hint -->
    <div class="sidebar-section">
      <div class="sidebar-section-title">Interactions</div>
      <p class="text-xs text-muted" style="line-height:1.6">
        🖱 <strong>Scroll</strong> on charts to zoom<br />
        ✋ <strong>Drag</strong> on charts to pan<br />
        Click <strong>↺</strong> button to reset zoom
      </p>
    </div>

    <div v-if="store.isFilterPending" class="sidebar-section">
      <span class="text-xs text-muted animate-pulse">Applying filters…</span>
    </div>
  </div>
</template>
