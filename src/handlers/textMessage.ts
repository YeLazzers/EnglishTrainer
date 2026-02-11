import { Context } from "grammy";
import { createLLM } from "../llm";
import { getState, setState, setProfile, initializeUser, UserState } from "../state";
import { mainMenuKeyboard } from "../keyboards";

const llm = createLLM();

export async function handleTextMessage(ctx: Context): Promise<void> {
  const userId = ctx.from.id;

  // Initialize user if needed (restore state from DB)
  await initializeUser(userId);

  const state = await getState(userId);

  if (state === UserState.ONBOARDING) {
    const analysis = await llm.chat([
      {
        role: "system",
        content: `Ты — English Trainer. Пользователь прислал сообщение о себе в рамках онбординга.

Проанализируй сообщение и извлеки:
1. Уровень английского (A1/A2/B1/B2/C1/C2 — определи приблизительно)
2. Цели изучения
3. Интересы и увлечения

Ответь в формате JSON (без markdown, без \`\`\`):
{
  "level": "B1",
  "goals": ["разговорный английский", "для работы"],
  "interests": ["технологии", "кино"],
  "summary": "Краткое дружелюбное сообщение пользователю: что ты понял о нём, его уровень, и что теперь можно начинать заниматься. 2-3 предложения."
}`,
      },
      {
        role: "user",
        content: ctx.message.text,
      },
    ]);

    try {
      const parsed = JSON.parse(analysis);

      await setProfile(userId, {
        level: parsed.level,
        goals: parsed.goals,
        interests: parsed.interests,
        rawResponse: ctx.message.text,
      });

      await setState(userId, UserState.MAIN_MENU);

      await ctx.reply(parsed.summary, { reply_markup: mainMenuKeyboard });
    } catch {
      await ctx.reply(
        "Не удалось разобрать ответ. Расскажи о себе ещё раз — свободным текстом, на русском или английском."
      );
    }

    return;
  }

  if (state === UserState.MAIN_MENU) {
    await ctx.reply("Выбери раздел из меню ниже.", {
      reply_markup: mainMenuKeyboard,
    });
    return;
  }

  // No state — suggest /start
  await ctx.reply('Напиши /start, чтобы начать.');
}
