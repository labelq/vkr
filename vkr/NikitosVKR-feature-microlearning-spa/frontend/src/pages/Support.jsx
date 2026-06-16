import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Support() {
  const toast = useToast();
  const [tab, setTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [faq, setFaq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '' });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.tickets.list(), api.faq.list()])
      .then(([t, f]) => { if (!cancelled) { setTickets(t); setFaq(f); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const t = await api.tickets.create(form);
      setTickets(prev => [t, ...prev]);
      setForm({ title: '', message: '' });
      setShowForm(false);
      toast('Обращение создано', 'success');
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaq = faq.filter(f =>
    !search ||
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.content.toLowerCase().includes(search.toLowerCase())
  );

  const faqByCategory = filteredFaq.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Поддержка</h1>
          <p className="page-subtitle">Обращения и база знаний</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'tickets' ? ' active' : ''}`} onClick={() => setTab('tickets')}>
          Мои обращения {tickets.length > 0 && <span className="badge">{tickets.length}</span>}
        </button>
        <button className={`tab${tab === 'faq' ? ' active' : ''}`} onClick={() => setTab('faq')}>
          База знаний
        </button>
      </div>

      {tab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Отмена' : '+ Создать обращение'}
            </button>
          </div>

          {showForm && (
            <form className="card" style={{ marginBottom: '24px', padding: '24px' }} onSubmit={submit}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Новое обращение</h3>
              <div className="form-group">
                <label>Тема</label>
                <input
                  className="form-input" required
                  placeholder="Краткое описание проблемы"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  className="form-input" required rows={4}
                  placeholder="Подробно опишите проблему..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          )}

          {loading ? <div className="loading">Загрузка...</div> : tickets.length === 0 ? (
            <div className="empty-state">Нет обращений</div>
          ) : (
            <div className="tickets-list">
              {tickets.map(t => (
                <div key={t.id} className="ticket-card card">
                  <div className="ticket-header">
                    <div>
                      <div className="ticket-title">{t.title}</div>
                      <div className="ticket-date">{new Date(t.created_at).toLocaleDateString('ru')}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="ticket-message">{t.message}</div>
                  {t.response && (
                    <div className="ticket-response">
                      <div className="ticket-response-label">Ответ поддержки:</div>
                      <div>{t.response}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'faq' && (
        <div>
          <input
            className="form-input search-input"
            placeholder="Поиск по базе знаний..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: '24px' }}
          />
          {Object.keys(faqByCategory).length === 0 ? (
            <div className="empty-state">Ничего не найдено</div>
          ) : Object.entries(faqByCategory).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</h3>
              <div className="faq-list">
                {items.map(f => (
                  <div key={f.id} className="faq-item card">
                    <button
                      className="faq-question"
                      onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                    >
                      <span>{f.title}</span>
                      <span>{expanded === f.id ? '▲' : '▼'}</span>
                    </button>
                    {expanded === f.id && (
                      <div className="faq-answer">{f.content}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
