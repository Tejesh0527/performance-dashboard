export default function DashboardLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      background: '#0f1117',
    }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(99,102,241,0.15)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ fontSize: 15, fontWeight: 500 }}>Loading Dashboard…</p>
        <p style={{ fontSize: 12, marginTop: 8, opacity: 0.5 }}>
          Generating initial dataset and booting real-time engine
        </p>
      </div>
    </div>
  );
}
