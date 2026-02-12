# State Machine

Управление диалоговым потоком бота. Каждое состояние пользователя — отдельный класс с lifecycle.

## Структура

```
stateMachine/
├── index.ts             # StateMachine class + createStateMachine() фабрика
├── base.ts              # State — абстрактный базовый класс (onEnter/handle/onExit)
├── types.ts             # StateHandlerContext, StateHandlerResult, StateConfig
└── states/
    ├── index.ts                  # Barrel-экспорт всех состояний
    ├── onboarding.ts             # ONBOARDING — первичный ввод, LLM-анализ профиля
    ├── mainMenu.ts               # MAIN_MENU — навигация по разделам
    ├── grammarTheory.ts          # GRAMMAR_THEORY — объяснение правил, навигация по темам
    ├── grammarPractice/          # GRAMMAR_PRACTICE — сессия упражнений
    │   ├── index.ts              # GrammarPracticeState class
    │   ├── constants.ts          # Размер сессии, сообщения
    │   └── mockedExercises.ts    # Захардкоженные упражнения (заглушка до LLM-генерации)
    ├── practiceResult.ts         # PRACTICE_RESULT — итоги сессии (X/Y правильно)
    ├── freeWriting.ts            # FREE_WRITING — свободное письмо
    ├── writingFeedback.ts        # WRITING_FEEDBACK — LLM-разбор написанного текста
    └── stats.ts                  # STATS — статистика пользователя
```

## Lifecycle состояния

Каждое состояние наследует `State` и может реализовать:
1. **`onEnter(ctx)`** — вызывается при входе (отправка приветствия, инициализация)
2. **`handle(ctx)`** — обработка сообщения/callback, возврат `{ nextState?, handled }`
3. **`onExit(ctx)`** — вызывается при выходе (очистка, сохранение)

## Переходы

`StateMachine.transition()`:
```
onExit(currentState) → setState(DB) → onEnter(newState)
```

## Контекст

`StateHandlerContext` содержит:
- `ctx` — grammY Context (Telegram API)
- `userId`, `messageText`, `callbackData`
- `currentState` — текущее состояние из enum
- `profile` — профиль пользователя (undefined в ONBOARDING)
- `grammarRule` — передается из GRAMMAR_THEORY в GRAMMAR_PRACTICE

## Зависимости

- `GrammarPracticeState` и `PracticeResultState` получают `SessionRepository` через конструктор (DI)
- Остальные состояния stateless или используют LLM напрямую
- State machine инициализируется в `bot.ts` через `createStateMachine(sessionRepository)`

## Диаграмма переходов

```
ONBOARDING → MAIN_MENU
               ├→ GRAMMAR_THEORY → GRAMMAR_PRACTICE → PRACTICE_RESULT → MAIN_MENU
               ├→ FREE_WRITING → WRITING_FEEDBACK → MAIN_MENU
               └→ STATS → MAIN_MENU
```
