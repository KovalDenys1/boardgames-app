# 🚀 Быстрый старт деплоя Boardly

## 📝 Чеклист переменных окружения

### 1. Supabase (База данных)
```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```
**Где взять:**
- Supabase Dashboard → Settings → Database → Connection string → URI

---

### 2. Authentication (Генерация секретов)
```bash
# Выполните в терминале для генерации:
openssl rand -base64 32  # Скопируйте результат в NEXTAUTH_SECRET
openssl rand -base64 32  # Скопируйте результат в JWT_SECRET
```

```bash
NEXTAUTH_SECRET="[32+ случайных символа]"
JWT_SECRET="[32+ случайных символа]"
NEXTAUTH_URL="https://boardly.online"
```

---

### 3. Email (Resend)
```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="Boardly <noreply@boardly.online>"
```
**Где взять:**
- Resend Dashboard → API Keys → Create API Key

---

### 4. WebSocket (после деплоя на Render)
```bash
NEXT_PUBLIC_SOCKET_URL="https://boardly-websocket.onrender.com"
```
**Где взять:**
- Render Dashboard → Ваш сервис → URL вверху страницы

---

### 5. Supabase Public (Опционально)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="eyJxxxxx..."
```
**Где взять:**
- Supabase Dashboard → Settings → API → Project URL & anon public key

---

## 🎯 Порядок деплоя (рекомендуемый)

### Шаг 1: Supabase (5 минут)
1. Создайте проект на supabase.com
2. Скопируйте DATABASE_URL
3. Локально выполните:
   ```bash
   # Создайте .env файл
   echo 'DATABASE_URL="your-database-url"' > .env
   
   # Примените миграции
   npm install
   npx prisma migrate deploy
   npx prisma generate
   ```

### Шаг 2: Render - WebSocket (10 минут)
1. Создайте Web Service на render.com
2. Используйте файл `render.yaml` (автоконфиг)
3. Добавьте Environment Variables:
   ```
   DATABASE_URL=...
   CORS_ORIGIN=https://boardly.online,https://www.boardly.online
   ```
4. Дождитесь деплоя → Скопируйте URL

### Шаг 3: Resend - Email (3 минуты)
1. Создайте аккаунт на resend.com
2. Создайте API Key → Скопируйте

### Шаг 4: Vercel - Frontend (10 минут)
1. Подключите репозиторий на vercel.com
2. Добавьте ВСЕ Environment Variables (см. ниже)
3. Deploy!

### Шаг 5: Домен (5-60 минут)
1. В Vercel: Settings → Domains → Add boardly.online
2. В DNS провайдере: добавьте A/CNAME записи от Vercel
3. Подождите распространения DNS
4. Обновите `NEXTAUTH_URL` и `CORS_ORIGIN`

---

## 📋 Все переменные для Vercel

Скопируйте это в Vercel → Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Auth Secrets (сгенерируйте: openssl rand -base64 32)
NEXTAUTH_SECRET=ваш-сгенерированный-секрет-32-символа
JWT_SECRET=ваш-сгенерированный-jwt-секрет-32-символа
NEXTAUTH_URL=https://boardly.online

# Email
RESEND_API_KEY=re_ваш_ключ_от_resend
EMAIL_FROM=Boardly <noreply@boardly.online>

# WebSocket
NEXT_PUBLIC_SOCKET_URL=https://boardly-websocket.onrender.com

# Supabase (опционально)
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=ваш_anon_key
```

---

## 📋 Все переменные для Render

Скопируйте это в Render → Environment Variables:

```env
NODE_ENV=production
PORT=10000
HOSTNAME=0.0.0.0
CORS_ORIGIN=https://boardly.online,https://www.boardly.online
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

---

## ✅ Проверка после деплоя

Откройте эти URLs и проверьте:

1. **WebSocket Health**: https://boardly-websocket.onrender.com/health
   - Должен вернуть: `{"ok":true}`

2. **Frontend**: https://boardly.online
   - Должен открыться сайт

3. **API Health**: https://boardly.online/api/health
   - Должен вернуть: `{"ok":true}`

4. **Регистрация**: https://boardly.online/auth/register
   - Попробуйте зарегистрироваться

5. **Database**:
   ```bash
   npx prisma studio
   ```
   - Проверьте, что пользователь создался

---

## 🐛 Частые проблемы

### "Invalid DATABASE_URL"
- Проверьте, что URL не содержит `[YOUR-PASSWORD]` - замените на реальный пароль
- Проверьте, что URL одинаковый в Vercel и Render

### "WebSocket connection failed"
- Подождите 2-3 минуты после деплоя на Render (холодный старт)
- Проверьте CORS_ORIGIN включает ваш домен
- Проверьте логи в Render Dashboard

### "Email not sending"
- Проверьте RESEND_API_KEY корректный
- Для boardly.online нужно верифицировать домен в Resend

### "Prisma Client not found"
- В Vercel Build Command должно быть: `prisma generate && next build`
- В package.json должен быть: `"postinstall": "prisma generate"`

---

## 🔄 Обновление после изменений

```bash
# Просто запушьте в git
git add .
git commit -m "Update"
git push origin main

# Vercel и Render автоматически задеплоят
```

---

## 📞 Нужна помощь?

1. Проверьте логи:
   - **Vercel**: Dashboard → Deployments → View Function Logs
   - **Render**: Dashboard → Logs

2. Проверьте все переменные окружения

3. Используйте детальное руководство: `DEPLOYMENT_GUIDE.md`

---

**Готово! Ваш Boardly теперь онлайн на boardly.online** 🎉
