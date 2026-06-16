const BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let err;
    try { err = await res.json(); } catch { err = { detail: 'Ошибка сервера' }; }
    throw err;
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    register: (name, email, password) => request('POST', '/auth/register', { name, email, password }),
    me: () => request('GET', '/auth/me'),
    logout: () => request('POST', '/auth/logout'),
  },
  courses: {
    list: () => request('GET', '/courses'),
    get: (id) => request('GET', `/courses/${id}`),
    create: (data) => request('POST', '/courses', data),
    delete: (id) => request('DELETE', `/courses/${id}`),
  },
  lessons: {
    get: (id) => request('GET', `/lessons/${id}`),
    test: (id) => request('GET', `/lessons/${id}/test`),
  },
  progress: {
    get: () => request('GET', '/progress'),
    save: (lesson_id, score) => request('POST', '/progress', { lesson_id, score }),
    checkAnswers: (lesson_id, answers) => request('POST', '/progress/check-answers', { lesson_id, answers }),
  },
  tickets: {
    list: () => request('GET', '/tickets'),
    create: (data) => request('POST', '/tickets', data),
    adminList: () => request('GET', '/admin/tickets'),
    update: (id, data) => request('PATCH', `/tickets/${id}`, data),
  },
  faq: {
    list: () => request('GET', '/faq'),
    create: (data) => request('POST', '/faq', data),
    delete: (id) => request('DELETE', `/faq/${id}`),
  },
  users: {
    list: () => request('GET', '/users'),
    updateRole: (id, role) => request('PATCH', `/users/${id}/role`, { role }),
  },
  analytics: {
    get: () => request('GET', '/analytics'),
  },
  adminContent: {
    listModules: (courseId) => request('GET', `/admin/courses/${courseId}/modules`),
    createModule: (data) => request('POST', '/admin/modules', data),
    updateModule: (id, data) => request('PUT', `/admin/modules/${id}`, data),
    deleteModule: (id) => request('DELETE', `/admin/modules/${id}`),
    createLesson: (data) => request('POST', '/admin/lessons', data),
    updateLesson: (id, data) => request('PUT', `/admin/lessons/${id}`, data),
    deleteLesson: (id) => request('DELETE', `/admin/lessons/${id}`),
    getTest: (lessonId) => request('GET', `/admin/lessons/${lessonId}/test`),
    createTest: (data) => request('POST', '/admin/tests', data),
    updateTest: (id, data) => request('PUT', `/admin/tests/${id}`, data),
    deleteTest: (id) => request('DELETE', `/admin/tests/${id}`),
    createQuestion: (data) => request('POST', '/admin/questions', data),
    updateQuestion: (id, data) => request('PUT', `/admin/questions/${id}`, data),
    deleteQuestion: (id) => request('DELETE', `/admin/questions/${id}`),
    createAnswer: (data) => request('POST', '/admin/answers', data),
    updateAnswer: (id, data) => request('PUT', `/admin/answers/${id}`, data),
    deleteAnswer: (id) => request('DELETE', `/admin/answers/${id}`),
  },
};
