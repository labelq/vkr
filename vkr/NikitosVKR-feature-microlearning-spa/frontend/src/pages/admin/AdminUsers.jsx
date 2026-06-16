import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.users.list().then(d => { if (!cancelled) setUsers(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const changeRole = async (userId, role) => {
    try {
      const updated = await api.users.updateRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      toast('Роль обновлена', 'success');
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Пользователи</h1>
      </div>

      {loading ? <div className="loading">Загрузка...</div> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Отдел</th>
                <th>Роль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{u.department || '—'}</td>
                  <td><StatusBadge status={u.role} /></td>
                  <td>
                    <select
                      className="form-select"
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                    >
                      <option value="user">Сотрудник</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Администратор</option>
                    </select>
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
