# Commands

Обработчики Telegram-команд (`/start`, `/debug`, `/debug_redis`).

## Файлы

| Файл | Команда | Назначение |
|------|---------|-----------|
| `start.ts` | `/start` | Онбординг нового пользователя или возврат в MAIN_MENU для существующего |
| `debug.ts` | `/debug` | Показать текущее состояние и профиль пользователя (отладка) |
| `debugRedis.ts` | `/debug_redis` | Показать активную Redis-сессию пользователя (отладка) |

## Паттерн

Команды используют фабричный паттерн для DI:
```ts
// start.ts — получает StateMachine
export function createStartCommand(stateMachine: StateMachine) {
  return async (ctx: Context) => { ... }
}

// debugRedis.ts — получает SessionRepository
export function createDebugRedisCommand(sessionRepository: SessionRepository) {
  return async (ctx: Context) => { ... }
}
```

Исключение: `debug.ts` экспортирует прямую функцию (не нуждается в DI).

## Регистрация

Все команды регистрируются в `bot.ts`:
```ts
bot.command("start", createStartCommand(stateMachine))
bot.command("debug", debugCommand)
bot.command("debug_redis", createDebugRedisCommand(sessionRepository))
```
