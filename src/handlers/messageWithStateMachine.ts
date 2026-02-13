import { Context } from "grammy";

import type { UserRepository } from "@adapters/db/user";
import { StateMachine } from "@sm";

/**
 * Обработчик текстовых сообщений со State Machine
 *
 * Процесс:
 * 1. Проверить и инициализировать пользователя
 * 2. Получить текущее состояние и профиль
 * 3. Передать в StateMachine для обработки
 *
 * @param stateMachine Инстанс StateMachine
 * @param userRepository UserRepository для получения профиля
 */
export function createMessageHandler(stateMachine: StateMachine, userRepository: UserRepository) {
	return async (ctx: Context): Promise<void> => {
		const userId = ctx.from?.id;

		if (!userId) {
			await ctx.reply("Не удалось определить пользователя");
			return;
		}

		try {
			// Получить текущий профиль пользователя
			const profile = await userRepository.getProfile(userId);

			// Передать обработку в StateMachine с профилем
			// Конвертируем новый UserProfile в legacy формат для совместимости
			const legacyProfile = profile
				? {
						id: profile.userId,
						level: profile.level,
						goals: profile.goals,
						interests: profile.interests,
						rawResponse: profile.rawResponse,
						createdAt: profile.createdAt,
						updatedAt: profile.updatedAt,
				  }
				: undefined;

			await stateMachine.handleMessage(ctx, legacyProfile);
		} catch (error) {
			console.error(`[MessageHandler] Error for user ${userId}:`, error);
			await ctx.reply(
				"Произошла ошибка при обработке сообщения. Попробуй позже или напиши /start."
			);
		}
	};
}
