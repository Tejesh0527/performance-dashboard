'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useTransition,
  type ReactNode,
} from 'react';
import type { DataPoint, FilterState, PerformanceMetrics, TimeGranularity, TimeRange } from '@/lib/types';
import { SERIES_CONFIGS, CATEGORIES } from '@/lib/dataGenerator';
import { useDataStream } from '@/hooks/useDataStream';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// ─── Default Filter State ─────────────────────────────────────────────────────

const NOW = Date.now();

const DEFAULT_FILTERS: FilterState = {
  categories:    [...CATEGORIES],
  visibleSeries: SERIES_CONFIGS.map(s => s.id),
  timeRange:     { start: NOW - 60_000, end: NOW + 5 * 60_000 },
  granularity:   '1min',
  valueRange:    [0, 1000],
  stressMode:    'normal',
};

// ─── Context Shape ────────────────────────────────────────────────────────────

interface DataContextValue {
  // Data
  data: DataPoint[];
  pointCount: number;

  // Filters
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  updateFilter: (partial: Partial<FilterState>) => void;
  setTimeRange: (range: TimeRange) => void;
  setGranularity: (g: TimeGranularity) => void;
  setStressMode: (m: FilterState['stressMode']) => void;
  toggleSeries: (id: string) => void;
  toggleCategory: (cat: string) => void;

  // Stream controls
  isStreaming: boolean;
  isPaused: boolean;
  togglePause: () => void;
  toggleStream: () => void;
  reset: () => void;

  // Performance
  metrics: PerformanceMetrics;
  resetDropped: () => void;

  // Transition
  isFilterPending: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface DataProviderProps {
  initialData: DataPoint[];
  children: ReactNode;
}

export default function DataProvider({ initialData, children }: DataProviderProps) {
  console.log('[DataProvider] Rendered. initialData defined:', !!initialData, 'length:', initialData?.length);
  const [filters, setFiltersRaw] = useState<FilterState>(DEFAULT_FILTERS);
  const [isStreaming, setStreaming] = useState(true);
  const [isPaused, setPaused]     = useState(false);
  const [isFilterPending, startTransition] = useTransition();

  // Wrap filter updates in transition for non-blocking UI
  const setFilters = useCallback((f: FilterState) => {
    startTransition(() => setFiltersRaw(f));
  }, []);

  const updateFilter = useCallback((partial: Partial<FilterState>) => {
    startTransition(() => setFiltersRaw(prev => ({ ...prev, ...partial })));
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    updateFilter({ timeRange: range });
  }, [updateFilter]);

  const setGranularity = useCallback((g: TimeGranularity) => {
    updateFilter({ granularity: g });
  }, [updateFilter]);

  const setStressMode = useCallback((m: FilterState['stressMode']) => {
    updateFilter({ stressMode: m });
  }, [updateFilter]);

  const toggleSeries = useCallback((id: string) => {
    startTransition(() =>
      setFiltersRaw(prev => ({
        ...prev,
        visibleSeries: prev.visibleSeries.includes(id)
          ? prev.visibleSeries.filter(s => s !== id)
          : [...prev.visibleSeries, id],
      })),
    );
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    startTransition(() =>
      setFiltersRaw(prev => ({
        ...prev,
        categories: prev.categories.includes(cat)
          ? prev.categories.filter(c => c !== cat)
          : [...prev.categories, cat],
      })),
    );
  }, []);

  // Data stream
  const { data = [], dataProcessingTime = 0, pause, resume, reset: resetStream } = useDataStream({
    initialData: initialData || [],
    filters,
    enabled:    isStreaming,
    stressMode: filters.stressMode,
  });

  // Performance monitor
  const { metrics, resetDropped } = usePerformanceMonitor((data || []).length, dataProcessingTime);

  // Stream controls
  const togglePause = useCallback(() => {
    if (isPaused) { resume(); setPaused(false); }
    else          { pause();  setPaused(true);  }
  }, [isPaused, pause, resume]);

  const toggleStream = useCallback(() => {
    setStreaming(prev => !prev);
    if (isStreaming) pause();
    else            resume();
  }, [isStreaming, pause, resume]);

  const reset = useCallback(() => {
    resetStream();
    setFiltersRaw(DEFAULT_FILTERS);
  }, [resetStream]);

  // Context value — memoized
  const value = useMemo<DataContextValue>(() => ({
    data: data || [],
    pointCount: (data || []).length,
    filters,
    setFilters,
    updateFilter,
    setTimeRange,
    setGranularity,
    setStressMode,
    toggleSeries,
    toggleCategory,
    isStreaming,
    isPaused,
    togglePause,
    toggleStream,
    reset,
    metrics,
    resetDropped,
    isFilterPending,
  }), [
    data, filters, setFilters, updateFilter, setTimeRange, setGranularity,
    setStressMode, toggleSeries, toggleCategory, isStreaming, isPaused,
    togglePause, toggleStream, reset, metrics, resetDropped, isFilterPending,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
