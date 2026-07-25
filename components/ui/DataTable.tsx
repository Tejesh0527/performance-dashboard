'use client';

import React, { useMemo } from 'react';
import { useVirtualization } from '@/hooks/useVirtualization';
import type { DataPoint, TableColumn } from '@/lib/types';

const ITEM_H        = 32;
const CONTAINER_H   = 300;
const COLUMNS: TableColumn[] = [
  { key: 'timestamp', label: 'Time',     width: 150, formatter: v => new Date(v as number).toLocaleTimeString('en', { hour12: false, fractionalSecondDigits: 3 }) },
  { key: 'seriesId',  label: 'Series',   width: 100 },
  { key: 'category',  label: 'Category', width: 100 },
  { key: 'value',     label: 'Value',    width: 100, formatter: v => (v as number).toFixed(3), align: 'right' },
];

interface DataTableProps {
  data: DataPoint[];
}

function DataTable({ data }: DataTableProps) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.timestamp - a.timestamp),
    [data],
  );

  const { range, onScroll } = useVirtualization({
    totalItems:      sorted.length,
    itemHeight:      ITEM_H,
    containerHeight: CONTAINER_H,
    overscan:        8,
  });

  const colWidths = COLUMNS.map(c => `${c.width}px`).join(' ');

  return (
    <div className="table-wrapper">
      <div className="card-header">
        <span className="text-sm font-semibold">Data Table</span>
        <span className="badge badge-indigo">{sorted.length.toLocaleString()} rows</span>
      </div>

      {/* Column Headers */}
      <div className="table-header" style={{ display: 'grid', gridTemplateColumns: colWidths }}>
        {COLUMNS.map(col => (
          <div key={col.key as string} className="table-col-header">
            {col.label}
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div
        className="table-body"
        style={{ height: CONTAINER_H, overflowY: 'auto' }}
        onScroll={onScroll}
      >
        <div style={{ height: range.totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: range.offsetTop, left: 0, right: 0 }}>
            {sorted.slice(range.startIndex, range.endIndex + 1).map((row, i) => (
              <div
                key={`${row.seriesId}-${row.timestamp}-${i}`}
                className="table-row"
                style={{ display: 'grid', gridTemplateColumns: colWidths, height: ITEM_H }}
              >
                {COLUMNS.map(col => {
                  const raw = row[col.key as keyof DataPoint];
                  const display = col.formatter ? col.formatter(raw) : String(raw);
                  return (
                    <div
                      key={col.key as string}
                      className="table-cell"
                      style={{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}
                    >
                      {display}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DataTable);
