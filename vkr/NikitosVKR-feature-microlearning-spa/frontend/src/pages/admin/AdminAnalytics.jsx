import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.analytics.get().then(d => { if (!cancelled) setData(d); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="page"><div className="loading">Загрузка...</div></div>;
  if (!data) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Аналитика</h1>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '32px' }}>
        <StatCard label="Пользователей" value={data.total_users} color="#2563eb" />
        <StatCard label="Прохождений" value={data.total_completions} color="#059669" />
        <StatCard label="Открытых тикетов" value={data.open_tickets} color="#ef4444" />
        <StatCard label="Средний балл" value={`${data.avg_score}%`} color="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Прогресс по курсам</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const courses = data.completions_by_course || [];
              const maxCompletions = Math.max(...courses.map(c => c.completions), 1);
              return courses.map(c => (
                <div key={c.course_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                    <span style={{ fontWeight: 500 }}>{c.course_title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{c.completions} прохождений</span>
                  </div>
                  <ProgressBar value={c.completions} max={maxCompletions} color={c.color} />
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Последние прохождения</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data.recent_completions || []).map((r, i) => (
              <div key={r.user_name + r.lesson_title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{r.user_name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{r.lesson_title}</div>
                </div>
                <div style={{ fontWeight: 700, color: r.score >= 75 ? '#22c55e' : '#ef4444' }}>{r.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
