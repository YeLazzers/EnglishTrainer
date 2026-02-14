# Writing Mechanic — Free Writing Practice

> Методика и техническая реализация механики "Свободное письмо" для тренировки навыка Writing.
> Основана на CEFR-критериях оценки письма, автоматизированном анализе текста и интеграции с прогрессом по грамматике.

---

## 1. Overview

### Цель механики
- Дать пользователю практику свободного письма на английском
- Получить развернутую обратную связь от LLM по качеству текста
- Связать результаты анализа с прогрессом по грамматическим темам
- Выявить слабые зоны для дальнейшей практики

### Отличие от "Практики грамматики"
| Аспект | Практика грамматики | Свободное письмо |
|--------|---------------------|------------------|
| Формат | Упражнения с заданной структурой (fill-in, multiple choice) | Свободный текст на заданную или произвольную тему |
| Фокус | Конкретное грамматическое правило | Комплексное применение знаний |
| Оценка | Точный матчинг (правильно/неправильно) | Качественный анализ LLM |
| Результат | Прогресс по конкретному топику | Прогресс по нескольким топикам + общая оценка Writing |

### Текущая реализация в коде
**Статус:** Стейты созданы, функционал не реализован (TODO)
- `FREE_WRITING` стейт — инициирует сессию письма, предлагает тему
- `WRITING_FEEDBACK` стейт — получает текст, отправляет на анализ, показывает фидбэк

---

## 2. CEFR Writing Genres and Task Types

> **Примечание для MVP:** Эти жанры используются в официальных CEFR-экзаменах. Мы их **документируем**, но **не используем** на начальном этапе. В MVP пользователь пишет на свободную тему, жанр определяется автоматически или игнорируется.

### Официальные письменные жанры CEFR

