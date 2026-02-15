# State Machine

Управление диалоговым потоком бота. Каждое состояние пользователя — отдельный класс с lifecycle.

## Структура

```
stateMachine/
├── index.ts             # StateMachine class + createStateMachine() фабрика
├── base.ts              # State — абстрактный базовый класс (onEnter/handle/onExit)
├── types.ts             # StateHandlerContext, StateHandlerResult, StateConfig
├── helpers/
│   └── limitCheck.ts    # checkAndNotifyLimit() — универсальная проверка лимитов
└── states/
    ├── index.ts                  # Barrel-экспорт всех состояний
    ├── onboarding/               # ONBOARDING — первичный ввод, LLM-анализ профиля
    │   ├── index.ts              # OnboardingState class
    │   └── constants.ts          # Welcome/system/response messages
    ├── mainMenu.ts               # MAIN_MENU — навигация по разделам
    ├── grammarTheory/            # GRAMMAR_THEORY — объяснение правил + проверка лимитов
    │   ├── index.ts              # GrammarTheoryState class
    │   ├── constants.ts          # Промпты, схемы, клавиатуры
    │   ├── utils.ts              # sanitizeLLMResponse(), getModeInstruction()
    │   └── mocks.ts              # Моковые ответы для тестирования
    ├── grammarPractice/          # GRAMMAR_PRACTICE — сессия упражнений + проверка лимитов
    │   ├── index.ts              # GrammarPracticeState class
    │   ├── constants.ts          # Размер сессии, сообщения, клавиатуры
    │   └── mockedExercises.ts    # Захардкоженные упражнения (заглушка до LLM-генерации)
    ├── practiceResult.ts         # PRACTICE_RESULT — итоги сессии (X/Y правильно)
    ├── freeWriting.ts            # FREE_WRITING — свободное письмо + проверка лимитов
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
- `user` — объект User (`@domain/user/types`), содержит `id`, `state` и метаданные Telegram
- `messageText`, `callbackData`
- `profile` — профиль обучения UserProfile (`@domain/user/types`), undefined в ONBOARDING
- `grammarRule` — передается из GRAMMAR_THEORY в GRAMMAR_PRACTICE

Доступ: `context.user.id` (ID пользователя), `context.user.state` (текущее состояние).
Объект User загружается один раз в entry point (handler/command) и передаётся в StateMachine.

## Helpers

### `helpers/limitCheck.ts`
Универсальный helper для проверки лимитов и уведомления пользователей:

```typescript
async function checkAndNotifyLimit(
  ctx: Context,
  userId: number,
  requestType: RequestType,
  limitRepository: LimitRepository,
  replyKeyboard?: Keyboard
): Promise<boolean>
```

**Что делает:**
1. Проверяет лимит через `limitRepository.checkLimit()`
2. Если лимит исчерпан — отправляет пользователю сообщение через `switch`:
   - `TOTAL_LIMIT_REACHED` — дневной лимит исчерпан (10/10)
   - `THEORY_LIMIT_REACHED` — лимит теории исчерпан (5/5), предлагает практику
3. Возвращает `true` если запрос разрешён, `false` если отклонён

**Используется в:**
- `GrammarTheoryState` — перед запросом LLM для генерации теории
- `GrammarPracticeState` — перед генерацией упражнений
- `FreeWritingState` — перед переходом в WRITING_FEEDBACK

**Паттерн использования:**
```typescript
const limitAllowed = await checkAndNotifyLimit(
  ctx,
  user.id,
  RequestType.THEORY,
  this.limitRepository,
  GRAMMAR_THEORY_REPLY_KEYBOARD
);

if (!limitAllowed) {
  return; // Уведомление уже отправлено helper'ом
}

// Продолжаем выполнение запроса...
```

## Зависимости

States получают репозитории через конструктор (Dependency Injection):

- **`GrammarTheoryState`**: `GrammarRepository`, `LimitRepository`
- **`GrammarPracticeState`**: `SessionRepository`, `ExerciseGenerator`, `LimitRepository`
- **`PracticeResultState`**: `SessionRepository`, `GrammarRepository`
- **`FreeWritingState`**: `LimitRepository`
- **`MainMenuState`**: `GrammarRepository` (для отображения статистики)
- **`OnboardingState`**: `UserRepository`

State machine инициализируется в `bot.ts`:
```typescript
createStateMachine(
  sessionRepository,
  userRepository,
  grammarRepository,
  exerciseGenerator,
  limitRepository
)
```

## Диаграмма переходов

```
ONBOARDING → MAIN_MENU
               ├→ GRAMMAR_THEORY → GRAMMAR_PRACTICE → PRACTICE_RESULT → MAIN_MENU
               ├→ FREE_WRITING → WRITING_FEEDBACK → MAIN_MENU
               └→ STATS → MAIN_MENU
```
