import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.courses.list().then(d => { if (!cancelled) setCourses(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalLessons = courses.reduce((s, c) => s + c.lesson_count, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.completed_count, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Профиль</h1>
      </div>

      <div className="profile-grid">
        <div className="card profile-card">
          <div className="profile-avatar">{user?.name?.charAt(0)}</div>
          <h2 className="profile-name">{user?.name}</h2>
          <div className="profile-email">{user?.email}</div>
          {user?.department && <div className="profile-dept">{user?.department}</div>}
          <StatusBadge status={user?.role} />

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{totalCompleted}</div>
              <div className="profile-stat-label">Уроков</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{courses.filter(c => c.completed_count === c.lesson_count && c.lesson_count > 0).length}</div>
              <div className="profile-stat-label">Курсов</div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Прогресс по курсам</h3>
          {loading ? <div className="loading">Загрузка...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {courses.map(course => (
                <div key={course.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{course.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{course.category_label}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: course.color }}>
                      {course.lesson_count > 0 ? Math.round(course.completed_count / course.lesson_count * 100) : 0}%
                    </div>
                  </div>
                  <ProgressBar value={course.completed_count} max={course.lesson_count} color={course.color} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
