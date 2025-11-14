# 🎯 Быстрая справка по деплою

## 📱 Твои ссылки после деплоя

- **Сайт**: https://boardly.online
- **WebSocket**: https://boardly-websocket.onrender.com
- **API Health**: https://boardly.online/api/health

---

## 🔑 Переменные окружения - Шпаргалка

### Для Vercel (Frontend)
```env
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="[сгенерируй: openssl rand -base64 32]"
JWT_SECRET="[сгенерируй: openssl rand -base64 32]"
NEXTAUTH_URL="https://boardly.online"
RESEND_API_KEY="re_[твой_ключ]"
EMAIL_FROM="Boardly <noreply@boardly.online>"
NEXT_PUBLIC_SOCKET_URL="https://boardly-websocket.onrender.com"
```

### Для Render (WebSocket)
```env
NODE_ENV=production
PORT=10000
HOSTNAME=0.0.0.0
CORS_ORIGIN=https://boardly.online,https://www.boardly.online
DATABASE_URL="[тот же что и в Vercel]"
```

---

## ⚡ Команды для локальной настройки

```bash
# Создать .env
# Добавь в файл .env переменную DATABASE_URL

# Установить зависимости
npm install

# Применить миграции
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate

# Проверить базу данных
npx prisma studio

# Запустить локально
npm run dev                 # Frontend (http://localhost:3000)
npm run socket:dev          # WebSocket (http://localhost:3001)
```

---

## 🔧 Настройки сборки

### Vercel
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Render
- **Build Command**: `npm install && npm run db:generate`
- **Start Command**: `npm run socket:start`
- **Health Check Path**: `/health`

---

## 🎯 Порядок деплоя

1. **Supabase** (15 мин)
   - Создай проект
   - Скопируй DATABASE_URL
   - Локально: `npx prisma migrate deploy`

2. **Resend** (5 мин)
   - Создай API ключ
   - Скопируй `re_...`

3. **Render** (15 мин)
   - Создай Web Service
   - Добавь env variables
   - Дождись деплоя
   - Скопируй URL

4. **Vercel** (15 мин)
   - Подключи репозиторий
   - Добавь env variables
   - Deploy
   - Скопируй URL

5. **Домен** (10-60 мин)
   - Добавь в Vercel
   - Настрой DNS
   - Подожди

---

## ✅ Проверка после деплоя

```bash
# 1. WebSocket Health
curl https://boardly-websocket.onrender.com/health
# → {"ok":true}

# 2. Frontend
curl https://boardly.online
# → HTML страница

# 3. API Health
curl https://boardly.online/api/health
# → {"ok":true}

# 4. Регистрация
# Открой в браузере: https://boardly.online/auth/register
```

---

## 🐛 Частые проблемы

### WebSocket не подключается
```
Причина: Cold start на Render (free tier)
Решение: Подожди 30-60 секунд, обнови страницу
```

### Prisma Client not found
```
Причина: Не сгенерирован при сборке
Решение: Build Command должен быть:
         prisma generate && next build
```

### Email не приходит
```
Причина: Неправильный RESEND_API_KEY
Решение: Проверь ключ в Resend Dashboard
```

### DATABASE_URL invalid
```
Причина: [YOUR-PASSWORD] не заменен на реальный пароль
Решение: Скопируй строку из Supabase и замени пароль
```

---

## 📊 Дашборды

- **Vercel**: https://vercel.com/dashboard
- **Render**: https://dashboard.render.com
- **Supabase**: https://supabase.com/dashboard
- **Resend**: https://resend.com/overview

---

## 🔄 Обновление проекта

```bash
# Просто пуш в git
git add .
git commit -m "Update"
git push origin main

# Vercel и Render автоматически задеплоят!
```

---

## 📞 Где искать логи

### Vercel
```
Dashboard → Project → Deployments → [последний деплой] → View Function Logs
```

### Render
```
Dashboard → Service (boardly-websocket) → Logs (вкладка справа)
```

### Supabase
```
Dashboard → Logs (боковое меню)
```

---

## 🎉 Успешный деплой когда:

- ✅ `https://boardly.online` открывается
- ✅ Регистрация работает
- ✅ Email приходит
- ✅ Можно создать лобби
- ✅ Real-time обновления работают
- ✅ Нет ошибок в консоли браузера

---

## 📚 Полные инструкции

- **Русская**: `ИНСТРУКЦИЯ_ПО_ДЕПЛОЮ.md`
- **Английская**: `DEPLOYMENT_GUIDE.md`
- **Быстрая**: `DEPLOYMENT_QUICKSTART.md`
- **Чек-лист**: `DEPLOYMENT_CHECKLIST.md`

---

**Эта справка всегда под рукой! 🚀**
