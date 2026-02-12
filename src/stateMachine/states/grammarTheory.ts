import { Context } from "grammy";

import { GRAMMAR_THEORY_SYSTEM_PROMPT, GRAMMAR_THEORY_USER_PROMPT_TEMPLATE } from "../../constants";
import { UserState, UserProfile } from "../../domain/types";
import { grammarTheoryKeyboard } from "../../keyboards";
import { createLLM, JSONSchema } from "../../llm";
import { State } from "../base";
import { StateHandlerContext, StateHandlerResult } from "../types";

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
		await this.generateAndSendTheory(ctx, profile);
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, messageText, profile } = context;

		switch (messageText) {
			case "Практика на это правило":
				return {
					nextState: UserState.GRAMMAR_PRACTICE,
					handled: true,
				};

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
					reply_markup: grammarTheoryKeyboard,
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

		// JSON Schema для структурированного ответа
		const responseSchema: JSONSchema = {
			type: "object",
			properties: {
				rule_name: {
					type: "string",
					description: "Name of the grammar rule",
				},
				level: {
					type: "string",
					description: "English level (A1-C2)",
				},
				theory: {
					type: "string",
					description: "Explanation of the grammar rule with examples",
				},
			},
			required: ["rule_name", "level", "theory"],
		};

		await ctx.reply("Ищем интересное правило грамматики для тебя...");

		try {
			const response = await this.llm.chat(
				[
					{
						role: "system",
						content: GRAMMAR_THEORY_SYSTEM_PROMPT,
					},
					{
						role: "user",
						content: userPrompt,
					},
				],
				responseSchema
			);

			const parsed = JSON.parse(response);
			await ctx.reply(parsed.theory, {
				reply_markup: grammarTheoryKeyboard,
				parse_mode: "HTML",
			});
		} catch (error) {
			console.error("[GrammarTheoryState] Failed to parse LLM response:", error);
			await ctx.reply("Не удалось загрузить объяснение. Попробуй позже.", {
				reply_markup: grammarTheoryKeyboard,
			});
		}
	}
}
