# Foreign Key Constraint Fix

## Проблема
```
Foreign key constraint failed on the field: `Lobby_creatorId_fkey (index)`
```

Ошибка возникала при создании лобби, потому что `session.user.id` не соответствовал существующему пользователю в базе данных.

## Причина
При OAuth авторизации (Google/GitHub) пользователь создавался в callback, но его ID не правильно передавался в JWT токен и session.

## Исправления

### 1. Улучшен `signIn` callback в `lib/next-auth.ts`
- Добавлена проверка существования пользователя по email
- При создании нового пользователя ID сохраняется в `user.id`
- При повторном входе используется существующий ID
- Добавлено логирование для отладки

### 2. Добавлена проверка пользователя в `/api/lobby` (POST)
- Проверяется существование пользователя перед созданием лобби
- Возвращается понятная ошибка если пользователь не найден
- Улучшена обработка Foreign key constraint ошибок

## Решение для Production

### Если ошибка уже возникла на Render.com:

1. **Пользователи должны выйти и войти заново**
   ```
   Это обновит JWT токен с правильным user.id из базы данных
   ```

2. **Проверить базу данных** (опционально)
   ```sql
   -- Показать пользователей без username
   SELECT id, email, username FROM "User" WHERE username IS NULL;
   
   -- Обновить username для OAuth пользователей
   UPDATE "User" 
   SET username = SPLIT_PART(email, '@', 1)
   WHERE username IS NULL AND email IS NOT NULL;
   ```

3. **Deploy обновленного кода**
   ```bash
   git add lib/next-auth.ts app/api/lobby/route.ts
   git commit -m "fix: Foreign key constraint error on lobby creation"
   git push origin main
   ```

## Тестирование

### Локально:
1. Очистить cookies браузера
2. Войти через Google/GitHub
3. Создать лобби - должно работать

### Production:
1. После deploy выйти из аккаунта
2. Войти заново
3. Попробовать создать лобби

## Дополнительные улучшения

- ✅ Добавлена проверка существования пользователя
- ✅ Улучшено логирование OAuth процесса
- ✅ Более понятные сообщения об ошибках
- ✅ Сохранение правильного ID в user object

---

**Дата:** 17.10.2025  
**Статус:** ✅ Исправлено
