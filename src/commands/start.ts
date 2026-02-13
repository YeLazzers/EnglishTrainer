import { Context } from "grammy";

import type { UserRepository, CreateUser } from "@adapters/db/user";
import { StateMachine } from "@sm";

import { mainMenuKeyboard } from "../keyboards";
import { UserState } from "../state";

/**
 * Фабрика для создания обработчика команды /start
 * Принимает StateMachine для управления переходами состояний и UserRepository для работы с пользователями
 */
export function createStartCommand(stateMachine: StateMachine, userRepository: UserRepository) {
	return async (ctx: Context): Promise<void> => {
		const userId = ctx.from?.id;
		if (!userId) {
			await ctx.reply("Ошибка: не удалось определить пользователя");
			return;
		}

		// Извлекаем данные пользователя из Telegram контекста
		const createUserData: CreateUser = {
			id: userId,
			firstName: ctx.from?.first_name ?? "Unknown",
			lastName: ctx.from?.last_name ?? null,
			username: ctx.from?.username ?? null,
			languageCode: ctx.from?.language_code ?? null,
			isPremium: ctx.from?.is_premium ?? false,
		};

		// Создаем или обновляем пользователя в БД — получаем полный объект User
		const user = await userRepository.upsert(createUserData);

		// Проверяем наличие профиля обучения
		const existingProfile = await userRepository.getProfile(userId);

		if (existingProfile) {
			// User already completed onboarding, restore to MAIN_MENU
			await stateMachine.changeStateTo(user, UserState.MAIN_MENU, ctx, existingProfile);
			await ctx.reply("Добро пожаловать обратно! 👋", {
				reply_markup: mainMenuKeyboard,
			});
		} else {
			// New user - start onboarding
			// changeStateTo will automatically call onEnter for ONBOARDING state
			await stateMachine.changeStateTo(user, UserState.ONBOARDING, ctx);
		}
	};
}
