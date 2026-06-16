const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const path = require('path');
const pool = require('./db');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session
app.use(session({
  store: new pgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'puc-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }
}));

// Static files from project root
app.use(express.static(path.join(__dirname, '..')));

// ============================================================
// AUTH
// ============================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    req.session.userId = user.id;
    req.session.userRole = user.role;
    const { password_hash, ...safe } = user;
    res.json({ user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Все поля обязательны' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(400).json({ error: 'Email уже зарегистрирован' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, department) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, email, hash, 'user', 'МФЦ']
    );
    const user = rows[0];
    req.session.userId = user.id;
    req.session.userRole = user.role;
    const { password_hash, ...safe } = user;
    res.status(201).json({ user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id,name,email,role,department,created_at FROM users WHERE id=$1', [req.session.userId]);
    if (!rows[0]) return res.status(401).json({ error: 'Сессия устарела' });
    res.json({ user: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ============================================================
// COURSES
// ============================================================

app.get('/api/courses', async (req, res) => {
  try {
    const { rows: courses } = await pool.query('SELECT id, title, category, category_label AS "categoryLabel", color, description, is_custom AS "isCustom", created_at FROM courses ORDER BY id');

    // Load modules and lessons (no content)
    const { rows: modules } = await pool.query('SELECT id, course_id AS "courseId", course_id, title, sort_order FROM modules ORDER BY sort_order');
    const { rows: lessons } = await pool.query('SELECT id, module_id AS "moduleId", module_id, title, video_url, sort_order FROM lessons ORDER BY sort_order');
    const { rows: tests } = await pool.query('SELECT id, lesson_id FROM tests');

    // Build progress map if user is authenticated
    let progressMap = {};
    if (req.session && req.session.userId) {
      const { rows: progress } = await pool.query(
        'SELECT lesson_id, score, completed_at FROM progress WHERE user_id=$1',
        [req.session.userId]
      );
      progress.forEach(p => {
        progressMap[p.lesson_id] = { score: p.score, completedAt: p.completed_at };
      });
    }

    const testMap = {};
    tests.forEach(t => { testMap[t.lesson_id] = t.id; });

    const moduleMap = {};
    modules.forEach(m => {
      if (!moduleMap[m.course_id]) moduleMap[m.course_id] = [];
      moduleMap[m.course_id].push(m);
    });

    const lessonMap = {};
    lessons.forEach(l => {
      if (!lessonMap[l.module_id]) lessonMap[l.module_id] = [];
      lessonMap[l.module_id].push({
        ...l,
        testId: testMap[l.id] || null,
        progress: progressMap[l.id] || null
      });
    });

    const result = courses.map(c => ({
      ...c,
      modules: (moduleMap[c.id] || []).map(m => ({
        ...m,
        lessons: (lessonMap[m.id] || [])
      }))
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/courses/:id', requireAuth, async (req, res) => {
  try {
    const { rows: courses } = await pool.query('SELECT id, title, category, category_label AS "categoryLabel", color, description, is_custom AS "isCustom", created_at FROM courses WHERE id=$1', [req.params.id]);
    if (!courses[0]) return res.status(404).json({ error: 'Курс не найден' });
    const course = courses[0];

    const { rows: modules } = await pool.query('SELECT id, course_id AS "courseId", course_id, title, sort_order FROM modules WHERE course_id=$1 ORDER BY sort_order', [course.id]);
    const moduleIds = modules.map(m => m.id);

    let lessons = [];
    if (moduleIds.length) {
      const { rows } = await pool.query(
        'SELECT id, module_id AS "moduleId", module_id, title, video_url, sort_order FROM lessons WHERE module_id = ANY($1) ORDER BY sort_order',
        [moduleIds]
      );
      lessons = rows;
    }

    const lessonIds = lessons.map(l => l.id);
    let testMap = {};
    if (lessonIds.length) {
      const { rows: tests } = await pool.query('SELECT id, lesson_id FROM tests WHERE lesson_id = ANY($1)', [lessonIds]);
      tests.forEach(t => { testMap[t.lesson_id] = t.id; });
    }

    let progressMap = {};
    if (lessonIds.length) {
      const { rows: progress } = await pool.query(
        'SELECT lesson_id, score, completed_at FROM progress WHERE user_id=$1 AND lesson_id = ANY($2)',
        [req.session.userId, lessonIds]
      );
      progress.forEach(p => { progressMap[p.lesson_id] = { score: p.score, completedAt: p.completed_at }; });
    }

    const lessonMap = {};
    lessons.forEach(l => {
      if (!lessonMap[l.module_id]) lessonMap[l.module_id] = [];
      lessonMap[l.module_id].push({ ...l, testId: testMap[l.id] || null, progress: progressMap[l.id] || null });
    });

    course.modules = modules.map(m => ({ ...m, lessons: lessonMap[m.id] || [] }));
    res.json(course);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/courses', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { title, category, categoryLabel, color, description, moduleTitle } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'Название и категория обязательны' });

    const catLabels = { os: 'Операционные системы', skzi: 'СКЗИ', office: 'Офисное ПО', other: 'Прочее' };
    const { rows } = await pool.query(
      'INSERT INTO courses (title, category, category_label, color, description, is_custom) VALUES ($1,$2,$3,$4,$5,true) RETURNING *',
      [title, category, categoryLabel || catLabels[category] || 'Прочее', color || '#2563eb', description || '']
    );
    const course = rows[0];

    if (moduleTitle) {
      await pool.query('INSERT INTO modules (course_id, title, sort_order) VALUES ($1,$2,1)', [course.id, moduleTitle]);
    }

    res.status(201).json(course);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/courses/:id', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Курс не найден' });
    if (!rows[0].is_custom) return res.status(403).json({ error: 'Нельзя удалить системный курс' });
    await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================================
// LESSONS
// ============================================================

app.get('/api/lessons/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM lessons WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Урок не найден' });
    const lesson = rows[0];

    const { rows: tests } = await pool.query('SELECT id FROM tests WHERE lesson_id=$1', [lesson.id]);
    lesson.testId = tests[0]?.id || null;

    const { rows: progress } = await pool.query(
      'SELECT score, completed_at FROM progress WHERE user_id=$1 AND lesson_id=$2',
      [req.session.userId, lesson.id]
    );
    lesson.progress = progress[0] ? { score: progress[0].score, completedAt: progress[0].completed_at } : null;

    res.json(lesson);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/lessons/:id/test', requireAuth, async (req, res) => {
  try {
    const { rows: tests } = await pool.query('SELECT * FROM tests WHERE lesson_id=$1', [req.params.id]);
    if (!tests[0]) return res.status(404).json({ error: 'Тест не найден' });
    const test = tests[0];

    const { rows: questions } = await pool.query('SELECT * FROM questions WHERE test_id=$1 ORDER BY id', [test.id]);
    const qIds = questions.map(q => q.id);

    let answers = [];
    if (qIds.length) {
      const { rows } = await pool.query('SELECT * FROM answers WHERE question_id = ANY($1) ORDER BY id', [qIds]);
      answers = rows;
    }

    const answerMap = {};
    answers.forEach(a => {
      if (!answerMap[a.question_id]) answerMap[a.question_id] = [];
      answerMap[a.question_id].push(a);
    });

    test.questions = questions.map(q => ({
      ...q,
      answers: (answerMap[q.id] || []).map(a => ({
        id: a.id,
        text: a.text,
        correct: a.is_correct
      }))
    }));

    res.json(test);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================================
// PROGRESS
// ============================================================

app.get('/api/progress', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT lesson_id, score, completed_at FROM progress WHERE user_id=$1',
      [req.session.userId]
    );
    const map = {};
    rows.forEach(r => { map[r.lesson_id] = { score: r.score, completedAt: r.completed_at }; });
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/progress', requireAuth, async (req, res) => {
  try {
    const { lessonId, score } = req.body;
    if (!lessonId || score === undefined) return res.status(400).json({ error: 'lessonId и score обязательны' });

    const { rows } = await pool.query(
      `INSERT INTO progress (user_id, lesson_id, score)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET score=$3, completed_at=NOW()
       RETURNING *`,
      [req.session.userId, lessonId, score]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================================
// TICKETS
// ============================================================

app.get('/api/tickets', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tickets WHERE user_id=$1 ORDER BY created_at DESC',
      [req.session.userId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/tickets', requireAuth, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Тема и сообщение обязательны' });
    const { rows } = await pool.query(
      'INSERT INTO tickets (user_id, title, message) VALUES ($1,$2,$3) RETURNING *',
      [req.session.userId, title, message]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/tickets', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM tickets t JOIN users u ON t.user_id=u.id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.patch('/api/tickets/:id', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { status, response } = req.body;
    const { rows } = await pool.query(
      'UPDATE tickets SET status=COALESCE($1,status), response=COALESCE($2,response) WHERE id=$3 RETURNING *',
      [status, response, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Тикет не найден' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================================
// FAQ
// ============================================================

app.get('/api/faq', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM faq ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/faq', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { category, title, content } = req.body;
    if (!category || !title || !content) return res.status(400).json({ error: 'Все поля обязательны' });
    const { rows } = await pool.query(
      'INSERT INTO faq (category, title, content) VALUES ($1,$2,$3) RETURNING *',
      [category, title, content]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/faq/:id', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM faq WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================================
// USERS
// ============================================================

app.get('/api/users', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { rows: users } = await pool.query(
      'SELECT id, name, email, role, department, created_at FROM users ORDER BY id'
    );

    // Append lesson count + avg score per user
    const { rows: progRows } = await pool.query(
      'SELECT user_id, COUNT(*) as lesson_count, AVG(score) as avg_score FROM progress GROUP BY user_id'
    );
    const progMap = {};
    progRows.forEach(p => { progMap[p.user_id] = { lessonCount: parseInt(p.lesson_count), avgScore: Math.round(p.avg_score || 0) }; });

    const result = users.map(u => ({ ...u, ...(progMap[u.id] || { lessonCount: 0, avgScore: 0 }) }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.patch('/api/users/:id/role', ...requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) return res.status(400).json({ error: 'Недопустимая роль' });
    const { rows } = await pool.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id,name,email,role,department',
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================================
// ANALYTICS
// ============================================================

app.get('/api/analytics', ...requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const [usersR, progressR, ticketsR, coursesR] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count, AVG(score) as avg_score FROM progress'),
      pool.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='open') as open,
        COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status='closed') as closed
        FROM tickets`),
      pool.query(`
        SELECT c.id, c.title, c.color,
          COUNT(DISTINCT l.id) as lesson_count,
          COUNT(p.id) as completions
        FROM courses c
        LEFT JOIN modules m ON m.course_id=c.id
        LEFT JOIN lessons l ON l.module_id=m.id
        LEFT JOIN progress p ON p.lesson_id=l.id
        GROUP BY c.id ORDER BY c.id
      `)
    ]);

    res.json({
      users: parseInt(usersR.rows[0].count),
      completedLessons: parseInt(progressR.rows[0].count),
      avgScore: Math.round(parseFloat(progressR.rows[0].avg_score) || 0),
      tickets: parseInt(ticketsR.rows[0].total),
      openTickets: parseInt(ticketsR.rows[0].open),
      inProgressTickets: parseInt(ticketsR.rows[0].in_progress),
      closedTickets: parseInt(ticketsR.rows[0].closed),
      courseStats: coursesR.rows.map(r => ({
        id: r.id,
        title: r.title,
        color: r.color,
        lessonCount: parseInt(r.lesson_count),
        completions: parseInt(r.completions)
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================================
// SPA fallback — serve index.html for all non-API routes
// ============================================================
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start
app.listen(PORT, () => {
  console.log(`PUC Learning server running at http://localhost:${PORT}`);
});
