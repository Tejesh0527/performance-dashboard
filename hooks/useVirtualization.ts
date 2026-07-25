'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseVirtualizationOptions {
  totalItems: number;
  itemHeight: number;        // px
  containerHeight: number;   // px
  overscan?: number;         // extra rows above/below viewport
}

export interface VirtualRange {
  startIndex:  number;
  endIndex:    number;
  offsetTop:   number;    // px — top padding to simulate scrolled-away rows
  totalHeight: number;    // px — total list height for scroll container
}

export function useVirtualization({
  totalItems,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualizationOptions) {
  const [scrollTop, setScrollTop] = useState(0);

  const range = useMemo<VirtualRange>(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex   = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex     = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);
    return {
      startIndex,
      endIndex,
      offsetTop:   startIndex * itemHeight,
      totalHeight: totalItems * itemHeight,
    };
  }, [scrollTop, totalItems, itemHeight, containerHeight, overscan]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.currentTarget as HTMLDivElement).scrollTop);
  }, []);

  return { range, onScroll };
}
