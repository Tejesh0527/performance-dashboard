'use client';

import React, { useCallback, useTransition } from 'react';
import { SERIES_CONFIGS, CATEGORIES } from '@/lib/dataGenerator';
import type { FilterState } from '@/lib/types';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [isPending, startTransition] = useTransition();

  const update = useCallback((partial: Partial<FilterState>) => {
    startTransition(() => onChange({ ...filters, ...partial }));
  }, [filters, onChange]);

  const toggleSeries = useCallback((id: string) => {
    const next = filters.visibleSeries.includes(id)
      ? filters.visibleSeries.filter(s => s !== id)
      : [...filters.visibleSeries, id];
    update({ visibleSeries: next });
  }, [filters.visibleSeries, update]);

  const toggleCategory = useCallback((cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    update({ categories: next });
  }, [filters.categories, update]);

  return (
    <div className="sidebar">
      {/* Series Visibility */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Series</div>
        {SERIES_CONFIGS.map(s => {
          const active = filters.visibleSeries.includes(s.id);
          return (
            <div key={s.id} className="series-row">
              <input
                type="checkbox"
                className="toggle"
                checked={active}
                onChange={() => toggleSeries(s.id)}
                id={`series-toggle-${s.id}`}
              />
              <div className="series-swatch" style={{ background: s.color }} />
              <label
                htmlFor={`series-toggle-${s.id}`}
                className={`series-label ${active ? 'active' : ''}`}
              >
                {s.label}
              </label>
            </div>
          );
        })}
      </div>

      {/* Categories */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Categories</div>
        {CATEGORIES.map(cat => {
          const active = filters.categories.includes(cat);
          return (
            <div key={cat} className="series-row">
              <input
                type="checkbox"
                className="toggle"
                checked={active}
                onChange={() => toggleCategory(cat)}
                id={`cat-toggle-${cat}`}
              />
              <label
                htmlFor={`cat-toggle-${cat}`}
                className={`series-label ${active ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {cat}
              </label>
            </div>
          );
        })}
      </div>

      {/* Value Range */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Value Range</div>
        <div className="flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted" style={{ width: 32 }}>Min</span>
            <input
              type="range"
              min={0} max={500}
              value={filters.valueRange[0]}
              onChange={e => update({ valueRange: [+e.target.value, filters.valueRange[1]] })}
              style={{ flex: 1 }}
              id="filter-value-min"
            />
            <span className="font-mono text-xs" style={{ width: 36, textAlign: 'right' }}>
              {filters.valueRange[0]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted" style={{ width: 32 }}>Max</span>
            <input
              type="range"
              min={0} max={1000}
              value={filters.valueRange[1]}
              onChange={e => update({ valueRange: [filters.valueRange[0], +e.target.value] })}
              style={{ flex: 1 }}
              id="filter-value-max"
            />
            <span className="font-mono text-xs" style={{ width: 36, textAlign: 'right' }}>
              {filters.valueRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Granularity */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Aggregation</div>
        <select
          className="select"
          style={{ width: '100%' }}
          value={filters.granularity}
          onChange={e => update({ granularity: e.target.value as FilterState['granularity'] })}
          id="filter-granularity"
        >
          <option value="1s">1 Second</option>
          <option value="1min">1 Minute</option>
          <option value="5min">5 Minutes</option>
          <option value="1hour">1 Hour</option>
        </select>
      </div>

      {/* Stress Mode */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Stress Mode</div>
        <div className="flex-col gap-2">
          {(['normal', '50k', '100k'] as FilterState['stressMode'][]).map(mode => (
            <label key={mode} className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="stressMode"
                value={mode}
                checked={filters.stressMode === mode}
                onChange={() => update({ stressMode: mode })}
                style={{ accentColor: 'var(--accent-primary)' }}
                id={`stress-${mode}`}
              />
              <span className="text-sm" style={{ color: filters.stressMode === mode ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {mode === 'normal' ? 'Normal (~10k)' : mode === '50k' ? 'Heavy (~50k)' : 'Extreme (~100k)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Zoom hint */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Interactions</div>
        <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
          🖱 <strong>Scroll</strong> on charts to zoom<br />
          ✋ <strong>Drag</strong> on charts to pan<br />
          Click <strong>↺</strong> button to reset zoom
        </p>
      </div>

      {isPending && (
        <div className="sidebar-section">
          <span className="text-xs text-muted animate-pulse">Applying filters…</span>
        </div>
      )}
    </div>
  );
}

export default React.memo(FilterPanel);
