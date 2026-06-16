const STATUS_MAP = {
  open:        { label: 'Открыто',       color: '#2563eb', bg: '#eff6ff' },
  in_progress: { label: 'В работе',      color: '#f59e0b', bg: '#fffbeb' },
  closed:      { label: 'Закрыто',       color: '#22c55e', bg: '#f0fdf4' },
  user:        { label: 'Сотрудник',     color: '#6366f1', bg: '#eef2ff' },
  moderator:   { label: 'Модератор',     color: '#f59e0b', bg: '#fffbeb' },
  admin:       { label: 'Администратор', color: '#ef4444', bg: '#fef2f2' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      display: 'inline-block',
    }}>
      {cfg.label}
    </span>
  );
}
