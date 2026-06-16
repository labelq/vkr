import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.courses.list()
      .then(d => { if (!cancelled) setCourses(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalLessons = courses.reduce((s, c) => s + c.lesson_count, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.completed_count, 0);
  const overallPct = totalLessons > 0 ? Math.round(totalCompleted / totalLessons * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Добро пожаловать, {user?.name?.split(' ')[1] || user?.name}!</h1>
          <p className="page-subtitle">Система микрообучения для сотрудников МФЦ</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Общий прогресс</div>
          <div className="stat-value" style={{ color: '#2563eb' }}>{overallPct}%</div>
          <ProgressBar value={totalCompleted} max={totalLessons} color="#2563eb" />
        </div>
        <div className="stat-card">
          <div className="stat-label">Завершено уроков</div>
          <div className="stat-value" style={{ color: '#059669' }}>{totalCompleted}</div>
          <div className="stat-sub">из {totalLessons}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Активных курсов</div>
          <div className="stat-value" style={{ color: '#7c3aed' }}>{courses.length}</div>
          <div className="stat-sub">доступно сейчас</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Ваши курсы</h2>
          <Link to="/courses" className="btn btn-outline btn-sm">Все курсы</Link>
        </div>
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => {
              const pct = course.lesson_count > 0 ? Math.round(course.completed_count / course.lesson_count * 100) : 0;
              return (
                <Link key={course.id} to={`/courses/${course.id}`} className="course-card" style={{ '--course-color': course.color }}>
                  <div className="course-card-header">
                    <div className="course-badge" style={{ background: course.color }}>
                      {course.category_label}
                    </div>
                    <div className="course-progress-text">{pct}%</div>
                  </div>
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-desc">{course.description}</p>
                  <div className="course-footer">
                    <ProgressBar value={course.completed_count} max={course.lesson_count} color={course.color} />
                    <div className="course-lessons-count">{course.lesson_count} уроков</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
