# 🚀 Boardly Deployment - One Page Summary

## 📋 TL;DR - 5 Шагов за 45 минут

```
1. Supabase  →  DATABASE_URL  →  npm run db:migrate      (15 мин)
2. Resend    →  API_KEY       →  copy                    (5 мин)
3. Render    →  WebSocket     →  deploy                  (15 мин)
4. Vercel    →  Frontend      →  deploy                  (10 мин)
5. Domain    →  DNS           →  wait                    (30 мин)
```

---

## 🎯 Начни здесь

### Файл для начала: **`НАЧНИ_ЗДЕСЬ.md`**

---

## 🔑 Environment Variables (Скопируй и заполни)

### Vercel (8 переменных):
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
JWT_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://boardly.online"
RESEND_API_KEY="re_..."
EMAIL_FROM="Boardly <noreply@boardly.online>"
NEXT_PUBLIC_SOCKET_URL="https://boardly-websocket.onrender.com"
```

### Render (5 переменных):
```bash
NODE_ENV="production"
PORT="10000"
HOSTNAME="0.0.0.0"
CORS_ORIGIN="https://boardly.online,https://www.boardly.online"
DATABASE_URL="postgresql://..."  # Тот же что в Vercel
```

---

## ⚡ Быстрые команды

```bash
# Локальная настройка
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma studio

# Генерация секретов
openssl rand -base64 32  # для NEXTAUTH_SECRET
openssl rand -base64 32  # для JWT_SECRET

# Авто-создание .env (Windows)
setup-env.bat

# Авто-создание .env (Linux/Mac)
chmod +x setup-env.sh && ./setup-env.sh
```

---

## 🌐 URLs после деплоя

```
Frontend:   https://boardly.online
API Health: https://boardly.online/api/health
WebSocket:  https://boardly-websocket.onrender.com
WS Health:  https://boardly-websocket.onrender.com/health
```

---

## 📊 Build Commands

### Vercel:
```
Build: prisma generate && next build
Install: npm install
Output: .next
```

### Render:
```
Build: npm install && npm run db:generate
Start: npm run socket:start
Health: /health
```

---

## ✅ Проверка после деплоя

```bash
# 1. WebSocket
curl https://boardly-websocket.onrender.com/health
# → {"ok":true}

# 2. API
curl https://boardly.online/api/health
# → {"ok":true}

# 3. Frontend
open https://boardly.online

# 4. Регистрация
open https://boardly.online/auth/register
```

---

## 🐛 Top 5 Problems & Solutions

### 1. WebSocket не подключается
```
Причина: Cold start (Render free tier)
Решение: Подожди 30-60 секунд
```

### 2. Prisma Client not found
```
Причина: Не сгенерирован при сборке
Решение: Build Command = "prisma generate && next build"
```

### 3. Invalid DATABASE_URL
```
Причина: [YOUR-PASSWORD] не заменен
Решение: Скопируй из Supabase и замени пароль
```

### 4. CORS Error
```
Причина: CORS_ORIGIN не включает домен
Решение: Добавь "https://boardly.online" в CORS_ORIGIN
```

### 5. Email не приходит
```
Причина: Неправильный RESEND_API_KEY
Решение: Проверь ключ в Resend Dashboard
```

---

## 📚 Документация Quick Links

| Файл | Для чего |
|------|----------|
| **НАЧНИ_ЗДЕСЬ.md** | Первый файл для чтения |
| **ИНСТРУКЦИЯ_ПО_ДЕПЛОЮ.md** | Пошаговая инструкция |
| **DEPLOYMENT_CHECKLIST.md** | Чек-лист шагов |
| **QUICK_REFERENCE.md** | Команды и решения |
| **DEPLOYMENT_MAP.md** | Диаграммы архитектуры |
| **FILES_INDEX.md** | Индекс всех файлов |

---

## 🔧 Service Dashboards

```
Vercel:   https://vercel.com/dashboard
Render:   https://dashboard.render.com
Supabase: https://supabase.com/dashboard
Resend:   https://resend.com/overview
```

---

## 📞 Логи (если проблемы)

```
Vercel:   Dashboard → Deployments → View Logs
Render:   Dashboard → Service → Logs
Supabase: Dashboard → Logs
Browser:  F12 → Console
```

---

## 🎯 Success Checklist

- [ ] `https://boardly.online` открывается
- [ ] Регистрация работает
- [ ] Email приходит
- [ ] Логин работает
- [ ] Можно создать лобби
- [ ] Real-time обновления работают
- [ ] WebSocket подключен (F12 → Network → WS)

---

## 🔄 Deploy Updates

```bash
git add .
git commit -m "Update"
git push origin main
# → Авто-деплой на Vercel и Render
```

---

## ⏱️ Timeline

```
0:00  - Start
0:15  - Supabase setup done
0:20  - Resend setup done
0:35  - Render deployed
0:45  - Vercel deployed
1:15  - Domain configured (wait DNS)
1:30  - LIVE! 🎉
```

---

## 📱 QR Code Structure (for mobile testing)

```
После деплоя создай QR код на https://boardly.online
для быстрого тестирования на мобильных устройствах
```

---

## 🎉 После успешного деплоя

1. ✅ Протестируй все функции
2. ✅ Поделись с друзьями
3. ✅ Начни играть!

---

## 🆘 Emergency Contacts

Проблемы? Последовательность действий:
1. **QUICK_REFERENCE.md** → Частые проблемы
2. **DEPLOYMENT_GUIDE.md** → Troubleshooting
3. Проверь логи
4. Перечитай инструкцию

---

**Распечатай эту страницу и держи рядом во время деплоя! 📄**

**Удачи! 🚀**
