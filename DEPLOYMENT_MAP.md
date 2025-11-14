# 🗺️ Визуальная карта деплоя Boardly

## 📊 Архитектура проекта

```
                    ┌─────────────────────────┐
                    │   boardly.online        │
                    │   (Твой домен)          │
                    └───────────┬─────────────┘
                                │
                                │ DNS → A Record / CNAME
                                │
                    ┌───────────▼─────────────┐
                    │      VERCEL             │
                    │  ┌──────────────────┐   │
                    │  │   Next.js 14     │   │
                    │  │   App Router     │   │
                    │  │                  │   │
                    │  │  ┌────────────┐  │   │
                    │  │  │  Frontend  │  │   │
                    │  │  │  (React)   │  │   │
                    │  │  └────────────┘  │   │
                    │  │                  │   │
                    │  │  ┌────────────┐  │   │
                    │  │  │ API Routes │  │   │
                    │  │  │ (Backend)  │  │   │
                    │  │  └────────────┘  │   │
                    │  └──────────────────┘   │
                    └───┬──────────────┬──────┘
                        │              │
         ┌──────────────┘              └──────────────┐
         │                                            │
         │                                            │
┌────────▼───────────┐                   ┌────────────▼──────────┐
│    SUPABASE        │                   │       RENDER          │
│  ┌──────────────┐  │                   │  ┌─────────────────┐  │
│  │  PostgreSQL  │  │                   │  │  Socket.IO      │  │
│  │              │  │                   │  │  WebSocket      │  │
│  │ ┌──────────┐ │  │                   │  │                 │  │
│  │ │  User    │ │  │                   │  │  Real-time      │  │
│  │ │  Lobby   │ │  │                   │  │  Communication  │  │
│  │ │  Game    │ │  │                   │  │                 │  │
│  │ │  Player  │ │  │                   │  │  /health        │  │
│  │ └──────────┘ │  │                   │  └─────────────────┘  │
│  └──────────────┘  │                   └───────────────────────┘
└────────────────────┘                   
         │                               
         │ Sends Emails                 
         │                               
┌────────▼───────────┐                   
│      RESEND        │                   
│  ┌──────────────┐  │                   
│  │ Email API    │  │                   
│  │              │  │                   
│  │ - Verify     │  │                   
│  │ - Reset pwd  │  │                   
│  └──────────────┘  │                   
└────────────────────┘                   
```

---

## 🔄 Процесс деплоя (пошагово)

```
START
  │
  ├─[1]─> SUPABASE (15 min)
  │       │
  │       ├─> Создать проект
  │       ├─> Получить DATABASE_URL
  │       └─> Применить миграции локально
  │           └─> npx prisma migrate deploy
  │
  ├─[2]─> RESEND (5 min)
  │       │
  │       ├─> Создать аккаунт
  │       └─> Получить API ключ (re_...)
  │
  ├─[3]─> RENDER (15 min)
  │       │
  │       ├─> Подключить GitHub
  │       ├─> Создать Web Service
  │       ├─> Использовать render.yaml
  │       ├─> Добавить Environment Variables
  │       │   ├─> NODE_ENV
  │       │   ├─> PORT
  │       │   ├─> HOSTNAME
  │       │   ├─> CORS_ORIGIN
  │       │   └─> DATABASE_URL
  │       ├─> Deploy
  │       └─> Получить URL
  │
  ├─[4]─> VERCEL (15 min)
  │       │
  │       ├─> Подключить GitHub
  │       ├─> Создать проект
  │       ├─> Добавить Environment Variables
  │       │   ├─> DATABASE_URL
  │       │   ├─> NEXTAUTH_SECRET (генерируется)
  │       │   ├─> JWT_SECRET (генерируется)
  │       │   ├─> NEXTAUTH_URL
  │       │   ├─> RESEND_API_KEY
  │       │   ├─> EMAIL_FROM
  │       │   └─> NEXT_PUBLIC_SOCKET_URL
  │       └─> Deploy
  │
  └─[5]─> DOMAIN (10-60 min)
          │
          ├─> Добавить boardly.online в Vercel
          ├─> Получить DNS записи
          ├─> Настроить DNS у провайдера
          │   ├─> A record: @ → Vercel IP
          │   └─> CNAME: www → cname.vercel-dns.com
          ├─> Подождать DNS propagation
          └─> Проверить https://boardly.online
              │
              └─> SUCCESS! 🎉
```

---

## 🔐 Поток данных (Data Flow)

```
┌──────────────┐
│   BROWSER    │
│  (User)      │
└──────┬───────┘
       │
       │ HTTPS Request
       │
       ▼
┌─────────────────────────────┐
│      boardly.online          │
│      (Vercel Edge Network)   │
└──────────┬──────────────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌──────────┐  ┌────────────┐
│ Static   │  │  API       │
│ Files    │  │  Routes    │
│ (HTML,   │  │  (Server)  │
│  CSS,    │  │            │
│  JS)     │  │  Database  │
│          │  │  Queries   │
└──────────┘  └─────┬──────┘
                    │
                    │ Prisma
                    │
                    ▼
           ┌─────────────────┐
           │   SUPABASE      │
           │   PostgreSQL    │
           └─────────────────┘

┌──────────────┐
│   BROWSER    │
│  (Game)      │
└──────┬───────┘
       │
       │ WebSocket Connection
       │
       ▼
┌─────────────────────────────┐
│      RENDER                  │
│      Socket.IO Server        │
└──────────┬──────────────────┘
           │
           │ Real-time Events
           │
           ▼
┌─────────────────────────────┐
│   ALL CONNECTED BROWSERS    │
│   (Players in same lobby)   │
└─────────────────────────────┘
```

---

