// ========== API CLIENT ==========
const API = {
  async request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Ошибка запроса'), { status: res.status, data });
    return data;
  },

  auth: {
    login: (email, password) => API.request('POST', '/auth/login', { email, password }),
    register: (name, email, password) => API.request('POST', '/auth/register', { name, email, password }),
    me: () => API.request('GET', '/auth/me'),
    logout: () => API.request('POST', '/auth/logout')
  },

  courses: {
    list: () => API.request('GET', '/courses'),
    get: (id) => API.request('GET', `/courses/${id}`),
    create: (data) => API.request('POST', '/courses', data),
    delete: (id) => API.request('DELETE', `/courses/${id}`)
  },

  lessons: {
    get: (id) => API.request('GET', `/lessons/${id}`),
    getTest: (id) => API.request('GET', `/lessons/${id}/test`)
  },

  progress: {
    get: () => API.request('GET', '/progress'),
    markComplete: (lessonId, score) => API.request('POST', '/progress', { lessonId, score })
  },

  tickets: {
    list: () => API.request('GET', '/tickets'),
    create: (title, message) => API.request('POST', '/tickets', { title, message }),
    listAll: () => API.request('GET', '/admin/tickets'),
    update: (id, status, response) => API.request('PATCH', `/tickets/${id}`, { status, response })
  },

  faq: {
    list: () => API.request('GET', '/faq'),
    create: (category, title, content) => API.request('POST', '/faq', { category, title, content }),
    delete: (id) => API.request('DELETE', `/faq/${id}`)
  },

  users: {
    list: () => API.request('GET', '/users'),
    updateRole: (id, role) => API.request('PATCH', `/users/${id}/role`, { role })
  },

  analytics: {
    get: () => API.request('GET', '/analytics')
  }
};
