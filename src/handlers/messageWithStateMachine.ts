import { Context } from "grammy";
import { StateMachine } from "../stateMachine";
import { getState, getProfile } from "../state";

/**
 * Обработчик текстовых сообщений со State Machine
 *
 * Процесс:
 * 1. Проверить и инициализировать пользователя
 * 2. Получить текущее состояние и профиль
 * 3. Передать в StateMachine для обработки
 *
 * @param stateMachine Инстанс StateMachine
 */
export function createMessageHandler(stateMachine: StateMachine) {
  return async (ctx: Context): Promise<void> => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply("Не удалось определить пользователя");
      return;
    }

    try {
      // Получить текущий профиль пользователя
      const profile = await getProfile(userId);

      // Передать обработку в StateMachine с профилем
      await stateMachine.handleMessage(ctx, profile);
    } catch (error) {
      console.error(`[MessageHandler] Error for user ${userId}:`, error);
      await ctx.reply(
        "Произошла ошибка при обработке сообщения. Попробуй позже или напиши /start."
      );
    }
  };
}
