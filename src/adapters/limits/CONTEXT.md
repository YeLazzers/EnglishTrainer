# Adapters / Limits — Context

## Назначение модуля
Redis-адаптер для управления дневными лимитами с автоматическим сбросом в 00:00 UTC через TTL.

## Что внутри

### `index.ts` — Factory
```typescript
export function createLimitRepository(): LimitRepository
```
- Создаёт Redis клиент (переиспользует из `/adapters/session/redis`)
- Возвращает инстанс RedisLimitRepository
- Re-export типов для удобства

### `redis-repository.ts` — Реализация
```typescript
class RedisLimitRepository implements LimitRepository
```

**Константы:**
```typescript
const DEFAULT_LIMITS: DailyLimits = {
  total: 10,      // Общий дневной лимит
  maxTheory: 5,   // 50% от общего для теории
};
```

**Ключевая логика:**

#### Redis key pattern
```
limits:{userId}:{YYYY-MM-DD}
```
Пример: `limits:123456:2026-02-15`

#### Автоматический сброс через TTL
```typescript
private getTTLUntilEndOfDay(): number {
  // Вычисляет секунды до 00:00 UTC следующего дня
  const endOfDay = new Date(UTC(...tomorrow, 0, 0, 0, 0));
  return Math.ceil((endOfDay - now) / 1000);
}
```

При каждом `incrementUsage()` устанавливается TTL:
```typescript
await client.setex(key, ttl, JSON.stringify(usage));
```

Redis автоматически удалит ключ в 00:00 UTC → лимиты сбрасываются.

#### Хранение данных
Формат JSON в Redis:
```json
{
  "totalUsed": 3,
  "theoryUsed": 2,
  "practiceUsed": 1,
  "freeWritingUsed": 0
}
```

#### Методы

**`checkLimit(userId, requestType)`**
1. Получает текущее использование из Redis
2. Проверяет общий лимит: `totalUsed >= DEFAULT_LIMITS.total`
3. Для THEORY проверяет специфичный: `theoryUsed >= DEFAULT_LIMITS.maxTheory`
4. Возвращает `LimitCheckResult` с `allowed` и `reason`

**`incrementUsage(userId, requestType)`**
1. Получает текущее использование
2. Инкрементирует `totalUsed` + соответствующий счётчик (theoryUsed/practiceUsed/freeWritingUsed)
3. Сохраняет в Redis с TTL до конца дня
4. Логирует в консоль: `[Limits] User 123 usage: 3 total (2 theory, 1 practice, 0 writing), TTL: 14523s`

**`getUsage(userId)`**
1. Читает данные из Redis по ключу `limits:{userId}:{date}`
2. Если ключ не существует (первый запрос дня или после сброса) → возвращает нули
3. Парсит JSON, обрабатывает ошибки парсинга

**`resetUsage(userId)`**
1. Удаляет ключ из Redis: `client.del(key)`
2. Используется для тестирования и debug команды `/debug_limits reset`

## Преимущества архитектуры

### TTL вместо cron/scheduler
- ✅ Не нужен отдельный процесс для сброса лимитов
- ✅ Redis гарантирует точное время удаления ключа
- ✅ Автоматический cleanup старых данных

### Отдельные счётчики по типам
- ✅ Можно вводить разные лимиты для разных типов запросов
- ✅ Детальная статистика использования
- ✅ Гибкость для будущих tier'ов (FREE/PREMIUM)

### Независимость от session repository
- ✅ Использует тот же Redis клиент, но независимые ключи
- ✅ Можно масштабировать отдельно (если понадобится)

## Интеграция

### Bot initialization (bot.ts)
```typescript
const limitRepository = createLimitRepository();
const stateMachine = createStateMachine(..., limitRepository);
```

### State Machine (через DI)
```typescript
class GrammarTheoryState {
  constructor(private limitRepository: LimitRepository) {}
}
```

### Debug команда
```typescript
bot.command("debug_limits", createDebugLimitsCommand(limitRepository));
```

## Мониторинг и отладка

### Логи
Каждый `incrementUsage()` пишет в консоль:
```
[Limits] User 123456 usage: 5 total (3 theory, 2 practice, 0 writing), TTL: 12345s
```

### Debug команда
- `/debug_limits` — показать текущее использование
- `/debug_limits reset` — сбросить лимиты для тестирования

### Redis ключи
Проверка вручную:
```bash
redis-cli
> KEYS limits:*
> GET limits:123456:2026-02-15
> TTL limits:123456:2026-02-15
```

## Будущие улучшения
- [ ] Поддержка разных tier'ов (FREE/PREMIUM) через lookup tier пользователя
- [ ] Metrics/аналитика использования лимитов
- [ ] Rate limiting (не только дневные лимиты, но и per-hour/per-minute)
- [ ] Grace period для premium users
