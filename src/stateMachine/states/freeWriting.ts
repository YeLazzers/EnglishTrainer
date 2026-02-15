import type { LimitRepository } from "@domain/limits/repository";
import { RequestType } from "@domain/limits/types";
import { UserState } from "@domain/types";
import { State } from "@sm/base";
import { checkAndNotifyLimit } from "@sm/helpers/limitCheck";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

/**
 * FREE_WRITING состояние
 *
 * Вход: Пользователь выбрал "Свободное письмо" из MAIN_MENU
 * Обработка: Пользователь пишет свободный текст на английском
 * Выход: После отправки текста переход в WRITING_FEEDBACK
 *
 * Доступные переходы:
 * - При отправке текста → WRITING_FEEDBACK
 * - "Меню" → MAIN_MENU
 */
export class FreeWritingState extends State {
	readonly type = UserState.FREE_WRITING;

	constructor(private limitRepository: LimitRepository) {
		super();
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, user, messageText } = context;

		if (messageText === "Меню") {
			return {
				nextState: UserState.MAIN_MENU,
				handled: true,
			};
		}

		// Проверяем лимит перед анализом текста
		const limitAllowed = await checkAndNotifyLimit(
			ctx,
			user.id,
			RequestType.FREE_WRITING,
			this.limitRepository
		);

		if (!limitAllowed) {
			return { handled: true };
		}

		// Инкрементируем счётчик (реальный LLM-запрос будет в WRITING_FEEDBACK.onEnter)
		await this.limitRepository.incrementUsage(user.id, RequestType.FREE_WRITING);

		// Все остальное — это текст для оценки
		// Переходим в WRITING_FEEDBACK
		return {
			nextState: UserState.WRITING_FEEDBACK,
			handled: true,
		};
	}
}
