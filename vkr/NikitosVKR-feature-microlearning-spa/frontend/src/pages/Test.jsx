import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';

const PASS_SCORE = 75;

export default function Test() {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.lessons.test(lessonId).then(t => {
      if (cancelled) return;
      setTest(t);
      setAnswers(Object.fromEntries(t.questions.map(q => [q.id, []])));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lessonId]);

  const toggleAnswer = (questionId, answerId, type) => {
    setAnswers(prev => {
      if (type === 'single') {
        return { ...prev, [questionId]: [answerId] };
      }
      const cur = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: cur.includes(answerId)
          ? cur.filter(a => a !== answerId)
          : [...cur, answerId],
      };
    });
  };

  const handleSubmit = async () => {
    // Validate all answered
    for (const q of test.questions) {
      if (!answers[q.id] || answers[q.id].length === 0) {
        toast('Ответьте на все вопросы', 'warning');
        return;
      }
    }
    setSubmitting(true);
    try {
      const strAnswers = {};
      for (const [qid, aids] of Object.entries(answers)) {
        strAnswers[qid] = aids.map(String);
      }
      const res = await api.progress.checkAnswers(parseInt(lessonId), strAnswers);
      if (res.passed) {
        toast(`Тест пройден! Результат: ${res.score}%`, 'success');
      } else {
        toast(`Не пройден. Результат: ${res.score}%. Минимум: ${PASS_SCORE}%`, 'error');
      }
      setResult(res);
    } catch (err) {
      toast(err?.detail || 'Ошибка отправки', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><div className="loading">Загрузка...</div></div>;
  if (!test) return <div className="page"><div>Тест не найден</div></div>;

  if (result) {
    return (
      <div className="page">
        <div className="test-result card">
          <div className={`test-result-icon${result.passed ? ' pass' : ' fail'}`}>
            {result.passed ? '✓' : '✗'}
          </div>
          <h2 className="test-result-title">
            {result.passed ? 'Тест пройден!' : 'Тест не пройден'}
          </h2>
          <div className="test-result-score">{result.score}%</div>
          <div className="test-result-sub">
            Правильных ответов: {result.correct} из {result.total}
          </div>
          {!result.passed && (
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
              Минимальный балл: {PASS_SCORE}%. Перечитайте урок и попробуйте снова.
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => navigate(-1)}>← К уроку</button>
            {!result.passed && (
              <button className="btn btn-primary" onClick={() => { setResult(null); setAnswers(Object.fromEntries(test.questions.map(q => [q.id, []]))); }}>
                Попробовать снова
              </button>
            )}
            {result.passed && (
              <button className="btn btn-primary" onClick={() => navigate(-2)}>
                К курсу →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="breadcrumb-link">← К уроку</button>
          <h1 className="page-title">{test.title}</h1>
          <p className="page-subtitle">{test.questions.length} вопросов · минимальный балл {PASS_SCORE}%</p>
        </div>
      </div>

      <div className="questions-list">
        {test.questions.map((q, qi) => (
          <div key={q.id} className="question-card card">
            <div className="question-num">Вопрос {qi + 1}</div>
            <div className="question-text">{q.text}</div>
            <div className="answers-list">
              {q.answers.map(a => {
                const selected = (answers[q.id] || []).includes(a.id);
                const InputTag = q.question_type === 'multiple' ? 'input' : 'input';
                const inputType = q.question_type === 'multiple' ? 'checkbox' : 'radio';
                return (
                  <label key={a.id} className={`answer-option${selected ? ' selected' : ''}`}>
                    <input
                      type={inputType}
                      name={`q-${q.id}`}
                      checked={selected}
                      onChange={() => toggleAnswer(q.id, a.id, q.question_type)}
                    />
                    <span>{a.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Отправка...' : 'Отправить ответы'}
        </button>
      </div>
    </div>
  );
}
