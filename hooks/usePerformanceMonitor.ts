'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MetricsCollector } from '@/lib/performanceUtils';
import type { PerformanceMetrics } from '@/lib/types';

const EMPTY_METRICS: PerformanceMetrics = {
  fps: 0, frameDelta: 0, renderTime: 0, dataProcessingTime: 0,
  memoryUsed: 0, memoryTotal: 0, pointCount: 0, droppedFrames: 0, uptime: 0,
};

export function usePerformanceMonitor(
  pointCount: number,
  dataProcessingTime: number,
) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(EMPTY_METRICS);
  const collectorRef = useRef(new MetricsCollector());
  const rafRef       = useRef<number>(0);

  // Update collector when external data changes
  useEffect(() => {
    collectorRef.current.recordDataProcessing(dataProcessingTime, pointCount);
  }, [dataProcessingTime, pointCount]);

  useEffect(() => {
    let prev = performance.now();

    const loop = () => {
      const collector = collectorRef.current;
      collector.fps.tick();
      collector.render.begin();

      // Simulate render work measurement end in next micro-task
      Promise.resolve().then(() => {
        collector.render.end();
        const collected = collector.collect();
        setMetrics(collected);
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const resetDropped = useCallback(() => {
    collectorRef.current.render.resetDropped();
  }, []);

  return { metrics, resetDropped };
}
