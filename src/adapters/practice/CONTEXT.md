# Practice Adapter (Infrastructure Layer)

Адаптеры для генерации упражнений (реализация domain port `ExerciseGenerator`).

## Структура

```
adapters/practice/
├── index.ts                    # Factory: createExerciseGenerator()
├── llm-exercise-generator.ts   # LLMExerciseGenerator (реализация ExerciseGenerator)
└── prompts/
    ├── common.ts               # EXERCISE_RESPONSE_SCHEMA (общая схема для всех режимов)
    ├── topic-focused.ts        # TOPIC_SYSTEM_PROMPT, TOPIC_USER_PROMPT_TEMPLATE
    └── review-mixed.ts         # REVIEW_SYSTEM_PROMPT, REVIEW_USER_PROMPT_TEMPLATE, LOW_MASTERY_THRESHOLD
```

## LLMExerciseGenerator

Генерирует упражнения с помощью LLM.

**Зависимости:**
- `LLMAdapter` — для вызова LLM API
- `GrammarRepository` — для анализа прогресса пользователя (в review mode)

**Методы:**
- `generate(request)` — публичный метод, роутит в `generateTopicExercises()` или `generateReviewExercises()` по `request.mode`
- `generateTopicExercises(request)` — упражнения на одно правило
- `generateReviewExercises(request)` — упражнения на слабые зоны (анализирует UserTopicProgress)
- `parseExercises(response)` — парсинг JSON ответа LLM в Exercise[]

## Промпты

### topic-focused.ts
Упражнения на **ОДНО** правило (после теории).
- Максимум 10 упражнений (5-7 single_choice, 3-5 fill_in_blank)
- Все упражнения на одно правило

### review-mixed.ts
Упражнения на **ПОВТОРЕНИЕ** пройденных правил.
- Максимум 12 упражнений (7-9 single_choice, 3-5 fill_in_blank)
- **Равномерно покрывает ВСЕ указанные правила** (не группирует по topicId)
- Приоритет — правила с low mastery (< 70%)
- LOW_MASTERY_THRESHOLD = 70 — порог для определения слабых зон

### common.ts
`EXERCISE_RESPONSE_SCHEMA` — общая JSON Schema для всех режимов.
- Используется в `llm.chat()` для структурированного вывода
- Определяет формат ответа LLM: `{ exercises: [...] }`

## Factory Function

```typescript
export function createExerciseGenerator(grammarRepository: GrammarRepository) {
  const llm = createLLM();
  return new LLMExerciseGenerator(llm, grammarRepository);
}
```

**Важно:** `grammarRepository` передается как параметр (не создается внутри), чтобы переиспользовать экземпляр из `bot.ts`.

## Использование

В `bot.ts`:
```typescript
const grammarRepository = createGrammarRepository();
const exerciseGenerator = createExerciseGenerator(grammarRepository);
const stateMachine = createStateMachine(
  sessionRepository,
  userRepository,
  grammarRepository,
  exerciseGenerator
);
```

В `GrammarPracticeState`:
```typescript
constructor(
  private sessionRepository: SessionRepository,
  private exerciseGenerator: ExerciseGenerator
) {}

async onEnter(context) {
  const request: ExerciseGenerationRequest = {
    mode: grammarTopicId ? "topic" : "review",
    userId: user.id,
    level: profile.level,
    interests: profile.interests,
    goals: profile.goals,
    topicId: grammarTopicId,
    ruleName: grammarRule,
  };

  const exercises = await this.exerciseGenerator.generate(request);
  // ...
}
```

## Будущие адаптеры

- **CachedExerciseGenerator** — кэширует упражнения в БД/Redis
- **MockExerciseGenerator** — возвращает хардкоженные упражнения для тестов
- **ABTestExerciseGenerator** — A/B тестирует разные промпты
- **HybridExerciseGenerator** — комбинирует LLM + готовые упражнения из БД

## См. также

- `/src/domain/practice/` — domain layer (интерфейсы)
- `/src/stateMachine/states/grammarPractice/` — использование в state machine
