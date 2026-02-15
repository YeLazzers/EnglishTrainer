# Domain / Limits — Context

## Назначение модуля
Доменная логика управления дневными лимитами запросов для freemium монетизации.

## Что внутри

### `types.ts` — Типы и перечисления
- **`RequestType`** — тип запроса к LLM:
  - `THEORY` — запрос теории грамматики (ограничен 50% от общего лимита)
  - `PRACTICE` — генерация упражнений
  - `FREE_WRITING` — анализ свободного письма

- **`DailyLimits`** — структура лимитов пользователя:
  - `total: number` — общий дневной лимит
  - `maxTheory: number` — максимум запросов теории (обычно 50% от total)

- **`UsageStats`** — статистика использования за день:
  - `userId`, `date` — идентификация
  - `totalUsed` — всего запросов использовано
  - `theoryUsed`, `practiceUsed`, `freeWritingUsed` — разбивка по типам

- **`LimitCheckResult`** — результат проверки лимита:
  - `allowed: boolean` — разрешён ли запрос
  - `reason?: 'TOTAL_LIMIT_REACHED' | 'THEORY_LIMIT_REACHED'` — причина отказа
  - `currentUsage: UsageStats` — текущая статистика
  - `limits: DailyLimits` — действующие лимиты

### `repository.ts` — Порт (интерфейс)
Определяет контракт для работы с лимитами:

```typescript
interface LimitRepository {
  // Проверить, разрешён ли запрос для пользователя
  checkLimit(userId: number, requestType: RequestType): Promise<LimitCheckResult>;

  // Инкрементировать счётчик после успешного запроса
  incrementUsage(userId: number, requestType: RequestType): Promise<UsageStats>;

  // Получить текущую статистику использования
  getUsage(userId: number): Promise<UsageStats>;

  // Сбросить лимиты (для тестирования)
  resetUsage(userId: number): Promise<void>;
}
```

## Текущие лимиты (FREE tier)
- **Общий лимит:** 10 запросов/день
- **Лимит теории:** 5 запросов/день (50% от общего)
- **Практика и письмо:** без отдельных лимитов, только общий

## Как это работает

### Проверка лимита
1. State вызывает `checkLimit(userId, requestType)` перед LLM запросом
2. Репозиторий проверяет текущее использование
3. Сравнивает с лимитами (сначала общий, потом специфичный для теории)
4. Возвращает результат с `allowed: true/false` и `reason` если отказ

### Инкрементирование
1. State вызывает `incrementUsage(userId, requestType)` ПОСЛЕ успешного LLM запроса
2. Репозиторий увеличивает счётчики (total + специфичный для типа)
3. Возвращает обновлённую статистику

### Паттерн использования в states
```typescript
// 1. Проверить лимит ПЕРЕД запросом
const allowed = await checkAndNotifyLimit(ctx, userId, RequestType.THEORY, limitRepository);
if (!allowed) return;

// 2. Выполнить LLM запрос
const response = await llm.chat(...);

// 3. Инкрементировать ПОСЛЕ успешного запроса
await limitRepository.incrementUsage(userId, RequestType.THEORY);
```

## Реализация
Адаптер: `/src/adapters/limits` — Redis с TTL до конца дня (автосброс в 00:00 UTC)

## Интеграция
- **State Machine:** проверка лимитов через helper `checkAndNotifyLimit()` в GrammarTheoryState, GrammarPracticeState, FreeWritingState
- **MainMenuState:** отображение оставшихся лимитов при входе
- **Debug команда:** `/debug_limits` для просмотра и сброса лимитов

## Связи
- Используется в: State Machine states (через DI)
- Зависит от: нет зависимостей (чистая доменная логика)
- Реализовано через: RedisLimitRepository (адаптер)
