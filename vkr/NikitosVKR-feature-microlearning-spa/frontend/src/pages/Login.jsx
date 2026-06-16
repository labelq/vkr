import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      toast('Добро пожаловать!', 'success');
      navigate('/dashboard');
    } catch (err) {
      toast(err?.detail || 'Ошибка авторизации', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-badge">ПУЦ</span>
          <h1 className="auth-title">МикроОбучение</h1>
          <p className="auth-subtitle">Система обучения сотрудников МФЦ</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Войти</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Регистрация</button>
        </div>

        <form className="auth-form" onSubmit={handle}>
          {tab === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Полное имя</label>
              <input
                id="name" type="text" className="form-input"
                placeholder="Иванов Иван Иванович"
                value={form.name} required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" className="form-input"
              placeholder="user@mfc.ru"
              value={form.email} required
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password" type="password" className="form-input"
              placeholder="••••••••"
              value={form.password} required
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Загрузка...' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-demo">
          <p className="auth-demo-title">Демо-доступ:</p>
          <div className="auth-demo-accounts">
            <button className="auth-demo-btn" onClick={() => setForm({ name: '', email: 'user@mfc.ru', password: '123456' })}>
              Сотрудник
            </button>
            <button className="auth-demo-btn" onClick={() => setForm({ name: '', email: 'mod@puc.ru', password: '123456' })}>
              Модератор
            </button>
            <button className="auth-demo-btn" onClick={() => setForm({ name: '', email: 'admin@puc.ru', password: 'admin123' })}>
              Администратор
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
