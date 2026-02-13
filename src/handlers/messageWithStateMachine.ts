import { Context } from "grammy";

import type { UserRepository } from "@adapters/db/user";
import { StateMachine } from "@sm";

/**
 * Обработчик текстовых сообщений со State Machine
 *
 * Процесс:
 * 1. Получить пользователя и профиль из БД
 * 2. Передать в StateMachine для обработки
 *
 * @param stateMachine Инстанс StateMachine
 * @param userRepository UserRepository для получения пользователя и профиля
 */
export function createMessageHandler(stateMachine: StateMachine, userRepository: UserRepository) {
	return async (ctx: Context): Promise<void> => {
		const userId = ctx.from?.id;

		if (!userId) {
			return;
		}

		try {
			// Получить пользователя (содержит state)
			const user = await userRepository.findById(userId);

			if (!user) {
				// Пользователь не вызвал /start — игнорируем
				return;
			}

			// Получить профиль обучения
			const profile = await userRepository.getProfile(userId);

			await stateMachine.handleMessage(ctx, user, profile ?? undefined);
		} catch (error) {
			console.error(`[MessageHandler] Error for user ${userId}:`, error);
			await ctx.reply(
				"Произошла ошибка при обработке сообщения. Попробуй позже или напиши /start."
			);
		}
	};
}
