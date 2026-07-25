import { NextResponse } from 'next/server';
import { generateDataset, generateTick } from '@/lib/dataGenerator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode   = searchParams.get('mode') ?? 'tick';
  const points = parseInt(searchParams.get('points') ?? '1700', 10);

  if (mode === 'bulk') {
    const data = generateDataset(Math.min(points, 17_000));
    return NextResponse.json({ data, count: data.length, ts: Date.now() });
  }

  // Default: single tick
  const tick = generateTick();
  return NextResponse.json({ data: tick, count: tick.length, ts: Date.now() });
}
