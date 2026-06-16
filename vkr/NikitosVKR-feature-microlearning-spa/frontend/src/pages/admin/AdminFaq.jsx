import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';

export default function AdminFaq() {
  const toast = useToast();
  const [faq, setFaq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: '', title: '', content: '' });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.faq.list().then(d => { if (!cancelled) setFaq(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const f = await api.faq.create(form);
      setFaq(prev => [...prev, f]);
      setForm({ category: '', title: '', content: '' });
      setShowForm(false);
      toast('Статья добавлена', 'success');
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Удалить статью?')) return;
    try {
      await api.faq.delete(id);
      setFaq(prev => prev.filter(f => f.id !== id));
      toast('Статья удалена', 'success');
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">База знаний</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Добавить статью'}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ padding: '24px', marginBottom: '24px' }} onSubmit={create}>
          <div className="form-group">
            <label>Категория</label>
            <input className="form-input" required placeholder="Например: РЕД ОС"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Заголовок</label>
            <input className="form-input" required placeholder="Вопрос..."
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Ответ</label>
            <textarea className="form-input" required rows={4} placeholder="Подробный ответ..."
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      )}

      {loading ? <div className="loading">Загрузка...</div> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Категория</th>
                <th>Заголовок</th>
                <th>Ответ</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {faq.map(f => (
                <tr key={f.id}>
                  <td><span className="badge-cat">{f.category}</span></td>
                  <td style={{ fontWeight: 500 }}>{f.title}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '300px' }}>
                    {f.content.substring(0, 80)}...
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(f.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
