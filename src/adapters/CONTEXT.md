# Adapters Layer

Инфраструктурные реализации доменных портов. Каждый адаптер удовлетворяет интерфейс из `domain/`.

## Структура

```
adapters/
├── db/                    # SQLite + Prisma (постоянное хранение)
│   ├── index.ts           # Фабрика createUserRepository(), ре-экспорты
│   ├── prisma.ts          # PrismaUserRepository implements UserRepository
│   └── mappers.ts         # DB ↔ Domain трансформации типов
│
└── session/               # Redis (временный кэш сессий)
    ├── index.ts           # Фабрика createSessionRepository(), ре-экспорты
    ├── redis.ts           # createRedisClient() — подключение к Redis с reconnect
    ├── redis-repository.ts # RedisSessionRepository implements SessionRepository
    ├── mappers.ts         # JSON-сериализация с обработкой Date
    └── mocks.ts           # Мок-данные для тестирования/отладки
```

## Паттерн

Каждый подмодуль следует одинаковой структуре:
1. **`index.ts`** — фабричная функция + ре-экспорты типов
2. **Реализация** — класс, имплементирующий доменный порт
3. **Вспомогательные файлы** — mappers, клиенты, моки

## db/ — SQLite/Prisma

- `PrismaUserRepository` реализует `UserRepository`
- Хранит: состояние пользователя (`UserState`), профиль (`UserProfile`)
- Маппинг между Prisma-моделями (`TestUserState`, `TestUserProfile`) и доменными типами
- Используется через фасад `state.ts` в корне src/

## session/ — Redis

- `RedisSessionRepository` реализует `SessionRepository`
- Хранит: активные практические сессии (TTL 24h)
- Ключи: `session:{userId}` → JSON-сериализованная `PracticeSessionData`
- Redis запускается через Docker (`docker-compose.yml`)
- Требует `REDIS_URL` в `.env`

## Инициализация

Обе фабрики вызываются один раз в `bot.ts`:
```
const sessionRepository = createSessionRepository()  // Redis
const stateMachine = createStateMachine(sessionRepository)
```
`createUserRepository()` вызывается внутри `state.ts` (фасад).
