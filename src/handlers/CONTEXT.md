# Handlers

Обработчики событий Telegram (текстовые сообщения, callback_query).

## Файлы

| Файл | Назначение | Статус |
|------|-----------|--------|
| `messageWithStateMachine.ts` | Активный обработчик `message:text` — делегирует в StateMachine | **Используется** |

## Активный обработчик: messageWithStateMachine.ts

Фабрика `createMessageHandler(stateMachine)`:
1. Извлекает `userId` из `ctx.from`
2. Загружает профиль через `getProfile(userId)`
3. Делегирует в `stateMachine.handleMessage(ctx, profile)`

Подключен в `bot.ts`:
```ts
bot.on("message:text", createMessageHandler(stateMachine))
```

## callback_query

Обработчик callback_query (inline buttons) определён inline в `bot.ts`:
```ts
bot.on("callback_query", async (ctx) => {
  const profile = await getProfile(userId)
  await stateMachine.handleCallback(ctx, profile)
})
```
Возможно стоит вынести в отдельный файл `handlers/callbackQuery.ts` для консистентности.
