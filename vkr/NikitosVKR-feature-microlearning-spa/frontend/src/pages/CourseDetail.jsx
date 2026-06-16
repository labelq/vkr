import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import ProgressBar from '../components/ProgressBar.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.courses.get(id).then(d => { if (!cancelled) setCourse(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="page"><div className="loading">Загрузка...</div></div>;
  if (!course) return <div className="page"><div>Курс не найден</div></div>;

  const progress = course.progress || {};
  // Flat list of all lessons in order
  const allLessons = (course.modules || []).flatMap(m => m.lessons || []);

  const isLessonUnlocked = (lesson, idx) => {
    if (idx === 0) return true;
    const prev = allLessons[idx - 1];
    const prevProg = progress[String(prev.id)];
    return prevProg && prevProg.passed;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/courses" className="breadcrumb-link">← Курсы</Link>
          <h1 className="page-title">{course.title}</h1>
          <p className="page-subtitle">{course.description}</p>
        </div>
        <div className="course-progress-summary">
          <ProgressBar value={course.completed_count} max={course.lesson_count} color={course.color} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {course.completed_count} из {course.lesson_count} уроков
          </span>
        </div>
      </div>

      <div className="modules-list">
        {(course.modules || []).map(module => (
          <div key={module.id} className="module-card">
            <h3 className="module-title">{module.title}</h3>
            <div className="lessons-list">
              {(module.lessons || []).map(lesson => {
                const globalIdx = allLessons.findIndex(l => l.id === lesson.id);
                const unlocked = isLessonUnlocked(lesson, globalIdx);
                const done = !!progress[String(lesson.id)]?.passed;
                const score = progress[String(lesson.id)]?.score;

                return (
                  <div key={lesson.id} className={`lesson-item${done ? ' done' : ''}${!unlocked ? ' locked' : ''}`}>
                    <div className="lesson-item-left">
                      <div className={`lesson-status-dot${done ? ' done' : unlocked ? ' active' : ' locked'}`} />
                      <div>
                        <div className="lesson-item-title">{lesson.title}</div>
                        {done && score !== undefined && (
                          <div className="lesson-score">Результат: {score}%</div>
                        )}
                      </div>
                    </div>
                    {unlocked ? (
                      <Link to={`/lessons/${lesson.id}`} className="btn btn-sm" style={{ background: course.color, color: '#fff' }}>
                        {done ? 'Повторить' : 'Начать'}
                      </Link>
                    ) : (
                      <span className="lesson-locked-msg">Заблокировано</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
