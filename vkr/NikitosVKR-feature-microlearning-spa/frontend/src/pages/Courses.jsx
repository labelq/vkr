import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    api.courses.list().then(d => { if (!cancelled) setCourses(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const categories = ['all', ...new Set(courses.map(c => c.category))];
  const filtered = filter === 'all' ? courses : courses.filter(c => c.category === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Курсы</h1>
          <p className="page-subtitle">Обучение работе с российским ПО</p>
        </div>
      </div>

      <div className="filter-bar">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn${filter === cat ? ' active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'Все' : cat === 'os' ? 'ОС' : cat === 'skzi' ? 'СКЗИ' : cat === 'office' ? 'Офис' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="courses-grid">
          {filtered.map(course => {
            const pct = course.lesson_count > 0 ? Math.round(course.completed_count / course.lesson_count * 100) : 0;
            return (
              <Link key={course.id} to={`/courses/${course.id}`} className="course-card" style={{ '--course-color': course.color }}>
                <div className="course-card-header">
                  <div className="course-badge" style={{ background: course.color }}>{course.category_label}</div>
                  <div className="course-progress-text" style={{ color: course.color }}>{pct}%</div>
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
  );
}
