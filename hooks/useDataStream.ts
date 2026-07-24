'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DataPoint, FilterState } from '@/lib/types';
import { generateTick, applyWindow, SERIES_CONFIGS } from '@/lib/dataGenerator';
import type { WorkerResponse } from '@/lib/types';

const MAX_POINTS_PER_SERIES = 1_700;  // ~10k total across 6 series
const TICK_INTERVAL_MS      = 100;

interface UseDataStreamOptions {
  initialData: DataPoint[];
  filters: FilterState;
  enabled?: boolean;
  stressMode?: FilterState['stressMode'];
}

export function useDataStream({
  initialData = [],
  filters,
  enabled = true,
  stressMode = 'normal',
}: UseDataStreamOptions) {
  console.log('[useDataStream] Rendered. initialData defined:', !!initialData, 'length:', initialData?.length);
  const [data, setData] = useState<DataPoint[]>(initialData || []);
  const [dataProcessingTime, setDataProcessingTime] = useState(0);

  const workerRef      = useRef<Worker | null>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataRef        = useRef<DataPoint[]>(initialData || []);
  const isPausedRef    = useRef(false);

  // Keep dataRef in sync without causing re-renders
  useEffect(() => { dataRef.current = data; }, [data]);

  // ─── Boot worker ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    workerRef.current = new Worker('/workers/dataWorker.js');
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'FILTER_RESULT') {
        setData(msg.result);
        setDataProcessingTime(msg.duration);
      }
    };
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, []);

  // ─── Stress mode: adjust max window ───────────────────────────────────────
  const maxPerSeries = stressMode === '100k' ? 17_000
                     : stressMode === '50k'  ? 8_500
                     : MAX_POINTS_PER_SERIES;

  // ─── Streaming tick ────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (isPausedRef.current) return;
    const t0   = performance.now();
    const tick_ = generateTick();
    const next  = applyWindow(dataRef.current, tick_, maxPerSeries * SERIES_CONFIGS.length);
    dataRef.current = next;

    // Offload filter to worker
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'FILTER', data: next, filters });
    } else {
      setData(next);
      setDataProcessingTime(performance.now() - t0);
    }
  }, [filters, maxPerSeries]);

  // ─── Start / stop interval ─────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enabled, tick]);

  const pause  = useCallback(() => { isPausedRef.current = true;  }, []);
  const resume = useCallback(() => { isPausedRef.current = false; }, []);
  const reset  = useCallback(() => { dataRef.current = []; setData([]); }, []);

  return { data, dataProcessingTime, pause, resume, reset };
}
