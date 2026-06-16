import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';

export default function AdminCourses() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', category: '', category_label: '', color: '#2563eb', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.courses.list().then(d => { if (!cancelled) setCourses(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const c = await api.courses.create(form);
      setCourses(prev => [...prev, { ...c, lesson_count: 0, completed_count: 0 }]);
      setForm({ title: '', category: '', category_label: '', color: '#2563eb', description: '' });
      setShowForm(false);
      toast('Курс создан', 'success');
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Удалить курс?')) return;
    try {
      await api.courses.delete(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast('Курс удалён', 'success');
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Управление курсами</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Добавить курс'}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ padding: '24px', marginBottom: '24px' }} onSubmit={create}>
          <div className="form-row">
            <div className="form-group">
              <label>Название</label>
              <input className="form-input" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Категория (key)</label>
              <input className="form-input" required placeholder="os / skzi / office"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Метка категории</label>
              <input className="form-input" required placeholder="Операционные системы"
                value={form.category_label}
                onChange={e => setForm(f => ({ ...f, category_label: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Цвет</label>
              <input className="form-input" type="color" value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea className="form-input" rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Создание...' : 'Создать'}
          </button>
        </form>
      )}

      {loading ? <div className="loading">Загрузка...</div> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Категория</th>
                <th>Уроков</th>
                <th>Тип</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: c.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{c.title}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.category_label}</td>
                  <td>{c.lesson_count}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                      background: c.is_custom ? '#fef3c7' : '#f0f9ff',
                      color: c.is_custom ? '#92400e' : '#1e40af',
                    }}>
                      {c.is_custom ? 'Кастомный' : 'Базовый'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <Link to={`/admin/courses/${c.id}/edit`} className="btn btn-sm btn-outline">
                      Уроки
                    </Link>
                    {c.is_custom && (
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}>Удалить</button>
                    )}
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
