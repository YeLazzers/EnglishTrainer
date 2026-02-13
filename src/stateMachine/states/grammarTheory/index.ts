import { Context } from "grammy";
import { InlineKeyboard } from "grammy";

import { UserState } from "@domain/types";
import type { UserProfile } from "@domain/user/types";
import { createLLM, JSONSchema } from "@llm";
import { State } from "@sm/base";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

import {
	GRAMMAR_THEORY_SYSTEM_PROMPT,
	GRAMMAR_THEORY_USER_PROMPT_TEMPLATE,
	GRAMMAR_THEORY_REPLY_KEYBOARD,
	// GRAMMAR_THEORY_RESPONSE_SCHEMA,
} from "./constants";

/**
 * GRAMMAR_THEORY состояние
 *
 * Вход: Пользователь выбрал "Грамматика" из MAIN_MENU
 * Обработка: Генерирует объяснение правила грамматики или переходит в практику
 * Выход: Переход в GRAMMAR_PRACTICE (на практику) или MAIN_MENU (назад в меню)
 *
 * Доступные переходы:
 * - "Практика на это правило" → GRAMMAR_PRACTICE
 * - "Другое правило" → Остается в GRAMMAR_THEORY (генерирует новое правило)
 * - "Меню" → MAIN_MENU
 */
export class GrammarTheoryState extends State {
	readonly type = UserState.GRAMMAR_THEORY;
	private llm = createLLM();

	async onEnter(context: StateHandlerContext): Promise<void> {
		// При входе в GRAMMAR_THEORY генерируем первое правило
		const { ctx, profile } = context;

		await ctx.reply("Ищем интересное правило грамматики для тебя...", {
			reply_markup: GRAMMAR_THEORY_REPLY_KEYBOARD,
		});

		await this.generateAndSendTheory(ctx, profile);
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, messageText, callbackData, profile } = context;

		// Обработка inline кнопки "Практика на это правило"
		// callback_data формат: "practice_grammar:RULE_NAME"
		if (callbackData?.startsWith("practice_grammar:")) {
			const ruleName = callbackData.substring("practice_grammar:".length);
			context.grammarRule = ruleName;
			return {
				nextState: UserState.GRAMMAR_PRACTICE,
				handled: true,
			};
		}

		// Обработка reply кнопок
		switch (messageText) {
			case "Другое правило":
				// Генерируем новое правило, остаемся в текущем состоянии
				await this.generateAndSendTheory(ctx, profile);
				return { handled: true };

			case "Меню":
				return {
					nextState: UserState.MAIN_MENU,
					handled: true,
				};

			default:
				// Неизвестный ввод
				await ctx.reply("Выбери из доступных опций ниже.", {
					reply_markup: GRAMMAR_THEORY_REPLY_KEYBOARD,
				});
				return { handled: true };
		}
	}

	/**
	 * Генерирует и отправляет объяснение правила грамматики
	 * Логика перенесена из textMessage.ts
	 */
	private async generateAndSendTheory(
		ctx: Context,
		profile: UserProfile | undefined
	): Promise<void> {
		if (!profile) {
			await ctx.reply("Профиль не найден. Выполни /start.");
			return;
		}

		// Build user prompt with interests and level
		const userPrompt = GRAMMAR_THEORY_USER_PROMPT_TEMPLATE.replace("{{level}}", profile.level)
			.replace("{{interests}}", profile.interests.join(", "))
			.replace("{{goals}}", profile.goals.join(", "));

		try {
			const response = `{
				"rule_name": "Present Perfect Simple",
				"level": "B2",
				"theory": "<b>Present Perfect Simple</b> 🕰️\\n\\nThe Present Perfect Simple connects the past with the present. It describes actions that happened at an indefinite time in the past or actions that started in the past and continue into the present.\\n\\n<b>When do we use it?</b>\\n\\n•   To talk about <i>experiences or achievements</i> at an unspecified time in the past. The exact time is not important.\\n    <i>Example: I have travelled to many countries. (When? Not specified.)</i>\\n•   For actions that <i>started in the past and continue up to the present moment</i>. We often use <i>'for'</i> (duration) or <i>'since'</i> (starting point).\\n    <i>Example: She has worked here since 2010.</i>\\n•   For <i>recently completed actions</i> that have a present result. We often use adverbs like <i>'just', 'already', 'yet'</i>.\\n    <i>Example: They have just released a new software update. (The update is now available.)</i>\\n\\n<b>Structure (Formula):</b>\\n\\nSubject + <b>have / has</b> + <b>Past Participle (V3)</b>\\n\\n•   <b>Positive:</b> I <code>have played</code>. He <code>has played</code>.\\n•   <b>Negative:</b> I <code>have not (haven't) played</code>. He <code>has not (hasn't) played</code>.\\n•   <b>Question:</b> <code>Have</code> you <code>played</code>? <code>Has</code> he <code>played</code>?\\n\\n<b>Examples:</b>\\n\\n•   <code>I have played Dota for five years.</code> (Started in the past, still playing.)\\n•   <code>She has never written a line of code.</code> (An experience at an unspecified time.)\\n•   <code>We haven't finished the project yet.</code> (Still ongoing, or just about to be finished.)\\n•   <code>Has he ever visited Silicon Valley?</code> (Asking about a life experience.)\\n•   <code>They have already deployed the new feature.</code> (Completed recently, with a current result.)\\n\\n<b>Typical Mistakes:</b>\\n\\n1.  <b>Using Past Simple instead of Present Perfect:</b>\\n    •   Incorrect: <s>I lived here for 5 years (and still live here).</s>\\n    •   Correct: <code>I have lived here for 5 years.</code>\\n2.  <b>Incorrect auxiliary verb ('have'/'has'):</b>\\n    •   Incorrect: <s>She have played.</s>\\n    •   Correct: <code>She has played.</code>\\n3.  <b>Using incorrect past participle (V3) form:</b>\\n    •   Incorrect: <s>I have went to the meeting.</s>\\n    •   Correct: <code>I have gone to the meeting.</code>\\n4.  <b>Confusing 'for' and 'since':</b>\\n    •   Incorrect: <s>I have worked here since 3 months.</s>\\n    •   Correct: <code>I have worked here for 3 months.</code> (For a duration)\\n    •   Correct: <code>I have worked here since March.</code> (Since a specific point in time)\\n\\n<b>In summary:</b> The Present Perfect Simple is used for actions connected to the present – either continuing, affecting the present, or being part of one's life experience up to now. Think of it as linking a past event to 'now'."
			}`;
			// const response = await this.llm.chat(
			// 	[
			// 		{
			// 			role: "system",
			// 			content: GRAMMAR_THEORY_SYSTEM_PROMPT,
			// 		},
			// 		{
			// 			role: "user",
			// 			content: userPrompt,
			// 		},
			// 	],
			// 	GRAMMAR_THEORY_RESPONSE_SCHEMA
			// );

			const parsed = JSON.parse(response);

			// Создаем inline клавиатуру с кнопкой "Практика на это правило"
			// Название правила кодируется в callback_data
			const practiceKeyboard = new InlineKeyboard().text(
				"Практика на это правило",
				`practice_grammar:${parsed.rule_name}`
			);

			await ctx.reply(parsed.theory, {
				reply_markup: practiceKeyboard,
				parse_mode: "HTML",
			});
		} catch (error) {
			console.error("[GrammarTheoryState] Failed to parse LLM response:", error);
			await ctx.reply("Не удалось загрузить объяснение. Попробуй позже.", {
				reply_markup: GRAMMAR_THEORY_REPLY_KEYBOARD,
			});
		}
	}
}
