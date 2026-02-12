import { UserState } from "@domain/types";
import { createLLM } from "@llm";
import { State } from "@sm/base";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

import { ONBOARDING_SYSTEM_PROMPT, ONBOARDING_RESPONSE_MESSAGE } from "../../constants";
import { setProfile } from "../../state";

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

	async onEnter(context: StateHandlerContext): Promise<void> {
		const { ctx } = context;
		await ctx.reply(ONBOARDING_RESPONSE_MESSAGE, {
			reply_markup: { remove_keyboard: true },
		});

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
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, userId, messageText } = context;

		try {
			// Отправляем сообщение о том, что анализируем ответ
			await ctx.reply("Анализирую твой ответ... ⏳");

			const analysis = await this.llm.chat([
				{
					role: "system",
					content: ONBOARDING_SYSTEM_PROMPT,
				},
				{
					role: "user",
					content: messageText,
				},
			]);

			const parsed = JSON.parse(analysis);

			// Сохраняем профиль пользователя
			await setProfile(userId, {
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
