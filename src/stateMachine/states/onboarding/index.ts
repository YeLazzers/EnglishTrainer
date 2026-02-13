import { UserState } from "@domain/types";
import type { UserRepository } from "@domain/user/repository";
import { createLLM } from "@llm";
import { State } from "@sm/base";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

import {
	// ONBOARDING_SYSTEM_PROMPT,
	ONBOARDING_RESPONSE_MESSAGE,
	ONBOARDING_WELCOME_MESSAGE,
} from "./constants";

/**
 * ONBOARDING состояние
 *
 * Вход: Пользователь запускает /start в первый раз
 * Обработка: Анализирует введенный текст о себе (на EN или RU), определяет уровень
 * Выход: Переход в MAIN_MENU
 */
export class OnboardingState extends State {
	readonly type = UserState.ONBOARDING;
	private llm = createLLM();

	constructor(private userRepository: UserRepository) {
		super();
	}

	async onEnter(context: StateHandlerContext): Promise<void> {
		const { ctx } = context;
		await ctx.reply(ONBOARDING_WELCOME_MESSAGE, {
			reply_markup: { remove_keyboard: true },
		});

		// const message = await llm.chat([
		//   {
		//     role: "system",
		//     content: ONBOARDING_SYSTEM_PROMPT,
		//   },
		// ]);
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, userId, messageText } = context;

		try {
			// Отправляем сообщение о том, что анализируем ответ
			await ctx.reply("Анализирую твой ответ... ⏳");

			const analysis = ONBOARDING_RESPONSE_MESSAGE;
			// const analysis = await this.llm.chat([
			// 	{
			// 		role: "system",
			// 		content: ONBOARDING_SYSTEM_PROMPT,
			// 	},
			// 	{
			// 		role: "user",
			// 		content: messageText,
			// 	},
			// ]);

			const parsed = JSON.parse(analysis);

			// Сохраняем профиль пользователя
			await this.userRepository.setProfile(userId, {
				level: parsed.level,
				goals: parsed.goals,
				interests: parsed.interests,
				rawResponse: messageText,
			});

			// Отправляем приветственное сообщение (клавиатура будет отправлена в onEnter MAIN_MENU)
			await ctx.reply(parsed.summary);

			// Переходим в MAIN_MENU
			return {
				nextState: UserState.MAIN_MENU,
				handled: true,
			};
		} catch (error) {
			console.error("Onboarding parsing error:", error);
			await ctx.reply(
				"Не удалось разобрать ответ. Расскажи о себе ещё раз — свободным текстом, на русском или английском."
			);

			// Остаемся в ONBOARDING
			return {
				handled: true,
			};
		}
	}
}
