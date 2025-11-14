# 🚀 Полное руководство по деплою Boardly на boardly.online

## Обзор архитектуры

- **Frontend + Backend API**: Vercel (Next.js App Router)
- **Database**: Supabase (PostgreSQL)
- **WebSocket Server**: Render (Socket.IO)
- **Domain**: boardly.online

---

## 📋 Предварительные требования

- [ ] Аккаунт на [Vercel](https://vercel.com)
- [ ] Аккаунт на [Supabase](https://supabase.com)
- [ ] Аккаунт на [Render](https://render.com)
- [ ] Аккаунт на [Resend](https://resend.com) (для email)
- [ ] Git репозиторий (GitHub/GitLab/Bitbucket)
- [ ] Домен boardly.online настроен

---

## 1️⃣ Настройка Supabase (База данных)

### Шаг 1: Создание проекта
1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **New Project**
3. Заполните:
   - **Name**: `boardly`
   - **Database Password**: создайте надёжный пароль (сохраните его!)
   - **Region**: выберите ближайший регион (например, `Europe (Frankfurt)`)
4. Нажмите **Create new project** и подождите ~2 минуты

### Шаг 2: Получение Database URL
1. В Supabase перейдите в **Settings** → **Database**
2. Найдите секцию **Connection string** → **URI**
3. Выберите режим **Session** или **Transaction**
4. Скопируйте URL, он будет выглядеть так:
   ```
   postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
5. **Замените `[YOUR-PASSWORD]` на ваш реальный пароль**

### Шаг 3: Применение миграций (выполните локально)
1. Создайте файл `.env` в корне проекта:
   ```bash
   DATABASE_URL="postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   ```

2. Установите зависимости и примените миграции:
   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma generate
   ```

3. Проверьте, что таблицы созданы:
   ```bash
   npx prisma studio
   ```
   Должны появиться таблицы: User, Account, Session, Lobby, Game, Player и т.д.

---

## 2️⃣ Настройка Render (WebSocket сервер)

### Шаг 1: Создание Web Service
1. Перейдите на [render.com](https://render.com)
2. Нажмите **New** → **Web Service**
3. Подключите ваш Git репозиторий
4. Заполните настройки:
   - **Name**: `boardly-websocket`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `main`
   - **Root Directory**: оставьте пустым
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run db:generate`
   - **Start Command**: `npm run socket:start`
   - **Plan**: Free

### Шаг 2: Настройка Environment Variables
В разделе **Environment Variables** добавьте:

```
NODE_ENV=production
PORT=10000
HOSTNAME=0.0.0.0
CORS_ORIGIN=https://boardly.online,https://www.boardly.online
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

⚠️ **Важно**: Замените `DATABASE_URL` на ваш URL из Supabase!

### Шаг 3: Deploy
1. Нажмите **Create Web Service**
2. Дождитесь завершения деплоя (~3-5 минут)
3. Скопируйте URL сервиса (например: `https://boardly-websocket.onrender.com`)

### Шаг 4: Проверка работоспособности
Откройте в браузере:
```
https://boardly-websocket.onrender.com/health
```
Должны увидеть: `{"ok":true}`

---

## 3️⃣ Настройка Resend (Email сервис)

### Шаг 1: Создание API ключа
1. Перейдите на [resend.com](https://resend.com)
2. Зарегистрируйтесь/войдите
3. Перейдите в **API Keys**
4. Нажмите **Create API Key**
5. Скопируйте ключ (начинается с `re_`)

### Шаг 2: Настройка домена (опционально, для production)
1. В Resend перейдите в **Domains**
2. Нажмите **Add Domain**
3. Введите `boardly.online`
4. Добавьте DNS записи в настройки вашего домена (предоставит Resend)
5. Подождите верификации (~10-60 минут)

Для тестирования можно использовать встроенный домен от Resend.

---

## 4️⃣ Настройка Vercel (Frontend + Backend)

### Шаг 1: Подключение репозитория
1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите **Add New** → **Project**
3. Выберите ваш Git репозиторий
4. **Framework Preset**: Next.js (должен определиться автоматически)

### Шаг 2: Настройка Build & Development Settings
- **Framework**: Next.js
- **Root Directory**: `./`
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Шаг 3: Environment Variables
Добавьте все эти переменные в Vercel (Settings → Environment Variables):

```bash
# Database
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Authentication - используйте генераторы для секретов
NEXTAUTH_SECRET=ваш-случайный-секрет-минимум-32-символа
JWT_SECRET=ваш-случайный-jwt-секрет-минимум-32-символа
NEXTAUTH_URL=https://boardly.online

# Email (Resend)
RESEND_API_KEY=re_ваш_api_ключ
EMAIL_FROM=Boardly <noreply@boardly.online>

# WebSocket Server (URL из Render)
NEXT_PUBLIC_SOCKET_URL=https://boardly-websocket.onrender.com

# Supabase (опционально)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=ваш_anon_key

# OAuth (опционально - настройте позже если нужно)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
```

### Генерация секретов:
Выполните в терминале:
```bash
# Для NEXTAUTH_SECRET
openssl rand -base64 32

# Для JWT_SECRET
openssl rand -base64 32
```

### Шаг 4: Deploy
1. Нажмите **Deploy**
2. Дождитесь завершения (~2-3 минуты)
3. Vercel автоматически даст вам URL (например: `boardly-xyz123.vercel.app`)

---

## 5️⃣ Настройка кастомного домена boardly.online

### В Vercel:
1. Перейдите в **Settings** → **Domains**
2. Добавьте домен: `boardly.online`
3. Также добавьте: `www.boardly.online`
4. Vercel покажет DNS записи, которые нужно добавить

### В настройках вашего домена (например, Cloudflare, GoDaddy):
Добавьте DNS записи (примеры от Vercel):

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Подождите распространения DNS (5-60 минут).

### Обновление переменных окружения:
После настройки домена обновите в Vercel и Render:

**Vercel:**
```
NEXTAUTH_URL=https://boardly.online
```

**Render (WebSocket):**
```
CORS_ORIGIN=https://boardly.online,https://www.boardly.online
```

---

## 6️⃣ Финальная проверка

### Проверьте все компоненты:

1. **Database (Supabase)**:
   ```bash
   npx prisma studio
   ```
   Должны видеть все таблицы

2. **WebSocket (Render)**:
   ```
   https://boardly-websocket.onrender.com/health
   ```
   → `{"ok":true}`

3. **Frontend (Vercel)**:
   ```
   https://boardly.online
   ```
   → Сайт должен открыться

4. **API Health Check**:
   ```
   https://boardly.online/api/health
   ```
   → `{"ok":true}`

5. **Регистрация пользователя**:
   - Откройте `https://boardly.online/auth/register`
   - Зарегистрируйтесь
   - Проверьте email для верификации

6. **WebSocket соединение**:
   - Создайте лобби
   - Пригласите друга
   - Проверьте real-time обновления

---

## 🔧 Полезные команды

### Локальная разработка:
```bash
# Установка зависимостей
npm install

# Запуск Next.js dev сервера
npm run dev

# Запуск WebSocket сервера
npm run socket:dev

# Prisma Studio (UI для БД)
npx prisma studio

# Применить миграции
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate
```

### Деплой:
```bash
# Git push автоматически задеплоит на Vercel и Render
git add .
git commit -m "Update"
git push origin main
```

---

## 🐛 Troubleshooting

### WebSocket не подключается:
- Проверьте `CORS_ORIGIN` в Render включает ваш домен
- Проверьте `NEXT_PUBLIC_SOCKET_URL` в Vercel правильный
- Проверьте логи в Render Dashboard

### Ошибки базы данных:
- Убедитесь, что `DATABASE_URL` одинаковый везде
- Проверьте, что миграции применены: `npx prisma migrate deploy`
- Проверьте в Supabase Dashboard → Table Editor

### Email не отправляются:
- Проверьте `RESEND_API_KEY` корректный
- Верифицируйте домен в Resend (для production)
- Проверьте логи в Resend Dashboard

### Домен не работает:
- Подождите распространения DNS (до 48 часов, обычно быстрее)
- Проверьте DNS записи: `nslookup boardly.online`
- Очистите кэш браузера / используйте режим инкогнито

---

## 📊 Мониторинг

### Vercel:
- Логи: Dashboard → Project → Deployments → View Function Logs
- Analytics: Dashboard → Analytics
- Errors: Dashboard → Project → Settings → Error Reporting

### Render:
- Логи: Dashboard → Service → Logs
- Metrics: Dashboard → Service → Metrics

### Supabase:
- Logs: Dashboard → Logs
- Database: Dashboard → Table Editor
- Performance: Dashboard → Reports

---

## 🔐 Безопасность

### ✅ Чеклист безопасности:
- [ ] Все секреты уникальные и случайные (минимум 32 символа)
- [ ] `DATABASE_URL` никогда не коммитится в git
- [ ] CORS настроен только на ваш домен
- [ ] Домен верифицирован в Resend
- [ ] HTTPS включен везде
- [ ] Rate limiting настроен (опционально)

---

## 🎉 Готово!

Ваш проект Boardly теперь полностью задеплоен на:
- 🌐 **Frontend**: https://boardly.online
- 🔌 **WebSocket**: https://boardly-websocket.onrender.com
- 🗄️ **Database**: Supabase PostgreSQL
- 📧 **Email**: Resend

---

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи в каждом сервисе
2. Перечитайте секцию Troubleshooting
3. Проверьте все environment variables
4. Убедитесь, что все сервисы запущены

Удачи! 🚀
