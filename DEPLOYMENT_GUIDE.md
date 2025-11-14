# 🚀 Deployment Guide

Полная инструкция по деплою **boardgames-app** на Vercel + Render + Supabase.

---

## 📋 Архитектура

- **Vercel** → Next.js приложение (frontend + API routes)
- **Render** → Socket.io сервер (WebSocket для реального времени)
- **Supabase** → PostgreSQL база данных

---

## 1️⃣ Подготовка базы данных (Supabase)

### Шаг 1: Создать проект на Supabase

1. Зайди на [supabase.com](https://supabase.com) и создай новый проект
2. Скопируй **Database URL** из **Settings** → **Database** → **Connection string** → **URI**
   - Формат: `postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres`

### Шаг 2: Применить миграции

Локально выполни:

```bash
# Установи переменную окружения
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres"

# Примени схему
npx prisma db push

# Проверь (откроет Prisma Studio)
npx prisma studio
```

**Готово!** База данных создана с нужными таблицами.

---

## 2️⃣ Деплой Socket.io сервера на Render

Socket.io требует постоянного соединения (WebSocket), поэтому деплоим его отдельно на Render.

### Шаг 1: Создать Web Service

1. Зайди на [render.com](https://render.com) → **Dashboard**
2. Нажми **"New +"** → **"Web Service"**
3. Подключи репозиторий `KovalDenys1/boardgames-app` из GitHub
4. Настройки:
   - **Name:** `boardgames-socket` (или любое)
   - **Region:** `Frankfurt` (ближе к Европе)
   - **Branch:** `main`
   - **Root Directory:** (оставь пустым)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run socket:start`
   - **Plan:** Free (или Starter $7/мес для better performance)

### Шаг 2: Добавить переменные окружения

В разделе **Environment Variables** добавь:

```bash
NODE_ENV=production
HOSTNAME=0.0.0.0
CORS_ORIGIN=https://YOUR_VERCEL_APP.vercel.app
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-nextauth-secret-same-as-vercel
JWT_SECRET=your-jwt-secret-same-as-vercel
```

⚠️ **ВАЖНО:**
- **НЕ добавляй переменную `PORT`** — Render назначает её автоматически
- `CORS_ORIGIN` — URL твоего Vercel приложения (обновишь после деплоя Vercel)

### Шаг 3: Задеплоить

1. Нажми **"Create Web Service"**
2. Дождись деплоя (3-5 минут)
3. **Скопируй URL сервера** (например, `https://boardgames-socket.onrender.com`)

### Шаг 4: Проверить работоспособность

Открой в браузере:
```
https://boardgames-socket.onrender.com/health
```

Должен вернуться JSON: `{"ok":true}`

---

## 3️⃣ Деплой Next.js на Vercel

### Шаг 1: Подключить репозиторий

1. Зайди на [vercel.com](https://vercel.com) → **Dashboard**
2. Нажми **"Add New..."** → **"Project"**
3. Выбери репозиторий `KovalDenys1/boardgames-app`
4. Нажми **"Import"**

### Шаг 2: Настроить проект

Vercel автоопределит Next.js, но проверь:

- **Framework Preset:** Next.js
- **Root Directory:** `./`
- **Build Command:** `prisma generate && next build` (автоматически)
- **Output Directory:** `.next` (автоматически)
- **Install Command:** `npm install` (автоматически)

### Шаг 3: Добавить переменные окружения

В разделе **Environment Variables** добавь:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres

# Supabase (для клиента, если используешь)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Socket.io (URL Render сервера)
NEXT_PUBLIC_SOCKET_URL=https://boardgames-socket.onrender.com

# Email (опционально, для верификации/сброса пароля)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM="BoardGames <noreply@yourdomain.com>"
```

⚠️ **ВАЖНО:**
- `NEXTAUTH_URL` — впиши реальный URL после деплоя (Vercel покажет его)
- `NEXT_PUBLIC_SOCKET_URL` — URL Render сервера (из шага 2)

### Шаг 4: Задеплоить

1. Нажми **"Deploy"**
2. Дождись деплоя (2-4 минуты)
3. **Скопируй URL приложения** (например, `https://boardgames-app-xyz.vercel.app`)

### Шаг 5: Обновить NEXTAUTH_URL

1. **Vercel** → твой проект → **Settings** → **Environment Variables**
2. Найди `NEXTAUTH_URL` и измени на актуальный URL (например, `https://boardgames-app-xyz.vercel.app`)
3. Нажми **"Save"**
4. Vercel покажет **"Redeploy required"** → нажми **"Redeploy"**

---

## 4️⃣ Обновить CORS в Render

Теперь, когда у тебя есть URL Vercel приложения:

1. **Render** → твой Socket.io сервис → **Environment**
2. Обнови переменную `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://boardgames-app-xyz.vercel.app
   ```
3. Нажми **"Save Changes"** (сервис перезапустится автоматически)

---

## 5️⃣ Настроить OAuth (если используешь)

### Google OAuth

1. Зайди на [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Выбери свой OAuth 2.0 клиент
3. В **Authorized redirect URIs** добавь:
   ```
   https://boardgames-app-xyz.vercel.app/api/auth/callback/google
   ```
4. Нажми **"Save"**

### GitHub OAuth

1. Зайди на [github.com/settings/developers](https://github.com/settings/developers)
2. Выбери свой OAuth App
3. В **Authorization callback URL** измени на:
   ```
   https://boardgames-app-xyz.vercel.app/api/auth/callback/github
   ```
4. Нажми **"Update application"**

---

## 6️⃣ Тестирование

### ✅ Проверочный список

1. **Открой приложение:** `https://boardgames-app-xyz.vercel.app`
2. **Регистрация:** Создай аккаунт через email/password
3. **OAuth логин:** Попробуй войти через Google/GitHub
4. **Создать лобби:** Создай игру Yahtzee
5. **Socket.io:** Открой консоль браузера (F12), проверь подключение к Socket.io
   - Должно быть: `WebSocket connection to 'wss://boardgames-socket.onrender.com/socket.io/...'`
   - Не должно быть ошибок CORS или 404
6. **Игра:** Запусти игру с ботом, сделай ход, проверь обновление в реальном времени
7. **Чат:** Отправь сообщение в лобби

### 🐛 Debugging

**Ошибка подключения Socket.io?**
- Проверь `NEXT_PUBLIC_SOCKET_URL` в Vercel (должен быть URL Render сервера)
- Проверь `CORS_ORIGIN` в Render (должен быть URL Vercel приложения)
- Открой `https://boardgames-socket.onrender.com/health` — должен вернуть `{"ok":true}`

**Ошибка базы данных?**
- Проверь `DATABASE_URL` в Vercel и Render (одинаковые?)
- Попробуй локально: `npx prisma studio` с production DATABASE_URL

**Ошибка OAuth?**
- Проверь redirect URLs в Google/GitHub консолях
- Проверь `NEXTAUTH_URL` в Vercel (без trailing slash `/`)

---

## 7️⃣ Мониторинг и логи

### Vercel Logs

1. **Vercel** → твой проект → **Deployments** → выбери деплой → **Logs**
2. Смотри build logs и runtime logs (Functions)

### Render Logs

1. **Render** → твой сервис → **Logs**
2. Смотри real-time логи Socket.io сервера (подключения, ошибки)

### Supabase Logs

1. **Supabase** → твой проект → **Database** → **Query Performance**
2. Смотри медленные запросы и ошибки

---

## 8️⃣ Continuous Deployment (CI/CD)

**Автоматический деплой:**
- **Vercel:** Автоматически деплоит при push в `main` (настроено по умолчанию)
- **Render:** Автоматически деплоит при push в `main` (включи в настройках сервиса)

**Preview deployments (Vercel):**
- Каждый Pull Request автоматически создаёт preview деплой
- Удобно для тестирования перед merge

---

## 🔒 Безопасность

### ⚠️ КРИТИЧНО: Проверь .env файлы в Git

Убедись, что `.env` и `.env.local` **НЕ закоммичены** в Git:

```bash
git status
```

Если есть — немедленно удали:

```bash
git rm --cached .env .env.local
git commit -m "Remove sensitive env files"
git push
```

Затем **смени все секреты** (пароли БД, API ключи, OAuth secrets), т.к. они могли попасть в историю Git!

### 🔐 Best Practices

- **Никогда не храни секреты в коде** — используй переменные окружения
- **Используй разные секреты** для dev и production
- **Ротируй ключи** регулярно (особенно после утечек)
- **Включи 2FA** на Vercel, Render, Supabase, GitHub

---

## 📊 Performance Tips

### Vercel
- **Edge Functions:** Если нужна низкая latency для API routes
- **Image Optimization:** Next.js автоматически оптимизирует изображения
- **Caching:** Используй `Cache-Control` headers для static assets

### Render
- **Free tier:** Спит после 15 минут неактивности (холодный старт ~30 сек)
- **Starter tier ($7/мес):** Всегда активен, нет холодных стартов
- **Health checks:** Настрой health check endpoint (`/health`) для мониторинга

### Supabase
- **Connection Pooling:** Используй Supabase pooler для большого числа соединений
- **Indexes:** Добавь индексы на часто запрашиваемые поля (например, `lobby.code`)

---

## 🆘 Troubleshooting

### Проблема: Vercel деплой не запускается

**Решение:**
- Проверь build logs в Vercel Dashboard
- Убедись, что `prisma generate` выполняется в build command
- Проверь Node.js версию (должна быть 18+)

### Проблема: Socket.io не подключается

**Решение:**
- Проверь `NEXT_PUBLIC_SOCKET_URL` в Vercel
- Проверь CORS в Render (`CORS_ORIGIN`)
- Откройте Network tab в DevTools → ищи WebSocket подключение

### Проблема: OAuth не работает

**Решение:**
- Проверь redirect URLs в OAuth провайдерах
- Проверь `NEXTAUTH_URL` в Vercel (должен совпадать с реальным доменом)
- Проверь логи в Vercel Functions

---

## 📚 Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Socket.io Documentation](https://socket.io/docs/v4/)

---

## ✅ Checklist перед деплоем

- [ ] База данных создана на Supabase
- [ ] Prisma миграции применены
- [ ] Socket.io сервер задеплоен на Render
- [ ] Next.js приложение задеплоено на Vercel
- [ ] Все env vars добавлены в Vercel и Render
- [ ] CORS настроен правильно
- [ ] OAuth redirect URLs обновлены
- [ ] `.env` файлы НЕ в Git
- [ ] Тестирование пройдено (регистрация, логин, игра, Socket.io)
- [ ] Логи проверены (нет критичных ошибок)

---

**Готово!** 🎉 Твой проект задеплоен и работает в production!

Если возникнут проблемы — проверь секцию **Troubleshooting** или открой issue в репозитории.
