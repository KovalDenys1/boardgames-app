# ✅ Deployment Checklist

Краткий чеклист для деплоя **boardgames-app**. Детали в [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## 🔐 Безопасность (СНАЧАЛА!)

- [ ] **Проверь Git:** `.env` и `.env.local` НЕ закоммичены
  ```bash
  git status
  git ls-files | grep -E "\.env"
  ```
  ⚠️ Если есть — удали и смени все секреты!

---

## 1️⃣ Supabase (База данных)

- [ ] Создан проект на [supabase.com](https://supabase.com)
- [ ] Скопирован `DATABASE_URL` (Connection String → URI)
- [ ] Применены миграции:
  ```bash
  export DATABASE_URL="postgresql://..."
  npx prisma db push
  ```
- [ ] Проверено в Prisma Studio: `npx prisma studio`

---

## 2️⃣ Render (Socket.io сервер)

- [ ] Создан Web Service на [render.com](https://render.com)
  - Name: `boardgames-socket`
  - Runtime: Node
  - Build Command: `npm install`
  - Start Command: `npm run socket:start`

- [ ] Добавлены env vars:
  ```bash
  NODE_ENV=production
  HOSTNAME=0.0.0.0
  CORS_ORIGIN=https://ТУТ_БУДЕТ_VERCEL_URL (обновишь позже)
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=твой-секрет
  JWT_SECRET=твой-jwt-секрет
  ```

- [ ] Задеплоен (3-5 мин)
- [ ] Скопирован URL (например, `https://boardgames-socket.onrender.com`)
- [ ] Проверен `/health` endpoint:
  ```
  https://boardgames-socket.onrender.com/health
  → {"ok":true}
  ```

---

## 3️⃣ Vercel (Next.js приложение)

- [ ] Подключен репозиторий на [vercel.com](https://vercel.com)
- [ ] Добавлены env vars:
  ```bash
  DATABASE_URL=postgresql://...
  NEXT_PUBLIC_SUPABASE_URL=https://...
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
  NEXTAUTH_URL=https://твой-app.vercel.app (обновишь после деплоя)
  NEXTAUTH_SECRET=твой-секрет
  JWT_SECRET=твой-jwt-секрет
  GITHUB_CLIENT_ID=...
  GITHUB_CLIENT_SECRET=...
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  NEXT_PUBLIC_SOCKET_URL=https://boardgames-socket.onrender.com
  RESEND_API_KEY=... (опционально)
  EMAIL_FROM=... (опционально)
  ```

- [ ] Задеплоен (2-4 мин)
- [ ] Скопирован URL Vercel приложения
- [ ] Обновлен `NEXTAUTH_URL` в Vercel env vars → Redeploy

---

## 4️⃣ Финализация

- [ ] **Обновлен CORS в Render:**
  - `CORS_ORIGIN=https://твой-app.vercel.app`
  - Save Changes (автоматически redeploy)

- [ ] **Обновлены OAuth redirect URLs:**
  - **Google:** [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
    - Authorized redirect URIs: `https://твой-app.vercel.app/api/auth/callback/google`
  - **GitHub:** [github.com/settings/developers](https://github.com/settings/developers)
    - Authorization callback URL: `https://твой-app.vercel.app/api/auth/callback/github`

---

## 5️⃣ Тестирование

- [ ] Открыто приложение: `https://твой-app.vercel.app`
- [ ] Регистрация работает (email/password)
- [ ] OAuth логин работает (Google/GitHub)
- [ ] Создано лобби Yahtzee
- [ ] Socket.io подключается (проверь DevTools → Network → WS)
- [ ] Игра работает (ходы, обновления в реальном времени)
- [ ] Чат работает
- [ ] Нет ошибок в логах:
  - Vercel → Deployments → Logs
  - Render → Logs

---

## ❌ Проблемы?

| Проблема | Решение |
|----------|---------|
| Socket.io не подключается | Проверь `NEXT_PUBLIC_SOCKET_URL` в Vercel и `CORS_ORIGIN` в Render |
| OAuth не работает | Проверь redirect URLs и `NEXTAUTH_URL` |
| База данных ошибки | Проверь `DATABASE_URL` (одинаковый в Vercel и Render?) |
| Render сервис спит | Free tier спит через 15 мин, первый запрос ~30 сек (upgrade to Starter) |

Подробности в [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🎉 Готово!

После выполнения всех шагов твой проект полностью задеплоен на production!

**Production URLs:**
- **App:** `https://твой-app.vercel.app`
- **Socket.io:** `https://boardgames-socket.onrender.com`
- **Database:** Supabase PostgreSQL

**Мониторинг:**
- Vercel Dashboard → Deployments/Logs
- Render Dashboard → Logs
- Supabase Dashboard → Database/Logs
