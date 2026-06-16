import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Simple markdown-like renderer
function renderContent(text) {
  if (!text) return '';
  return escapeHtml(text)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]+?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map(c => `<td>${c}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>');
}

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.lessons.get(id)
      .then(d => {
        if (cancelled) return;
        if (d.locked) {
          toast('Этот урок заблокирован. Пройдите предыдущий тест.', 'warning');
          navigate(-1);
          return;
        }
        setLesson(d);
      })
      .catch(() => { if (!cancelled) navigate('/courses'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="page"><div className="loading">Загрузка...</div></div>;
  if (!lesson) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="breadcrumb-link">← Назад к курсу</button>
          <h1 className="page-title">{lesson.title}</h1>
        </div>
      </div>

      {lesson.video_url && (
        <div className="lesson-video card" style={{ marginBottom: '16px' }}>
          <video
            controls
            style={{ width: '100%', borderRadius: '8px', maxHeight: '480px' }}
            src={lesson.video_url}
          >
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
        </div>
      )}

      <div className="lesson-content card">
        <div
          className="lesson-text"
          dangerouslySetInnerHTML={{ __html: renderContent(lesson.content) }}
        />
      </div>

      {lesson.has_test && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link to={`/lessons/${id}/test`} className="btn btn-primary">
            Перейти к тесту →
          </Link>
        </div>
      )}
    </div>
  );
}
