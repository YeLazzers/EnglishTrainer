import { Context } from "grammy";

import { mainMenuKeyboard } from "../keyboards";
import { getProfile, UserState } from "../state";
import { StateMachine } from "../stateMachine";

/**
 * Фабрика для создания обработчика команды /start
 * Принимает StateMachine для управления переходами состояний
 */
export function createStartCommand(stateMachine: StateMachine) {
	return async (ctx: Context): Promise<void> => {
		const userId = ctx.from?.id;
		if (!userId) {
			await ctx.reply("Ошибка: не удалось определить пользователя");
			return;
		}
		
		const existingProfile = await getProfile(userId);

		if (existingProfile) {
			// User already completed onboarding, restore to MAIN_MENU
			await stateMachine.changeStateTo(userId, UserState.MAIN_MENU, ctx, existingProfile);
			await ctx.reply("Добро пожаловать обратно! 👋", {
				reply_markup: mainMenuKeyboard,
			});
		} else {
			// New user - start onboarding
			// changeStateTo will automatically call onEnter for ONBOARDING state
			await stateMachine.changeStateTo(userId, UserState.ONBOARDING, ctx);
		}
	};
}
