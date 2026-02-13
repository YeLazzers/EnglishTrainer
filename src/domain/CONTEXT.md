# Domain Layer

Чистый доменный слой без зависимостей от инфраструктуры. Определяет бизнес-типы и контракты (порты).

## Структура

```
domain/
├── types.ts              # UserState enum, @legacy UserProfile/CreateUserProfile
├── repository.ts         # @legacy UserRepository (TestUserState/TestUserProfile)
├── session-types.ts      # PracticeSessionData, Exercise, ExerciseType, etc.
├── session-repository.ts # Порт SessionRepository (Redis-сессии)
│
└── user/                 # Домен пользователя (таблицы user + user_profile)
    ├── index.ts           # Barrel export
    ├── types.ts           # User, CreateUser, UserProfile, CreateUserProfile
    └── repository.ts      # Порт UserRepository
```

## user/ — домен пользователя

Работает с новыми таблицами `user` и `user_profile` (заменяет legacy `TestUserState`/`TestUserProfile`).

**Типы:**
- `User` — полная запись пользователя (Telegram-данные + state + timestamps)
- `CreateUser` — данные для создания/обновления (без state и timestamps)
- `UserProfile` — профиль обучения (level, goals, interests, rawResponse)
- `CreateUserProfile` — данные для создания/обновления профиля

**Порт `UserRepository`:**
- `findById` / `upsert` — CRUD пользователя
- `getState` / `setState` — управление состоянием диалога
- `getProfile` / `setProfile` — управление профилем обучения

## Legacy

Файлы `types.ts` (UserProfile, CreateUserProfile) и `repository.ts` — помечены `@legacy`.
Работают с таблицами `TestUserState`/`TestUserProfile`. Для нового кода использовать `user/`.

## Общие файлы

| Файл | Назначение |
|------|-----------|
| `types.ts` | `UserState` enum (8 состояний) — используется всеми модулями |
| `session-types.ts` | `PracticeSessionData`, `Exercise`, `ExerciseType`, `CreateSessionData`, `SessionAnswer` |
| `session-repository.ts` | Порт `SessionRepository` — контракт управления практическими сессиями (CRUD + active check) |

## Принципы

- Нулевые импорты из infrastructure/adapters — только чистые типы и интерфейсы
- Порты определяют **что** нужно делать, адаптеры — **как**
- `SessionRepository`: полный цикл сессии (`create` → `update` → `complete` → `delete`)

## Зависимости

```
domain/ → ничего (корень графа зависимостей)
domain/user/ → domain/types.ts (импортирует UserState)
adapters/ → domain/ (реализуют порты)
stateMachine/ → domain/ (используют типы и порты)
```
