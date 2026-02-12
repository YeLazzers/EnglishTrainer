# Domain Layer

Чистый доменный слой без зависимостей от инфраструктуры. Определяет бизнес-типы и контракты (порты).

## Файлы

| Файл | Назначение |
|------|-----------|
| `types.ts` | `UserState` enum (8 состояний), `UserProfile` interface, `CreateUserProfile` |
| `repository.ts` | Порт `UserRepository` — контракт доступа к данным пользователя (state + profile) |
| `session-types.ts` | `PracticeSessionData`, `Exercise`, `ExerciseType`, `CreateSessionData`, `SessionAnswer` |
| `session-repository.ts` | Порт `SessionRepository` — контракт управления практическими сессиями (CRUD + active check) |

## Принципы

- Нулевые импорты из infrastructure/adapters — только чистые типы и интерфейсы
- Порты определяют **что** нужно делать, адаптеры — **как**
- `UserRepository`: state operations (`getState`/`setState`) + profile operations (`getProfile`/`setProfile`)
- `SessionRepository`: полный цикл сессии (`create` → `update` → `complete` → `delete`)

## Зависимости

```
domain/ → ничего (корень графа зависимостей)
adapters/ → domain/ (реализуют порты)
stateMachine/ → domain/ (используют типы и порты)
```
