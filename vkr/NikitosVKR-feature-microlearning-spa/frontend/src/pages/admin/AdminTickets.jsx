import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function AdminTickets() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: '', response: '' });

  useEffect(() => {
    let cancelled = false;
    api.tickets.adminList().then(d => { if (!cancelled) setTickets(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const startEdit = (t) => {
    setEditing(t.id);
    setForm({ status: t.status, response: t.response || '' });
  };

  const save = async (id) => {
    try {
      const updated = await api.tickets.update(id, form);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      setEditing(null);
      toast('Обращение обновлено', 'success');
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Обращения</h1>
      </div>

      {loading ? <div className="loading">Загрузка...</div> : tickets.length === 0 ? (
        <div className="empty-state">Нет обращений</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map(t => (
            <div key={t.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{t.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {t.user_name} · {new Date(t.created_at).toLocaleDateString('ru')}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div style={{ marginBottom: '12px' }}>{t.message}</div>
              {t.response && editing !== t.id && (
                <div className="ticket-response">
                  <div className="ticket-response-label">Ответ:</div>
                  <div>{t.response}</div>
                </div>
              )}
              {editing === t.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="open">Открыто</option>
                    <option value="in_progress">В работе</option>
                    <option value="closed">Закрыто</option>
                  </select>
                  <textarea
                    className="form-input" rows={3}
                    placeholder="Ответ пользователю..."
                    value={form.response}
                    onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => save(t.id)}>Сохранить</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Отмена</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(t)} style={{ marginTop: '8px' }}>
                  Ответить / изменить статус
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
