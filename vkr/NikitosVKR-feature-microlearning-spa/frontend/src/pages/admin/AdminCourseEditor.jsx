import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useToast } from '../../components/Toast.jsx';

export default function AdminCourseEditor() {
  const { id } = useParams();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [expandedLesson, setExpandedLesson] = useState(null);
  const [testsCache, setTestsCache] = useState({});

  const [modal, setModal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.courses.get(id).then(d => {
      if (cancelled) return;
      setCourse(d);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const refreshCourse = () => {
    api.courses.get(id).then(setCourse).catch(() => {});
  };

  const toggleLesson = async (lessonId) => {
    if (expandedLesson === lessonId) {
      setExpandedLesson(null);
      return;
    }
    setExpandedLesson(lessonId);
    if (!testsCache[lessonId]) {
      try {
        const test = await api.adminContent.getTest(lessonId);
        setTestsCache(c => ({ ...c, [lessonId]: test }));
      } catch { toast('Ошибка загрузки теста', 'error'); }
    }
  };

  const reloadTest = async (lessonId) => {
    try {
      const test = await api.adminContent.getTest(lessonId);
      setTestsCache(c => ({ ...c, [lessonId]: test }));
    } catch { toast('Ошибка загрузки теста', 'error'); }
  };

  if (loading) return <div className="page"><div className="loading">Загрузка...</div></div>;
  if (!course) return <div className="page"><div>Курс не найден</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/admin/courses" className="breadcrumb-link">← Управление курсами</Link>
          <h1 className="page-title">{course.title}</h1>
          <p className="page-subtitle">Редактирование модулей и уроков</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'addModule' })}>
          + Добавить модуль
        </button>
      </div>

      <div className="modules-list">
        {(course.modules || []).map(mod => (
          <div key={mod.id} className="module-card">
            <div className="module-card-header">
              <h3 className="module-title">{mod.title}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-outline" onClick={() => setModal({ type: 'editModule', module: mod })}>
                  ✎
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteModule(mod.id)}>✕</button>
              </div>
            </div>
            <div className="lessons-list">
              {(mod.lessons || []).map(lesson => (
                <div key={lesson.id} className="lesson-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="lesson-item-title">{lesson.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setModal({ type: 'editLesson', lesson, moduleId: mod.id })}>
                        ✎
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={() => toggleLesson(lesson.id)}>
                        {expandedLesson === lesson.id ? '▲' : '▼'} Тест
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLesson(lesson.id)}>✕</button>
                    </div>
                  </div>
                  {expandedLesson === lesson.id && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-3)', borderRadius: '8px' }}>
                      <TestSection
                        lessonId={lesson.id}
                        test={testsCache[lesson.id]}
                        onReload={() => reloadTest(lesson.id)}
                        setModal={setModal}
                        toast={toast}
                      />
                    </div>
                  )}
                </div>
              ))}
              <button className="btn btn-sm btn-outline" style={{ marginTop: '8px', width: '100%' }}
                onClick={() => setModal({ type: 'addLesson', moduleId: mod.id })}>
                + Добавить урок
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal?.type === 'addModule' && (
        <ModuleFormModal
          title="Добавить модуль"
          onSave={async (data) => {
            await api.adminContent.createModule({ ...data, course_id: parseInt(id) });
            refreshCourse();
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'editModule' && (
        <ModuleFormModal
          title="Редактировать модуль"
          initial={modal.module}
          onSave={async (data) => {
            await api.adminContent.updateModule(modal.module.id, data);
            refreshCourse();
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'addLesson' && (
        <LessonFormModal
          title="Добавить урок"
          onSave={async (data) => {
            await api.adminContent.createLesson({ ...data, module_id: modal.moduleId });
            refreshCourse();
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'editLesson' && (
        <LessonFormModal
          title="Редактировать урок"
          initial={modal.lesson}
          onSave={async (data) => {
            await api.adminContent.updateLesson(modal.lesson.id, data);
            refreshCourse();
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'addTest' && (
        <TestFormModal
          title="Добавить тест"
          onSave={async (data) => {
            await api.adminContent.createTest({ ...data, lesson_id: modal.lessonId });
            reloadTest(modal.lessonId);
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'editTest' && (
        <TestFormModal
          title="Редактировать тест"
          initial={modal.test}
          onSave={async (data) => {
            await api.adminContent.updateTest(modal.test.id, data);
            reloadTest(modal.lessonId);
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'addQuestion' && (
        <QuestionFormModal
          title="Добавить вопрос"
          onSave={async (data) => {
            await api.adminContent.createQuestion({ ...data, test_id: modal.testId });
            reloadTest(modal.lessonId);
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'editQuestion' && (
        <QuestionFormModal
          title="Редактировать вопрос"
          initial={modal.question}
          onSave={async (data) => {
            await api.adminContent.updateQuestion(modal.question.id, data);
            reloadTest(modal.lessonId);
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'addAnswer' && (
        <AnswerFormModal
          title="Добавить ответ"
          onSave={async (data) => {
            await api.adminContent.createAnswer({ ...data, question_id: modal.questionId });
            reloadTest(modal.lessonId);
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
      {modal?.type === 'editAnswer' && (
        <AnswerFormModal
          title="Редактировать ответ"
          initial={modal.answer}
          onSave={async (data) => {
            await api.adminContent.updateAnswer(modal.answer.id, data);
            reloadTest(modal.lessonId);
          }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
    </div>
  );

  async function handleDeleteModule(id) {
    if (!confirm('Удалить модуль со всеми уроками и тестами?')) return;
    try {
      await api.adminContent.deleteModule(id);
      toast('Модуль удалён', 'success');
      refreshCourse();
    } catch (err) {
      toast(err?.detail || 'Ошибка удаления', 'error');
    }
  }

  async function handleDeleteLesson(id) {
    if (!confirm('Удалить урок?')) return;
    try {
      await api.adminContent.deleteLesson(id);
      toast('Урок удалён', 'success');
      refreshCourse();
    } catch (err) {
      toast(err?.detail || 'Ошибка удаления', 'error');
    }
  }
}

function TestSection({ lessonId, test, onReload, setModal, toast }) {
  if (!test) {
    return (
      <div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Тест не создан</p>
        <button className="btn btn-sm btn-primary" onClick={() => setModal({ type: 'addTest', lessonId })}>
          + Создать тест
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <strong>{test.title}</strong>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-outline" onClick={() => setModal({ type: 'editTest', test, lessonId })}>✎</button>
          <button className="btn btn-sm btn-danger" onClick={async () => {
            if (!confirm('Удалить тест со всеми вопросами?')) return;
            await api.adminContent.deleteTest(test.id);
            toast('Тест удалён', 'success');
            onReload();
          }}>✕</button>
          <button className="btn btn-sm btn-primary" onClick={() => setModal({ type: 'addQuestion', testId: test.id, lessonId })}>
            + Вопрос
          </button>
        </div>
      </div>
      {test.questions.map(q => (
        <div key={q.id} style={{ marginBottom: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--b)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ fontWeight: 500, flex: 1 }}>
              {q.text}
              <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                ({q.question_type === 'single' ? 'один' : 'несколько'})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button className="btn btn-sm btn-outline" onClick={() => setModal({ type: 'editQuestion', question: q, lessonId })}>✎</button>
              <button className="btn btn-sm btn-danger" onClick={async () => {
                if (!confirm('Удалить вопрос?')) return;
                await api.adminContent.deleteQuestion(q.id);
                onReload();
              }}>✕</button>
              <button className="btn btn-sm btn-outline" onClick={() => setModal({ type: 'addAnswer', questionId: q.id, lessonId })}>
                + Ответ
              </button>
            </div>
          </div>
          {q.answers.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', marginBottom: '4px', background: a.is_correct ? 'var(--surface-2)' : 'var(--bg-3)', borderRadius: '4px', fontSize: '13px' }}>
              <span>
                {a.is_correct ? '✓ ' : ''}{a.text}
                {a.is_correct && <span style={{ color: '#22c55e', marginLeft: '6px', fontSize: '11px' }}>верный</span>}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-sm btn-outline" onClick={() => setModal({ type: 'editAnswer', answer: a, lessonId })}>✎</button>
                <button className="btn btn-sm btn-danger" onClick={async () => {
                  await api.adminContent.deleteAnswer(a.id);
                  onReload();
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ModalOverlay({ title, children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
    }} onClick={onClose}>
      <div className="card" style={{ width: '560px', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 700 }}>{title}</h3>
          <button className="btn btn-sm btn-outline" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-group" style={{ marginBottom: '12px' }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function ModuleFormModal({ title, initial, onSave, onClose, toast }) {
  const [form, setForm] = useState({ title: initial?.title || '', sort_order: initial?.sort_order ?? '' });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = { title: form.title };
      if (form.sort_order !== '') data.sort_order = parseInt(form.sort_order);
      await onSave(data);
      toast('Сохранено', 'success');
      onClose();
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Название модуля">
          <input className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="Порядок сортировки">
          <input className="form-input" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button>
      </form>
    </ModalOverlay>
  );
}

function LessonFormModal({ title, initial, onSave, onClose, toast }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    content: initial?.content || '',
    video_url: initial?.video_url || '',
    sort_order: initial?.sort_order ?? '',
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = { title: form.title, content: form.content || null, video_url: form.video_url || null };
      if (form.sort_order !== '') data.sort_order = parseInt(form.sort_order);
      await onSave(data);
      toast('Сохранено', 'success');
      onClose();
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Название урока">
          <input className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="Содержание (Markdown)">
          <textarea className="form-input" rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        </Field>
        <Field label="URL видео">
          <input className="form-input" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://www.youtube.com/embed/..." />
        </Field>
        <Field label="Порядок сортировки">
          <input className="form-input" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button>
      </form>
    </ModalOverlay>
  );
}

function TestFormModal({ title, initial, onSave, onClose, toast }) {
  const [form, setForm] = useState({ title: initial?.title || '' });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({ title: form.title });
      toast('Сохранено', 'success');
      onClose();
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Название теста">
          <input className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button>
      </form>
    </ModalOverlay>
  );
}

function QuestionFormModal({ title, initial, onSave, onClose, toast }) {
  const [form, setForm] = useState({
    text: initial?.text || '',
    question_type: initial?.question_type || 'single',
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({ text: form.text, question_type: form.question_type });
      toast('Сохранено', 'success');
      onClose();
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Текст вопроса">
          <textarea className="form-input" rows={3} required value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
        </Field>
        <Field label="Тип вопроса">
          <select className="form-input" value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value }))}>
            <option value="single">Один правильный</option>
            <option value="multiple">Несколько правильных</option>
          </select>
        </Field>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button>
      </form>
    </ModalOverlay>
  );
}

function AnswerFormModal({ title, initial, onSave, onClose, toast }) {
  const [form, setForm] = useState({
    text: initial?.text || '',
    is_correct: initial?.is_correct || false,
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({ text: form.text, is_correct: form.is_correct });
      toast('Сохранено', 'success');
      onClose();
    } catch (err) {
      toast(err?.detail || 'Ошибка', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Текст ответа">
          <input className="form-input" required value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
        </Field>
        <Field label="Правильный ответ">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_correct} onChange={e => setForm(f => ({ ...f, is_correct: e.target.checked }))} />
            Да
          </label>
        </Field>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button>
      </form>
    </ModalOverlay>
  );
}
