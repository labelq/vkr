# МикроОбучение ПУЦ

Система микрообучения сотрудников МФЦ работе с российским ПО.

## Стек

- **Backend:** Python FastAPI + PostgreSQL (asyncpg / SQLAlchemy async)
- **Frontend:** React 18 + Vite + React Router v6

## Установка и запуск

### Требования

- Python 3.9+
- Node.js 18+
- PostgreSQL 15+

### База данных

```bash
createdb puc_learning
psql puc_learning < backend/db/schema.sql
python3 backend/db/seed.py
```

### Бэкенд

```bash
pip3 install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --reload --port 8000
```

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Приложение доступно по адресу: http://localhost:5173

### Демо-доступ

| Роль | Email | Пароль |
|------|-------|--------|
| Сотрудник | user@mfc.ru | 123456 |
| Модератор | mod@puc.ru | 123456 |
| Администратор | admin@puc.ru | admin123 |

## Структура проекта

```
backend/          # FastAPI бэкенд
  main.py         # Точка входа
  models.py       # SQLAlchemy модели
  schemas.py      # Pydantic схемы
  dependencies.py # JWT аутентификация
  config.py       # Настройки (pydantic-settings)
  routers/        # API маршруты
  db/
    schema.sql    # DDL схема БД
    seed.py       # Заполнение тестовыми данными

frontend/         # React + Vite фронтенд
  src/
    api.js        # Все API вызовы
    App.jsx       # Маршрутизация
    context/      # AuthContext
    components/   # Sidebar, Layout, ProgressBar, ...
    pages/        # Dashboard, Courses, Lesson, Test, Support, Profile
    pages/admin/  # Аналитика, пользователи, курсы, тикеты, FAQ
    styles/       # main.css
```
