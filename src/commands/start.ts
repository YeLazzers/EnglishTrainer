import { Context } from "grammy";
import { setState, getProfile, UserState } from "../state";
import { ONBOARDING_RESPONSE_MESSAGE } from "../constants";
import { mainMenuKeyboard } from "../keyboards";

export async function startCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const existingProfile = await getProfile(userId);

  if (existingProfile) {
    // User already completed onboarding, restore to MAIN_MENU
    await setState(userId, UserState.MAIN_MENU);
    await ctx.reply("Добро пожаловать обратно! 👋", {
      reply_markup: mainMenuKeyboard,
    });
  } else {
    // New user - start onboarding
    await setState(userId, UserState.ONBOARDING);
    const message = ONBOARDING_RESPONSE_MESSAGE;
    
    // const message = await llm.chat([
    //   {
    //     role: "system",
    //     content: `Ты — English Trainer, телеграм-бот для изучения английского языка.
    //             Пользователь только что запустил бота. Сгенерируй приветственное сообщение для онбординга.

    //             Сообщение должно:
    //             1. Кратко представить бота (тренажер английского с индивидуальным подходом)
    //             2. Попросить пользователя рассказать о себе в свободной форме — на английском или русском:
    //               - Какой у него уровень английского (примерно)
    //               - Какие цели (разговорный, для работы, путешествия, экзамены и т.д.)
    //               - Какие темы/увлечения ему интересны
    //             3. Быть дружелюбным, коротким и не перегруженным

    //             Формат: обычный текст для Telegram (можно использовать эмодзи умеренно). Не используй markdown.`,
    //   },
    // ]);

    await ctx.reply(message, {
      reply_markup: { remove_keyboard: true },
    });
  }
}
