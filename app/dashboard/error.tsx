'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      background: '#0f1117',
    }}>
      <div style={{
        textAlign: 'center',
        color: 'rgba(255,255,255,0.85)',
        maxWidth: 420,
        padding: 32,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(239,68,68,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}>
          ⚠
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
          Dashboard Error
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
          {error.message || 'An unexpected error occurred while rendering the dashboard.'}
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16, fontFamily: 'monospace' }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
