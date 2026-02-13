# Practice Module (Domain Layer)

Доменная логика для генерации упражнений.

## Структура

```
domain/practice/
├── types.ts                # ExerciseGenerationRequest, ExerciseGenerationMode
└── exercise-generator.ts   # ExerciseGenerator interface (domain port)
```

## Назначение

Модуль определяет доменную логику для генерации упражнений:
- `ExerciseGenerator` — domain port (интерфейс) для генерации упражнений
- `ExerciseGenerationRequest` — запрос на генерацию (mode, userId, level, interests, goals, topicId, ruleName)
- `ExerciseGenerationMode` — режим генерации (`"topic"` | `"review"` | `"adaptive"`)

## Режимы генерации

### topic
Упражнения на **конкретное правило** (после изучения теории).
- Используется: GRAMMAR_THEORY → GRAMMAR_PRACTICE
- Параметры: `topicId`, `ruleName`
- Промпт: `/src/adapters/practice/prompts/topic-focused.ts`

### review
Упражнения на **повторение пройденных правил** с приоритетом слабых зон.
- Используется: MAIN_MENU → GRAMMAR_PRACTICE
- Анализирует прогресс пользователя через GrammarRepository
- Выбирает топики с low mastery (< 70%) или непрактикованные
- Промпт: `/src/adapters/practice/prompts/review-mixed.ts`

### adaptive (будущее)
Смесь новых правил и повторений (70% новые, 30% слабые зоны).

## Зависимости

### Не зависит от
- Инфраструктуры (LLM, БД)
- State machine
- UI (Telegram keyboards)

### Зависит от
- `@domain/session-types` (Exercise, ExerciseType) — используется в возвращаемом значении

## Адаптеры

Реализация интерфейса `ExerciseGenerator`:
- **LLMExerciseGenerator** (`/src/adapters/practice/llm-exercise-generator.ts`) — генерация через LLM
- В будущем: CachedExerciseGenerator, MockExerciseGenerator, ABTestExerciseGenerator

## Использование

```typescript
import { ExerciseGenerator } from "@domain/practice/exercise-generator";
import { ExerciseGenerationRequest } from "@domain/practice/types";

const generator: ExerciseGenerator = ...;

const request: ExerciseGenerationRequest = {
  mode: "review",
  userId: 123,
  level: "B1",
  interests: ["tech", "travel"],
  goals: ["speaking", "business"],
};

const exercises = await generator.generate(request);
```

## См. также

- `/src/adapters/practice/` — adapter implementations
- `/src/stateMachine/states/grammarPractice/` — использование в state machine