Согласно [CEFR Grid for Writing Tasks](https://www.eaquals.org/wp-content/uploads/English-samples-Cambridge.pdf), официальные экзамены используют следующие жанры:

| Жанр | Описание | Типичный уровень |
|------|----------|------------------|
| **Email/Letter (personal)** | Неформальное письмо другу, знакомому | A2-B1 |
| **Email/Letter (business)** | Формальное письмо, запрос, жалоба | B1-B2 |
| **Essay** | Аргументативное эссе с тезисом и примерами | B2-C1 |
| **Article** | Статья для журнала/блога с личным мнением | B2-C1 |
| **Review** | Обзор книги, фильма, ресторана, продукта | B1-B2 |
| **Report** | Формальный отчет с фактами и рекомендациями | B2-C1 |
| **Proposal** | Предложение с планом действий | C1 |
| **Story** | Нарративный текст, история | A2-B1 |

### Риторические функции (Rhetorical Functions)

Любой текст может включать следующие функции (не зависят от жанра):
- Describing (events, processes)
- Narrating
- Explaining / Demonstrating
- Arguing / Persuading
- Comparing and Contrasting
- Giving opinions
- Making complaints / Suggesting
- Evaluating / Reviewing

### Решение для MVP
- **Не предлагаем жанр явно** — пользователь пишет свободно
- LLM определяет жанр автоматически (если нужно для анализа)
- В будущем можно добавить выбор жанра для целевой практики

---

## 3. CEFR Writing Assessment Criteria

Согласно [CEFR assessment guidelines](https://rm.coe.int/assessing-cefr-level/1680a9178c) и [Cambridge assessment frameworks](https://teachtravelbudget.com/wp-content/uploads/2019/10/b2-cambridge-english-assessing-writing-performance.pdf), письмо оценивается по **шести основным категориям**:

### 3.1 Task Achievement (Соответствие задаче)
- Выполнена ли поставленная задача?
- Достаточен ли объем текста?
- Раскрыты ли все аспекты темы?

**Для нас:** В MVP не критично (нет строгой задачи). В будущем — если предложим конкретное задание.

### 3.2 Appropriacy (Соответствие стилю и контексту)
- Подходит ли регистр речи (формальный/неформальный)?
- Соответствует ли тон аудитории?

**Для нас:** LLM может отметить, если текст слишком неформальный для деловой темы (но не критично для MVP).

### 3.3 Coherence (Связность)
- Логична ли структура текста?
- Есть ли четкое введение, основная часть, заключение?
- Понятна ли общая идея?

**Для нас:** LLM оценивает структуру и логику текста.

### 3.4 Cohesion (Сцепленность)
- Используются ли cohesive devices (linking words: however, therefore, in addition)?
- Правильно ли используются местоимения и референции?
- Естественны ли переходы между предложениями?

**Для нас:** LLM анализирует использование linking words и cohesion.

### 3.5 Grammatical Range and Accuracy (Грамматика)
- **Range:** Разнообразие грамматических структур (простые/сложные предложения, разные времена)
- **Accuracy:** Правильность использования грамматики

**Для нас:** ⭐ **Это ключевая метрика для MVP.** LLM детектирует грамматические ошибки и связывает их с топиками из каталога грамматики.

### 3.6 Lexical Range and Accuracy (Вокабуляр)
- **Range:** Разнообразие словарного запаса (синонимы, идиомы, collocations)
- **Accuracy:** Правильность употребления слов (word choice, collocations)

**Для нас:** 🔮 **Для будущих версий.** Сейчас LLM может упомянуть лексические ошибки, но не связываем с прогрессом (пока нет каталога вокабуляра).

---

## 4. Text Analysis Metrics

Для автоматизированной оценки сложности и качества текста используются метрики, основанные на лингвистике. Согласно [исследованиям CEFR text complexity](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/aligning-linguistic-complexity-with-the-difficulty-of-english-texts-for-l2-learners-based-on-cefr-levels/DB604DB02A205F0F172D6024137CBFE8) и [lexical complexity analysis](https://www.researchgate.net/publication/373649831_Lexical_Complexity_and_Language_Proficiency_An_Investigation_of_Indices_Across_CEFR_Levels):

### 4.1 Lexical Diversity (Лексическое разнообразие)
**Определение:** Разнообразие уникальных слов в тексте.

**Метрики:**
- **Type-Token Ratio (TTR):** `unique_words / total_words`
  - Проблема: зависит от длины текста
- **Moving-Average Type-Token Ratio (MATTR):** скользящее среднее TTR
- **Measure of Textual Lexical Diversity (MTLD):** более стабильная метрика

**Применение:**
- Высокое разнообразие → более сложный и богатый текст (B2-C1)
- Низкое разнообразие → много повторов, простой язык (A1-A2)

**Для нас:** LLM может оценить лексическое разнообразие качественно ("You used varied vocabulary" или "Try to avoid repeating the same words").

### 4.2 Lexical Sophistication (Сложность вокабуляра)
**Определение:** Используются ли редкие/продвинутые слова или только частотные (high-frequency).

**Метрики:**
- **Доля редких слов** (слова вне топ-2000 самых частых)
- **Средний CEFR-уровень слов** (согласно English Vocabulary Profile)

**Для нас:** LLM может отметить использование advanced vocabulary (для B2+ пользователей).

### 4.3 Syntactic Complexity (Синтаксическая сложность)
**Определение:** Насколько сложные грамматические конструкции.

**Метрики:**
- **Средняя длина предложения** (в словах)
- **Clauses per sentence** (количество придаточных предложений)
- **Passive constructions, relative clauses, conditionals**

**Для нас:** LLM анализирует использование сложных конструкций и соотносит с уровнем пользователя.

### 4.4 Readability (Читабельность)
**Определение:** Насколько текст легко читать.

**Метрики:**
- **Flesch-Kincaid Reading Ease**
- **Flesch-Kincaid Grade Level**

**Для нас:** Можно использовать как вспомогательную метрику, но не критично для MVP.

---

## 5. Grammar Error Taxonomy

Для связи анализа письма с грамматическим прогрессом нужна **таксономия ошибок**. Согласно [исследованиям grammar error classification](https://nlp.fi.muni.cz/raslan/2009/papers/6.pdf) и [linguistic error taxonomy](https://www.researchgate.net/figure/The-Classification-of-Error-Types-Based-on-the-Linguistic-Category-Taxonomy_tbl5_358776020):

### 5.1 Основные категории ошибок

| Тип ошибки | Описание | Пример |
|------------|----------|--------|
| **Omission** | Пропущен обязательный элемент | "She \_\_\_ a teacher" (пропущен *is*) |
| **Addition** | Лишний элемент | "She is *a* very good" (лишний артикль) |
| **Misformation** | Неправильная форма слова | "He go*es* to school yesterday" (должно быть *went*) |
| **Misordering** | Неправильный порядок слов | "I always am happy" (должно быть *I am always happy*) |

### 5.2 Грамматические категории ошибок

Согласно [ATA Error Categories](https://www.atanet.org/certification/how-the-exam-is-graded/error-categories/) и [EFL error analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC11539313/):

#### **1. Tense/Aspect Errors (Ошибки времен)**
- Неправильное время глагола
- Путаница Perfect vs Simple
- Неправильное использование Continuous

**Связь с каталогом:** Мапим на топики `PRESENT_SIMPLE`, `PAST_SIMPLE`, `PRESENT_PERFECT`, etc.

#### **2. Subject-Verb Agreement (Согласование подлежащего и сказуемого)**
- "He go" вместо "He goes"
- "They was" вместо "They were"

**Связь с каталогом:** Мапим на топик `SUBJECT_VERB_AGREEMENT` (внутри категории TENSES или QUESTIONS)

#### **3. Articles and Determiners (Артикли и детерминативы)**
- Пропуск артикля: "I am \_\_\_ student"
- Лишний артикль: "The life is beautiful"
- Неправильный выбор a/an/the

**Связь с каталогом:** Мапим на топики `ARTICLES`, `QUANTIFIERS`

#### **4. Prepositions (Предлоги)**
- "I am good in English" вместо "at English"
- "Depends of" вместо "depends on"

**Связь с каталогом:** Мапим на топик `PREPOSITIONS`

#### **5. Modal Verbs (Модальные глаголы)**
- "He can to swim" (лишний *to*)
- "He must goes" (неправильная форма)

**Связь с каталогом:** Мапим на топики `CAN_COULD`, `MUST_HAVE_TO`, etc.

#### **6. Passive Voice (Страдательный залог)**
- Неправильная конструкция пассива
- Путаница Active/Passive

**Связь с каталогом:** Мапим на топик `PASSIVE_VOICE`

#### **7. Word Order (Порядок слов)**
- "I always am happy"
- "What you are doing?"

**Связь с каталогом:** Мапим на топики `QUESTIONS`, `ADVERB_POSITION`

#### **8. Conditionals (Условные предложения)**
- "If I will have time, I will come" (должно быть *If I have*)

**Связь с каталогом:** Мапим на топики `ZERO_CONDITIONAL`, `FIRST_CONDITIONAL`, etc.

#### **9. Relative Clauses (Придаточные предложения)**
- "The man which I saw" (должно быть *who*)
- Неправильное использование who/which/that

**Связь с каталогом:** Мапим на топик `RELATIVE_CLAUSES`

#### **10. Gerund vs Infinitive (Герундий vs инфинитив)**
- "I enjoy to read" (должно быть *reading*)
- "I want going" (должно быть *to go*)

**Связь с каталогом:** Мапим на топик `GERUND_INFINITIVE`

### 5.3 Severity of Errors (Серьезность ошибок)

Согласно [Communicative Effect Taxonomy](https://ijels.com/upload_document/issue_files/22IJELS-11220237-AnError.pdf):

- **Local Errors** (~57%): Не мешают пониманию (артикли, предлоги, мелкие ошибки)
- **Global Errors** (~43%): Затрудняют понимание (неправильное время, порядок слов, пропуск глагола)

**Для нас:** LLM может отмечать критичность ошибки (critical / minor).

---

## 6. LLM Evaluation Framework

### 6.1 Что LLM должен анализировать

**Обязательно (MVP):**
1. **Grammar errors** — детектировать ошибки и классифицировать по типам (см. §5.2)
2. **Mapping to topics** — связать каждую ошибку с топиком из каталога грамматики
3. **Positive feedback** — что сделано хорошо (использованы сложные конструкции, разнообразие времен)
4. **Recommendations** — какие топики нужно повторить

**Опционально (Post-MVP):**
5. **Vocabulary analysis** — лексические ошибки, word choice, collocations
6. **Coherence & Cohesion** — структура текста, linking words
7. **Text complexity score** — оценка сложности текста (соответствует ли уровню пользователя)

### 6.2 Промпт-стратегия для LLM

**Вход:**
- Текст пользователя
- CEFR-уровень пользователя (из профиля)
- Список грамматических топиков из каталога (для маппинга)

**Выход (structured JSON):**
```json
{
  "overall_score": 75,  // 0-100
  "cefr_level_estimate": "B1",  // Оценочный уровень текста
  "grammar_errors": [
    {
      "sentence": "He go to school yesterday.",
      "error": "go",
      "correction": "went",
      "error_type": "MISFORMATION",
      "topic_id": "PAST_SIMPLE",
      "severity": "critical",
      "explanation": "Past Simple requires 'went', not 'go'."
    },
    {
      "sentence": "I am good in English.",
      "error": "in",
      "correction": "at",
      "error_type": "MISFORMATION",
      "topic_id": "PREPOSITIONS",
      "severity": "minor",
      "explanation": "Use 'good at' for skills."
    }
  ],
  "strengths": [
    "Used varied vocabulary",
    "Good use of Present Perfect in sentence 3"
  ],
  "weaknesses": [
    "Inconsistent tense usage (mixing past and present)",
    "Several preposition errors"
  ],
  "recommendations": [
    {
      "topic_id": "PAST_SIMPLE",
      "reason": "Multiple errors in past tense forms"
    },
    {
      "topic_id": "PREPOSITIONS",
      "reason": "Dependent prepositions need practice"
    }
  ],
  "text_complexity": {
    "lexical_diversity": "medium",
    "syntactic_complexity": "low",
    "readability": "easy"
  }
}
```

### 6.3 Fallback-стратегия

Если LLM не может замапить ошибку на конкретный топик:
- `topic_id: "UNKNOWN"` или `null`
- Все равно показываем ошибку пользователю
- Не обновляем прогресс по топикам (только общий счетчик Writing практики)

---

## 7. Integration with Progress Tracking

### 7.1 Текущая модель данных

**Существующая таблица:**
```prisma
model UserTopicProgress {
  userId          Int
  topicId         String
  exposed         Boolean   // Было ли показано правило
  practiceCount   Int       // Количество практических сессий
  correctCount    Int       // Правильных ответов
  totalCount      Int       // Всего ответов
  mastery         Int       // 0-100
  lastPracticedAt DateTime?
}
```

**Проблема:** Эта модель заточена под упражнения (correctCount/totalCount). Для свободного письма нет "правильных ответов".

### 7.2 Как обновлять прогресс после анализа текста

**Вариант А: Использовать существующую модель (проще для MVP)**
- Для каждого топика с ошибками: `totalCount += error_count`, `correctCount += 0`
- Для каждого топика, использованного правильно: `totalCount += 1`, `correctCount += 1`
- Пересчитать `mastery`

**Проблема:** Как определить "правильное использование"? LLM может не перечислить все правильные конструкции.

**Вариант Б: Добавить новую таблицу для Writing-специфичной статистики (более точно)**
```prisma
model UserWritingProgress {
  userId            Int
  totalTexts        Int       // Сколько текстов написано
  totalWords        Int       // Общий объем текстов
  averageScore      Int       // Средняя оценка 0-100
  lastWritingAt     DateTime?
  topicErrors       Json      // { "PAST_SIMPLE": 5, "ARTICLES": 3 }

  @@id([userId])
}
```

**Решение для MVP:**
- Используем **Вариант А** — обновляем `UserTopicProgress` на основе ошибок
- Для каждой ошибки: `totalCount += 1`, `correctCount += 0`, `mastery -= X` (штраф)
- Для каждого правильно использованного топика (если LLM укажет): `totalCount += 1`, `correctCount += 1`, `mastery += Y`
- Обновляем `lastPracticedAt`

### 7.3 Пример обновления прогресса

**Текст пользователя:**
> "Yesterday I go to the park. I seen my friend there. We play football."

**LLM анализ:**
```json
{
  "grammar_errors": [
    { "topic_id": "PAST_SIMPLE", "error": "go → went" },
    { "topic_id": "PAST_SIMPLE", "error": "seen → saw" },
    { "topic_id": "PAST_SIMPLE", "error": "play → played" }
  ]
}
```

**Обновление прогресса:**
- `UserTopicProgress` для `PAST_SIMPLE`:
  - `totalCount += 3` (3 ошибки)
  - `correctCount += 0` (все неправильно)
  - `mastery` пересчитывается (падает)
  - `lastPracticedAt = now()`

**Результат:** `PAST_SIMPLE` попадет в слабые зоны, бот порекомендует практику.

---

## 8. User Flow (MVP)

### 8.1 State Machine Flow

```
MAIN_MENU
   │
   ├── "Свободное письмо"
   │      ▼
   │  FREE_WRITING
   │      │
   │      │ (Пользователь пишет текст)
   │      ▼
   │  WRITING_FEEDBACK
   │      │
   │      │ (LLM анализирует, показывает фидбэк, обновляет прогресс)
   │      ▼
   └─ MAIN_MENU
```

### 8.2 FREE_WRITING State

**onEnter():**
1. Предлагаем тему для письма (опционально, или "пиши на любую тему")
   - Тема генерируется LLM с учетом интересов пользователя (из профиля)
   - Примеры: "Опиши свой последний отпуск", "Что ты думаешь о социальных сетях?", "Напиши о своем любимом хобби"
2. Указываем рекомендуемый объем (минимум 50 слов, оптимально 100-150)
3. Reply keyboard: `[Пропустить тему] [Меню]`

**handle():**
- Получаем текст от пользователя
- Проверяем минимальную длину (если < 30 слов — просим написать больше)
- Переходим в `WRITING_FEEDBACK` (передаем текст через контекст или Redis session)

### 8.3 WRITING_FEEDBACK State

**onEnter():**
1. Показываем "Анализирую твой текст..." (индикатор загрузки)
2. Отправляем запрос к LLM с текстом и промптом для анализа
3. Получаем структурированный ответ (JSON)
4. Обновляем `UserTopicProgress` для всех топиков с ошибками
5. Формируем сообщение с фидбэком:
   ```
   📝 Анализ твоего текста

   ✅ Что хорошо:
   • Ты использовал разнообразные времена
   • Хорошая структура текста

   ⚠️ Ошибки:
   • "He go" → "He went" (Past Simple)
   • "I am good in English" → "at English" (Prepositions)

   💡 Рекомендации:
   • Повтори Past Simple — было 3 ошибки
   • Обрати внимание на dependent prepositions
   ```
6. Reply keyboard: `[Написать ещё] [Практика грамматики] [Меню]`

**handle():**
- "Написать ещё" → переход в `FREE_WRITING`
- "Практика грамматики" → переход в `GRAMMAR_PRACTICE` (можно подгрузить топики с ошибками)
- "Меню" → переход в `MAIN_MENU`

---

## 9. Technical Implementation Plan

### 9.1 Changes to Data Model

**Minimal (MVP):**
- Используем существующую таблицу `UserTopicProgress`
- Обновляем прогресс на основе ошибок

**Optional (Post-MVP):**
- Добавить таблицу `UserWritingSession` для хранения истории текстов и анализа
- Добавить поле `writingScore` в `UserProfile` (средняя оценка Writing)

### 9.2 LLM Prompting

**Файл:** `/src/llm/prompts/analyzeWriting.ts`

```typescript
export function buildWritingAnalysisPrompt(
  text: string,
  userLevel: string,
  grammarTopics: GrammarTopic[]
): string {
  const topicList = grammarTopics.map(t => `${t.id}: ${t.name}`).join('\n');

  return `
You are an English writing tutor. Analyze the following text written by a ${userLevel} level student.

TEXT:
"""
${text}
"""

GRAMMAR TOPICS CATALOG:
${topicList}

Provide analysis in JSON format:
{
  "overall_score": <0-100>,
  "cefr_level_estimate": "<A1-C2>",
  "grammar_errors": [
    {
      "sentence": "<full sentence with error>",
      "error": "<incorrect part>",
      "correction": "<correct form>",
      "error_type": "OMISSION | ADDITION | MISFORMATION | MISORDERING",
      "topic_id": "<ID from catalog or null>",
      "severity": "critical | minor",
      "explanation": "<why it's wrong>"
    }
  ],
  "strengths": ["<positive point 1>", ...],
  "weaknesses": ["<area to improve 1>", ...],
  "recommendations": [
    { "topic_id": "<ID>", "reason": "<why>" }
  ]
}
`;
}
```

### 9.3 State Implementation Outline

**File:** `/src/stateMachine/states/freeWriting.ts`

```typescript
export class FreeWritingState extends State {
  readonly type = UserState.FREE_WRITING;

  async onEnter(context: StateHandlerContext): Promise<void> {
    // Generate topic suggestion using LLM based on user interests
    const topic = await this.generateTopic(context.profile);

    await context.ctx.reply(
      `✍️ Свободное письмо\n\n` +
      `Тема: ${topic}\n\n` +
      `Напиши текст на английском (минимум 50 слов). Можешь писать на любую тему!`,
      { reply_markup: freeWritingKeyboard }
    );
  }

  async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
    const text = context.messageText;

    if (text === "Меню") {
      return { nextState: UserState.MAIN_MENU, handled: true };
    }

    // Validate text length
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 30) {
      await context.ctx.reply(
        "Текст слишком короткий. Напиши хотя бы 30 слов."
      );
      return { handled: true };
    }

    // Store text in session for next state
    await this.sessionRepository.saveWritingText(context.user.id, text);

    return { nextState: UserState.WRITING_FEEDBACK, handled: true };
  }
}
```

**File:** `/src/stateMachine/states/writingFeedback.ts`

```typescript
export class WritingFeedbackState extends State {
  readonly type = UserState.WRITING_FEEDBACK;

  constructor(
    private llm: LLMAdapter,
    private grammarRepository: GrammarRepository,
    private sessionRepository: SessionRepository
  ) {
    super();
  }

  async onEnter(context: StateHandlerContext): Promise<void> {
    // Get text from session
    const text = await this.sessionRepository.getWritingText(context.user.id);

    await context.ctx.reply("📊 Анализирую твой текст...");

    // Get grammar catalog for mapping
    const topics = await this.grammarRepository.getAllTopics();

    // Call LLM for analysis
    const prompt = buildWritingAnalysisPrompt(text, context.profile.level, topics);
    const response = await this.llm.generateJSON(prompt, WritingAnalysisSchema);

    // Update progress for each error
    for (const error of response.grammar_errors) {
      if (error.topic_id) {
        await this.grammarRepository.updateUserTopicProgress(
          context.user.id,
          error.topic_id,
          {
            totalCount: +1,
            correctCount: +0,  // Error
            lastPracticedAt: new Date()
          }
        );
      }
    }

    // Format and send feedback
    const message = this.formatFeedback(response);
    await context.ctx.reply(message, {
      parse_mode: "HTML",
      reply_markup: writingFeedbackKeyboard
    });
  }

  private formatFeedback(analysis: WritingAnalysis): string {
    let msg = "📝 <b>Анализ твоего текста</b>\n\n";

    if (analysis.strengths.length > 0) {
      msg += "✅ <b>Что хорошо:</b>\n";
      for (const s of analysis.strengths) {
        msg += `  • ${s}\n`;
      }
      msg += "\n";
    }

    if (analysis.grammar_errors.length > 0) {
      msg += "⚠️ <b>Ошибки:</b>\n";
      for (const err of analysis.grammar_errors.slice(0, 5)) {  // Top 5
        msg += `  • "${err.error}" → "${err.correction}" (${err.explanation})\n`;
      }
      msg += "\n";
    }

    if (analysis.recommendations.length > 0) {
      msg += "💡 <b>Рекомендации:</b>\n";
      for (const rec of analysis.recommendations) {
        msg += `  • ${rec.reason}\n`;
      }
    }

    return msg;
  }

  async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
    switch (context.messageText) {
      case "Написать ещё":
        return { nextState: UserState.FREE_WRITING, handled: true };
      case "Практика грамматики":
        return { nextState: UserState.GRAMMAR_PRACTICE, handled: true };
      case "Меню":
        return { nextState: UserState.MAIN_MENU, handled: true };
      default:
        return { handled: true };
    }
  }
}
```

---

## 10. Open Questions & Future Enhancements

### Open Questions
- [ ] Как детектировать "правильное использование" топика? (сейчас LLM только ошибки находит)
- [ ] Нужно ли ограничивать количество анализов в день? (LLM API costs)
- [ ] Как хранить историю текстов для отслеживания прогресса во времени?

### Future Enhancements
- [ ] **Vocabulary analysis** — интеграция с English Vocabulary Profile
- [ ] **Genre-specific practice** — пользователь выбирает жанр (email, essay, review)
- [ ] **Writing challenges** — еженедельные темы с дедлайнами
- [ ] **Comparative analysis** — сравнение текущего текста с предыдущими (прогресс)
- [ ] **Automated text complexity scoring** — оценка соответствия уровню CEFR
- [ ] **Cohesion analysis** — анализ linking words и structure

---

## 11. Research Sources

### CEFR Writing Assessment
- [CEFR Grids for Writing Tasks](https://www.eaquals.org/wp-content/uploads/English-samples-Cambridge.pdf)
- [CEFR Reference Guide for Assessment](https://rm.coe.int/assessing-cefr-level/1680a9178c)
- [Cambridge Writing Assessment B2](https://teachtravelbudget.com/wp-content/uploads/2019/10/b2-cambridge-english-assessing-writing-performance.pdf)
- [CEFR All Scales and Skills](https://api.macmillanenglish.com/fileadmin/user_upload/Blog_and_Resources/Blogs_and_articles/CEFR-all-scales-and-all-skills.pdf)

### Automated Essay Scoring (AES)
- [Automated Scoring of English Essays in CEFR Levels](https://www.researchgate.net/publication/377451959_Automated_Scoring_of_English_Essays_in_CEFR_Levels_using_LSTM_and_DistilBERT_Embeddings)
- [Grammar-aware Automated Essay Scoring](https://arxiv.org/html/2406.08817)
- [Explainable AES with Pedagogical Value](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2020.572367/full)

### Text Complexity and Lexical Analysis
- [Aligning Linguistic Complexity with CEFR Levels](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/aligning-linguistic-complexity-with-the-difficulty-of-english-texts-for-l2-learners-based-on-cefr-levels/DB604DB02A205F0F172D6024137CBFE8)
- [Lexical Complexity and Language Proficiency](https://www.researchgate.net/publication/373649831_Lexical_Complexity_and_Language_Proficiency_An_Investigation_of_Indices_Across_CEFR_Levels)
- [Text Inspector Tool](https://textinspector.com)

### Grammar Error Taxonomy
- [Classification of Errors in Text](https://nlp.fi.muni.cz/raslan/2009/papers/6.pdf)
- [ATA Error Categories](https://www.atanet.org/certification/how-the-exam-is-graded/error-categories/)
- [Analysis of EFL Medical Students' Writing Errors](https://pmc.ncbi.nlm.nih.gov/articles/PMC11539313/)
- [Taxonomy of Grammar Errors](https://www.issco.unige.ch/en/research/projects/ewg95/node125.html)

---

*Последнее обновление: 2026-02-14*
