// ========== AUTH (API-based) ==========
const Auth = {
  _user: null,

  async init() {
    try {
      const data = await API.auth.me();
      this._user = data.user;
    } catch (e) {
      this._user = null;
    }
  },

  getUser() {
    return this._user;
  },

  async login(email, password) {
    try {
      const data = await API.auth.login(email, password);
      this._user = data.user;
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, error: e.message || 'Неверный email или пароль' };
    }
  },

  async register(name, email, password) {
    try {
      const data = await API.auth.register(name, email, password);
      this._user = data.user;
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, error: e.message || 'Ошибка регистрации' };
    }
  },

  async logout() {
    try { await API.auth.logout(); } catch (_) {}
    this._user = null;
  },

  require(roles = []) {
    const u = this.getUser();
    if (!u) { Router.go('/login'); return null; }
    if (roles.length && !roles.includes(u.role)) { Router.go('/dashboard'); return null; }
    return u;
  }
};

// ========== STORE (API-based) ==========
const Store = {
  _progress: null,   // { lessonId: { score, completedAt } }
  _courses: null,    // cached courses array

  async loadProgress() {
    try {
      this._progress = await API.progress.get();
    } catch (_) {
      this._progress = {};
    }
  },

  async loadCourses() {
    try {
      this._courses = await API.courses.list();
    } catch (_) {
      this._courses = [];
    }
  },

  getCourses() {
    return this._courses || [];
  },

  getProgress() {
    return this._progress || {};
  },

  async markComplete(lessonId, score) {
    const user = Auth.getUser();
    if (!user) return;
    try {
      await API.progress.markComplete(lessonId, score);
      if (!this._progress) this._progress = {};
      this._progress[lessonId] = { score, completedAt: new Date().toISOString() };
    } catch (e) {
      console.error('markComplete failed', e);
    }
  },

  isCompleted(lessonId) {
    const p = this.getProgress();
    return !!p[lessonId];
  },

  getScore(lessonId) {
    const p = this.getProgress();
    return p[lessonId]?.score ?? null;
  },

  getCourseProgress(courseId) {
    const courses = this.getCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;
    const allLessons = (course.modules || []).flatMap(m => m.lessons || []);
    if (!allLessons.length) return 0;
    const done = allLessons.filter(l => this.isCompleted(l.id)).length;
    return Math.round((done / allLessons.length) * 100);
  }
};
