export default function ProgressBar({ value, max, color = '#2563eb' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        flex: 1, height: '8px', borderRadius: '4px',
        background: 'var(--surface-2, #f1f5f9)', overflow: 'hidden'
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', minWidth: '48px', textAlign: 'right' }}>
        {value}/{max}
      </span>
    </div>
  );
}
