# LLM Layer

Интеграция с LLM-провайдерами. Поддерживает Gemini и OpenAI через единый интерфейс.

## Структура

```
llm/
├── index.ts             # Фабрика createLLM(), ре-экспорты типов
├── types.ts             # LLMAdapter interface, ChatMessage, JSONSchema
├── logger.ts            # Логирование запросов/ответов в файлы (llm_logs/)
└── models/
    ├── baseLLM.ts       # BaseLLMAdapter — абстрактный класс с логированием
    ├── gemini.ts        # GeminiAdapter — Google Gemini API
    └── openai.ts        # OpenAIAdapter — OpenAI GPT API
```

## Архитектура

**Интерфейс** (`LLMAdapter`):
```ts
chat(messages: ChatMessage[], schema?: JSONSchema): Promise<string>
```

**Наследование**:
```
LLMAdapter (interface)
  └── BaseLLMAdapter (abstract class — логирование, обёртка)
        ├── GeminiAdapter
        └── OpenAIAdapter
```

- `BaseLLMAdapter.chat()` — обёртка с console.log + файловым логированием
- Каждый провайдер реализует `executeChat()` — непосредственный вызов API
- `schema` параметр — для structured output (JSON schema)

## Конфигурация

- `LLM_PROVIDER` env var: `"gemini"` (default) или `"openai"`
- API ключи: `GEMINI_API_KEY` / `OPENAI_API_KEY`

## Логирование

- Каждый LLM-вызов записывается в `llm_logs/{provider}-{model}-{timestamp}.log`
- Содержит: system prompt, user prompt, ответ, token usage
- Полезно для отладки промптов и мониторинга расхода токенов

## Использование

LLM используется в state-хендлерах (onboarding, grammar theory, etc.):
```ts
const llm = createLLM()
const response = await llm.chat([{ role: "system", content: "..." }, { role: "user", content: "..." }])
```
