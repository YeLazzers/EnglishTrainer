import type { GrammarRepository } from "@domain/grammar/repository";
import { UserState } from "@domain/types";
import { State } from "@sm/base";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

import { mainMenuKeyboard } from "../../keyboards";

/**
 * Форматирует заголовок статистики с уровнем пользователя
 */
function formatStatsHeader(level: string): string {
	return `📈 <b>Твоя статистика</b>\n\n🎯 Уровень: <b>${level}</b>\n\n`;
}

/**
 * MAIN_MENU состояние
 *
 * Вход: Пользователь завершил онбординг или вернулся из другого раздела
 * Обработка: Маршрутизирует выбор пользователя (Грамматика, Практика, Свободное письмо, Статистика)
 * Выход: Переход в выбранный раздел
 *
 * Доступные переходы:
 * - "Грамматика" → GRAMMAR_THEORY
 * - "Практика" → GRAMMAR_PRACTICE
 * - "Свободное письмо" → FREE_WRITING
 * - "Статистика" → показывает статистику, остается в MAIN_MENU
 */
export class MainMenuState extends State {
	readonly type = UserState.MAIN_MENU;

	constructor(private grammarRepository: GrammarRepository) {
		super();
	}

	/**
	 * Вход в MAIN_MENU: отправляем клавиатуру главного меню
	 */
	async onEnter(context: StateHandlerContext): Promise<void> {
		const { ctx } = context;

		await ctx.reply("Выбери раздел:", {
			reply_markup: mainMenuKeyboard,
		});
	}

	/**
	 * Форматирует и отправляет статистику пользователя
	 */
	private async showStatistics(context: StateHandlerContext): Promise<void> {
		const { ctx, user, profile } = context;

		if (!profile) {
			await ctx.reply("Профиль не найден. Выполни /start.");
			return;
		}

		try {
			// Получаем весь прогресс пользователя
			const progressList = await this.grammarRepository.getAllUserProgress(user.id);

			if (progressList.length === 0) {
				await ctx.reply(
					formatStatsHeader(profile.level) +
					"Пока нет данных о практике.\n" +
					"Начни с раздела 'Грамматика' или 'Практика'!",
					{ parse_mode: "HTML", reply_markup: mainMenuKeyboard }
				);
				return;
			}

			// Получаем названия топиков для всех записей прогресса
			const topicsMap = new Map<string, string>(); // topicId -> nameRu
			for (const progress of progressList) {
				const topic = await this.grammarRepository.findTopicById(progress.topicId);
				if (topic) {
					topicsMap.set(progress.topicId, topic.nameRu);
				}
			}

			// Агрегированная статистика
			const totalSessions = progressList.reduce((sum, p) => sum + p.practiceCount, 0);
			const totalCorrect = progressList.reduce((sum, p) => sum + p.correctCount, 0);
			const totalAnswers = progressList.reduce((sum, p) => sum + p.totalCount, 0);
			const totalTopics = progressList.length;
			const percentage = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

			// Топ-3 сильных зон (mastery >= 70)
			const strongZones = progressList
				.filter(p => p.mastery >= 70)
				.sort((a, b) => b.mastery - a.mastery)
				.slice(0, 3);

			// Топ-3 слабых зон (минимальный mastery, но были задания > 0)
			const weakZones = progressList
				.filter(p => p.totalCount > 0 && p.mastery < 70) // Только те, кто нуждается в улучшении
				.sort((a, b) => a.mastery - b.mastery)
				.slice(0, 3);

			// Формируем сообщение
			let message = formatStatsHeader(profile.level);
			message += "📚 Всего практики:\n";
			message += `   Сессий: ${totalSessions}\n`;
			message += `   Ответов: ${totalCorrect} из ${totalAnswers} (${percentage}% верных)\n`;
			message += `   Изучено тем: ${totalTopics}\n`;

			if (strongZones.length > 0) {
				message += "\n💪 <b>Сильные зоны:</b>\n";
				for (const zone of strongZones) {
					const name = topicsMap.get(zone.topicId) || zone.topicId;
					message += `   • ${name} — ${zone.mastery}%\n`;
				}
			}

			if (weakZones.length > 0) {
				message += "\n⚠️ <b>Требуют внимания:</b>\n";
				for (const zone of weakZones) {
					const name = topicsMap.get(zone.topicId) || zone.topicId;
					message += `   • ${name} — ${zone.mastery}%\n`;
				}
			}

			await ctx.reply(message, {
				parse_mode: "HTML",
				reply_markup: mainMenuKeyboard,
			});
		} catch (error) {
			console.error(`[MainMenu] Error showing statistics for user ${user.id}:`, error);
			await ctx.reply("Ошибка при загрузке статистики. Попробуй позже.");
		}
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, messageText } = context;

		switch (messageText) {
			case "Грамматика":
				return {
					nextState: UserState.GRAMMAR_THEORY,
					handled: true,
				};

			case "Практика":
				// Переход в практику через теорию (сначала загружаем правило, потом практика)
				return {
					nextState: UserState.GRAMMAR_PRACTICE,
					handled: true,
				};

			case "Свободное письмо":
				// TODO: Реализовать FREE_WRITING
				await ctx.reply("TODO: Раздел Свободное письмо в разработке", {
					reply_markup: mainMenuKeyboard,
				});
				return { handled: true };

			case "Статистика":
				await this.showStatistics(context);
				return { handled: true };

			default:
				// Неизвестный ввод
				await ctx.reply("Выбери раздел из меню ниже.", {
					reply_markup: mainMenuKeyboard,
				});
				return { handled: true };
		}
	}
}
