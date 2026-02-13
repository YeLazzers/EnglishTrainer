import { InlineKeyboard } from "grammy";

import type { GrammarRepository } from "@domain/grammar/repository";
import { UserState } from "@domain/types";
import { createLLM } from "@llm";
import { State } from "@sm/base";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

import {
	GRAMMAR_THEORY_SYSTEM_PROMPT,
	GRAMMAR_THEORY_USER_PROMPT_TEMPLATE,
	GRAMMAR_THEORY_REPLY_KEYBOARD,
	GRAMMAR_THEORY_RESPONSE_SCHEMA,
} from "./constants";
import { MOCKED_GRAMMAR_THEORY_RESPONSE } from "./mocks";

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

	constructor(private grammarRepository: GrammarRepository) {
		super();
	}

	async onEnter(context: StateHandlerContext): Promise<void> {
		// При входе в GRAMMAR_THEORY генерируем первое правило
		const { ctx } = context;

		await ctx.reply("Ищем интересное правило грамматики для тебя...", {
			reply_markup: GRAMMAR_THEORY_REPLY_KEYBOARD,
		});

		await this.generateAndSendTheory(context);
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, messageText, callbackData } = context;

		// Обработка inline кнопки "Практика на это правило"
		// callback_data формат: "practice_grammar:TOPIC_ID:RULE_NAME"
		if (callbackData?.startsWith("practice_grammar:")) {
			const payload = callbackData.substring("practice_grammar:".length);
			const [topicId, ruleName] = payload.split(":", 2);
			context.grammarTopicId = topicId;
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
				await this.generateAndSendTheory(context);
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
	 */
	private async generateAndSendTheory(context: StateHandlerContext): Promise<void> {
		const { ctx, profile, user } = context;

		if (!profile) {
			await ctx.reply("Профиль не найден. Выполни /start.");
			return;
		}

		// Build user prompt with interests and level
		const userPrompt = GRAMMAR_THEORY_USER_PROMPT_TEMPLATE.replace("{{level}}", profile.level)
			.replace("{{interests}}", profile.interests.join(", "))
			.replace("{{goals}}", profile.goals.join(", "));

		try {
			// const response = MOCKED_GRAMMAR_THEORY_RESPONSE;
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
				GRAMMAR_THEORY_RESPONSE_SCHEMA
			);

			const parsed = JSON.parse(response);

			// Сохраняем топик в БД (upsert - создаем если нет, обновляем если есть)
			await this.grammarRepository.upsertTopic({
				id: parsed.topic,
				categoryId: parsed.category,
				name: parsed.rule_name,
				nameRu: parsed.rule_name, // TODO: LLM должен возвращать nameRu, пока дублируем name
				cefrLevel: parsed.level,
				sortOrder: 0, // TODO: определить логику sortOrder
			});

			// Отмечаем что пользователь увидел теорию по этому топику
			await this.grammarRepository.markExposed(user.id, parsed.topic);

			// Создаем inline клавиатуру с кнопкой "Практика на это правило"
			// callback_data формат: "practice_grammar:TOPIC_ID:RULE_NAME"
			const practiceKeyboard = new InlineKeyboard().text(
				"Практика на это правило",
				`practice_grammar:${parsed.topic}:${parsed.rule_name}`
			);

			// Формируем сообщение: заголовок + краткое описание + основная теория
			const message = `<b>${parsed.rule_name}</b>\n\n${parsed.summary}\n\n${parsed.theory}`;

			await ctx.reply(message, {
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
