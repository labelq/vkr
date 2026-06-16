import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.role === 'admin' ? 'Администратор' : user?.role === 'moderator' ? 'Модератор' : 'Сотрудник';

  const handleLogout = async () => {
    await logout();
    toast('Вы вышли из системы', 'success');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="topbar-logo-mark">ПУЦ</div>
        <span className="topbar-logo-text">МикроОбучение</span>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          <div className="topbar-user-info">
            <div className="topbar-user-name">{user?.name?.split(' ').slice(0, 2).join(' ')}</div>
            <div className="topbar-user-role">{roleLabel}</div>
          </div>
          <div className="topbar-avatar">{initials}</div>
          <button className="topbar-logout" onClick={handleLogout} title="Выйти">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
