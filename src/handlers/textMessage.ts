import { Context } from "grammy";
import { createLLM } from "../llm";
import { getState, setState, setProfile, getProfile, UserState } from "../state";
import { mainMenuKeyboard, grammarTheoryKeyboard } from "../keyboards";
import {
  ONBOARDING_SYSTEM_PROMPT,
  GRAMMAR_THEORY_SYSTEM_PROMPT,
  GRAMMAR_THEORY_USER_PROMPT_TEMPLATE,
} from "../constants";

const llm = createLLM();

export async function handleTextMessage(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const messageText = ctx.message?.text;

  if (!messageText) {
    await ctx.reply("Пожалуйста, отправь текстовое сообщение.");
    return;
  }

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
    if (messageText === "Грамматика") {
      // Enter grammar theory mode
      const profile = await getProfile(userId);
      if (!profile) {
        await ctx.reply("Профиль не найден. Выполни /start.");
        return;
      }

      await setState(userId, UserState.GRAMMAR_THEORY);
      
      // Build user prompt with interests and level
      const userPrompt = GRAMMAR_THEORY_USER_PROMPT_TEMPLATE
      .replace("{{level}}", profile.level)
      .replace("{{interests}}", profile.interests.join(", "))
      .replace("{{goals}}", profile.goals.join(", "));
      
      await ctx.reply('Ищем интересное правило грамматики для тебя...');
      const response = await llm.chat([
        {
          role: "system",
          content: GRAMMAR_THEORY_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ]);

      try {
        const parsed = JSON.parse(response);
        await ctx.reply(parsed.theory, { reply_markup: grammarTheoryKeyboard });
      } catch (error) {
        console.error('Failed to parse LLM response:', error);
        await ctx.reply(
          "Не удалось загрузить объяснение. Попробуй позже.",
          { reply_markup: grammarTheoryKeyboard }
        );
      }
      return;
    }

    // Default response for unknown input in MAIN_MENU
    await ctx.reply("Выбери раздел из меню ниже.", {
      reply_markup: mainMenuKeyboard,
    });
    return;
  }

  if (state === UserState.GRAMMAR_THEORY) {
    if (messageText === "Практика на это правило") {
      // Start grammar practice
      await setState(userId, UserState.GRAMMAR_PRACTICE);
      await ctx.reply("TODO: практика на выбранное правило");
      return;
    }

    if (messageText === "Другое правило") {
      // Generate another grammar rule
      const profile = await getProfile(userId);
      if (!profile) {
        await ctx.reply("Профиль не найден. Выполни /start.");
        return;
      }

      // Stay in GRAMMAR_THEORY and fetch another rule
      const userPrompt = GRAMMAR_THEORY_USER_PROMPT_TEMPLATE
        .replace("{{level}}", profile.level)
        .replace("{{interests}}", profile.interests.join(", "))
        .replace("{{goals}}", profile.goals.join(", "));

      const response = await llm.chat([
        {
          role: "system",
          content: GRAMMAR_THEORY_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ]);

      try {
        const parsed = JSON.parse(response);
        await ctx.reply(parsed.theory, { reply_markup: grammarTheoryKeyboard });
      } catch {
        await ctx.reply(
          "Не удалось загрузить объяснение. Попробуй позже.",
          { reply_markup: grammarTheoryKeyboard }
        );
      }
      return;
    }

    if (messageText === "Меню") {
      // Return to main menu
      await setState(userId, UserState.MAIN_MENU);
      await ctx.reply("Ты вернулся в главное меню.", {
        reply_markup: mainMenuKeyboard,
      });
      return;
    }

    // Unknown input in GRAMMAR_THEORY
    await ctx.reply("Выбери из доступных опций ниже.", {
      reply_markup: grammarTheoryKeyboard,
    });
    return;
  }

  // No state — suggest /start
  await ctx.reply('Напиши /start, чтобы начать.');
}
