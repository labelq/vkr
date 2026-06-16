import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

const ADMIN_PATHS = ['/admin/analytics', '/admin/users', '/admin/courses', '/admin/tickets', '/admin/faq'];

function isAdminPath(pathname) {
  return ADMIN_PATHS.some(p => pathname.startsWith(p));
}

export default function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdminPath(location.pathname) && user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
