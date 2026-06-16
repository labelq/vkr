export default function StatCard({ label, value, sub, color = '#2563eb' }) {
  return (
    <div className="stat-card" style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '36px', fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>{sub}</div>}
    </div>
  );
}
