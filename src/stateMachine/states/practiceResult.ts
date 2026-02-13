import type { GrammarRepository } from "@domain/grammar/repository";
import { SessionRepository } from "@domain/session-repository";
import { UserState } from "@domain/types";
import { State } from "@sm/base";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

/**
 * PRACTICE_RESULT состояние
 *
 * Вход: Пользователь завершил серию упражнений в GRAMMAR_PRACTICE
 * Обработка: Показывает итоги (X/Y правильно, % прогресса), записывает статистику в БД
 * Выход: Переход в GRAMMAR_PRACTICE (продолжить практику) или MAIN_MENU
 *
 * Доступные переходы:
 * - "Ещё практика" → GRAMMAR_PRACTICE
 * - "Меню" → MAIN_MENU
 */
export class PracticeResultState extends State {
	readonly type = UserState.PRACTICE_RESULT;

	constructor(
		private sessionRepository: SessionRepository,
		private grammarRepository: GrammarRepository
	) {
		super();
	}

	async onEnter(context: StateHandlerContext): Promise<void> {
		const { ctx, user } = context;

		try {
			// Получаем сессию из Redis
			const session = await this.sessionRepository.getSession(user.id);

			if (!session) {
				await ctx.reply("Сессия не найдена. Начните практику заново.");
				return;
			}

			// Отмечаем сессию как завершенную
			await this.sessionRepository.completeSession(user.id);

			// Обновляем UserTopicProgress в БД
			await this.grammarRepository.updateProgress(user.id, session.topicId, {
				practiceCount: 1, // Инкремент будет на уровне репозитория (upsert)
				correctCount: session.correct,
				totalCount: session.total,
				lastPracticedAt: new Date(),
				// TODO: Рассчитывать mastery на основе correctCount/totalCount
				mastery: Math.round((session.correct / session.total) * 100),
			});

			// Показываем результаты пользователю
			const percentage = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;
			await ctx.reply(
				`✅ Практика завершена!\n\nПравильно: ${session.correct}/${session.total} (${percentage}%)\n\nПрогресс сохранён.`
			);
		} catch (error) {
			console.error("[PracticeResult] Failed to process results:", error);
			await ctx.reply("Не удалось сохранить результаты. Попробуй позже.");
		}
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { messageText } = context;

		switch (messageText) {
			case "Ещё практика":
				return {
					nextState: UserState.GRAMMAR_PRACTICE,
					handled: true,
				};

			case "Меню":
				return {
					nextState: UserState.MAIN_MENU,
					handled: true,
				};

			default:
				return { handled: true };
		}
	}
}
