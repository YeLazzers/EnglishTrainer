import { Context } from "grammy";
import { createLLM } from "../llm";
import { getState, setState, setProfile, initializeUser, UserState } from "../state";
import { mainMenuKeyboard } from "../keyboards";
import { ONBOARDING_SYSTEM_PROMPT } from "../constants";

const llm = createLLM();

export async function handleTextMessage(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const messageText = ctx.message?.text;

  if (!messageText) {
    await ctx.reply("Пожалуйста, отправь текстовое сообщение.");
    return;
  }

  // Initialize user if needed (restore state from DB)
  await initializeUser(userId);

  const state = await getState(userId);

  if (state === UserState.ONBOARDING) {
    const analysis = await llm.chat([
      {
        role: "system",
        content: ONBOARDING_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: messageText,
      },
    ]);

    try {
      const parsed = JSON.parse(analysis);

      await setProfile(userId, {
        level: parsed.level,
        goals: parsed.goals,
        interests: parsed.interests,
        rawResponse: messageText,
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
