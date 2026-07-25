'use client';

import React, { useCallback } from 'react';
import type { TimeRange } from '@/lib/types';

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onChange: (range: TimeRange) => void;
}

const PRESETS = [
  { label: '30s',  ms:       30_000 },
  { label: '1m',   ms:       60_000 },
  { label: '5m',   ms:      300_000 },
  { label: '15m',  ms:      900_000 },
  { label: '1h',   ms:    3_600_000 },
  { label: 'All',  ms: Number.MAX_SAFE_INTEGER },
] as const;

function TimeRangeSelector({ timeRange, onChange }: TimeRangeSelectorProps) {
  const activePreset = PRESETS.findIndex(p => {
    if (p.ms === Number.MAX_SAFE_INTEGER) return timeRange.start === 0;
    const duration = timeRange.end - timeRange.start;
    return Math.abs(duration - p.ms) < 1_500;
  });

  const applyPreset = useCallback((ms: number, idx: number) => {
    const end   = Date.now();
    const start = ms === Number.MAX_SAFE_INTEGER ? 0 : end - ms;
    onChange({ start, end });
  }, [onChange]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted" style={{ marginRight: 4 }}>Range:</span>
      {PRESETS.map((p, i) => (
        <button
          key={p.label}
          className={`btn btn-xs ${activePreset === i ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => applyPreset(p.ms, i)}
          aria-pressed={activePreset === i}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export default React.memo(TimeRangeSelector);