## 🔄 CI/CD Pipeline (Автодеплой)

```
┌─────────────────────┐
│   DEVELOPER         │
│   (You)             │
└──────────┬──────────┘
           │
           │ git push origin main
           │
           ▼
┌─────────────────────────────┐
│      GITHUB                  │
│      Repository              │
└──────┬──────────────┬────────┘
       │              │
       │ Webhook      │ Webhook
       │              │
       ▼              ▼
┌──────────┐    ┌──────────┐
│ VERCEL   │    │ RENDER   │
│          │    │          │
│ 1. Pull  │    │ 1. Pull  │
│ 2. Build │    │ 2. Build │
│ 3. Deploy│    │ 3. Deploy│
└────┬─────┘    └────┬─────┘
     │               │
     │ SUCCESS       │ SUCCESS
     │               │
     ▼               ▼
┌────────────────────────────┐
│   LIVE on boardly.online   │
└────────────────────────────┘

⏱️ Total Time: 2-5 minutes
```

---

## 🧪 Тестирование после деплоя

```
START Testing
  │
  ├─[1]─> Test WebSocket
  │       │
  │       └─> https://boardly-websocket.onrender.com/health
  │           └─> Response: {"ok":true} ✓
  │
  ├─[2]─> Test Frontend
  │       │
  │       └─> https://boardly.online
  │           └─> Page loads ✓
  │
  ├─[3]─> Test API
  │       │
  │       └─> https://boardly.online/api/health
  │           └─> Response: {"ok":true} ✓
  │
  ├─[4]─> Test Auth
  │       │
  │       ├─> Go to /auth/register
  │       ├─> Register new account
  │       ├─> Check email
  │       └─> Verify email ✓
  │
  └─[5]─> Test Game
          │
          ├─> Login
          ├─> Create lobby
          ├─> Open in another browser/tab
          ├─> Join lobby with code
          ├─> Check real-time updates
          └─> Play game ✓
              │
              └─> ALL TESTS PASSED! 🎉
```

---

## 📊 Environment Variables Map

```
┌────────────────────────────────────────────┐
│         Environment Variables              │
└────────────────────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│     VERCEL      │  │     RENDER      │
│                 │  │                 │
│ DATABASE_URL ───┼──┼─→ DATABASE_URL │
│                 │  │                 │
│ NEXTAUTH_SECRET │  │ NODE_ENV        │
│ JWT_SECRET      │  │ PORT            │
│ NEXTAUTH_URL    │  │ HOSTNAME        │
│ RESEND_API_KEY  │  │ CORS_ORIGIN     │
│ EMAIL_FROM      │  │                 │
│ SOCKET_URL ←────┼──┼─ [URL]         │
│                 │  │                 │
└─────────────────┘  └─────────────────┘
```

---

## 🚀 User Journey

```
User Opens Site
      │
      ▼
┌─────────────────┐
│  boardly.online │
│  Homepage       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────┐
│Register│  │ Login  │
└───┬────┘  └───┬────┘
    │           │
    │ Email     │
    │ Verify    │
    │           │
    └─────┬─────┘
          │
          ▼
    ┌──────────┐
    │  Lobby   │
    │  List    │
    └────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────┐
│Create  │  │ Join   │
│Lobby   │  │ Lobby  │
└───┬────┘  └───┬────┘
    │           │
    └─────┬─────┘
          │
          │ WebSocket
          │ Connection
          │
          ▼
    ┌──────────┐
    │   GAME   │
    │  Room    │
    └────┬─────┘
         │
         │ Real-time
         │ Updates
         │
         ▼
    ┌──────────┐
    │  Playing │
    │   Game   │
    └──────────┘
```

---

## 🔧 Troubleshooting Flow

```
Problem Detected
      │
      ▼
┌───────────────────┐
│ Check Logs        │
├───────────────────┤
│ - Vercel Logs     │
│ - Render Logs     │
│ - Browser Console │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Identify Issue    │
└─────────┬─────────┘
          │
     ┌────┴─────┐
     │          │
     ▼          ▼
┌─────────┐  ┌─────────┐
│WebSocket│  │Database │
│Error    │  │Error    │
└────┬────┘  └────┬────┘
     │            │
     ▼            ▼
[Check]       [Check]
CORS_ORIGIN   DATABASE_URL
SOCKET_URL    Migrations
              Prisma Client

     │            │
     └─────┬──────┘
           │
           ▼
    ┌──────────┐
    │   FIX    │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ Redeploy │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  TEST    │
    └────┬─────┘
         │
         ▼
    RESOLVED! ✓
```

---

## 📈 Performance & Monitoring

```
┌─────────────────────────────────┐
│      PRODUCTION MONITORING      │
└─────────────────────────────────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌────────┐    ┌────────┐
│VERCEL  │    │RENDER  │
│        │    │        │
│Analytics│   │Metrics │
│Logs    │    │Logs    │
│Errors  │    │Uptime  │
└───┬────┘    └───┬────┘
    │             │
    └──────┬──────┘
           │
           ▼
    ┌────────────┐
    │ SUPABASE   │
    │            │
    │ Database   │
    │ Logs       │
    │ Reports    │
    └────────────┘
```

---

## 🎯 Success Metrics

```
After Deployment Check:

✓ Site Load Time     < 2 seconds
✓ API Response       < 500ms
✓ WebSocket Connect  < 1 second
✓ Database Query     < 100ms
✓ Email Delivery     < 30 seconds

✓ Uptime             99%+ (Render free tier may vary)
✓ SSL Certificate    Valid
✓ DNS Resolution     Working
✓ CORS Policy        Configured
✓ Authentication     Working
```

---

**Используй эту карту как справочник во время деплоя! 🗺️**
