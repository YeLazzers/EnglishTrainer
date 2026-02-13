# Adapters Layer

Инфраструктурные реализации доменных портов. Каждый адаптер удовлетворяет интерфейс из `domain/`.

## Структура

```
adapters/
├── db/                        # SQLite + Prisma (постоянное хранение)
│   ├── index.ts               # @legacy Фабрика createUserRepository()
│   ├── prisma.ts              # @legacy PrismaUserRepository (TestUserState/TestUserProfile)
│   ├── mappers.ts             # @legacy DB ↔ Domain маппинг
│   │
│   └── user/                  # Адаптер домена user (таблицы user + user_profile)
│       ├── index.ts           # Фабрика createUserRepository(), ре-экспорты
│       ├── prisma-repository.ts # PrismaUserRepository implements UserRepository
│       └── mappers.ts         # DB ↔ Domain трансформации типов
│
└── session/                   # Redis (временный кэш сессий)
    ├── index.ts               # Фабрика createSessionRepository(), ре-экспорты
    ├── redis.ts               # createRedisClient() — подключение к Redis с reconnect
    ├── redis-repository.ts    # RedisSessionRepository implements SessionRepository
    ├── mappers.ts             # JSON-сериализация с обработкой Date
    └── mocks.ts               # Мок-данные для тестирования/отладки
```

## Паттерн

Каждый подмодуль следует одинаковой структуре:
1. **`index.ts`** — фабричная функция + ре-экспорты типов
2. **Реализация** — класс, имплементирующий доменный порт
3. **Вспомогательные файлы** — mappers, клиенты, моки

## db/user/ — User + UserProfile (новый)

- `PrismaUserRepository` реализует `domain/user/UserRepository`
- Работает с таблицами `user` и `user_profile`
- Принимает `PrismaClient` через конструктор (DI, позволяет шарить клиент)
- Операции: `findById`, `upsert`, `getState`, `setState`, `getProfile`, `setProfile`
- Маппинг: Prisma-типы `User`/`UserProfile` ↔ доменные типы из `domain/user`
- JSON parse/stringify для `goals` и `interests` (массивы в домене, строки в БД)

## db/ — Legacy (TestUserState/TestUserProfile)

- @legacy — помечены для замены, работают со старыми тестовыми таблицами
- `PrismaUserRepository` реализует `domain/repository/UserRepository`
- Маппинг между Prisma-моделями (`TestUserState`, `TestUserProfile`) и доменными типами
- Используется через фасад `state.ts` в корне src/
- Для нового кода использовать `db/user/`

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
Legacy `createUserRepository()` вызывается внутри `state.ts` (фасад).
