import { Bot, Keyboard } from "grammy";
import { createLLM } from "./llm";
import {
  getState,
  setState,
  setProfile,
  getProfile,
  UserState,
  initializeUser,
} from "./state";
import { ONBOARDING_RESPONSE_MESSAGE } from "./constants";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(token);
const llm = createLLM();

const mainMenuKeyboard = new Keyboard()
  .text("Грамматика")
  .text("Практика")
  .row()
  .text("Свободное письмо")
  .text("Статистика")
  .resized();

bot.command("debug", async (ctx) => {
  const userId = ctx.from!.id;
  const state = (await getState(userId)) ?? "NONE";
  const profile = await getProfile(userId);

  const lines = [`State: ${state}`];
  if (profile) {
    lines.push(`Level: ${profile.level}`);
    lines.push(`Goals: ${profile.goals.join(", ")}`);
    lines.push(`Interests: ${profile.interests.join(", ")}`);
  } else {
    lines.push("Profile: not set");
  }

  await ctx.reply(lines.join("\n"));
});

bot.command("start", async (ctx) => {
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
    //   const message = await llm.chat([
    //     {
    //       role: "system",
    //       content: `Ты — English Trainer, телеграм-бот для изучения английского языка.
    // Пользователь только что запустил бота. Сгенерируй приветственное сообщение для онбординга.

    // Сообщение должно:
    // 1. Кратко представить бота (тренажер английского с индивидуальным подходом)
    // 2. Попросить пользователя рассказать о себе в свободной форме — на английском или русском:
    //    - Какой у него уровень английского (примерно)
    //    - Какие цели (разговорный, для работы, путешествия, экзамены и т.д.)
    //    - Какие темы/увлечения ему интересны
    // 3. Быть дружелюбным, коротким и не перегруженным

    // Формат: обычный текст для Telegram (можно использовать эмодзи умеренно). Не используй markdown.`,
    //     },
    //   ]);

    await ctx.reply(message);
  }
});

bot.on("message:text", async (ctx) => {
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
});

bot.start();
console.log("Bot is running...");
