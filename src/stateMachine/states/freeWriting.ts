import { UserState } from "../../domain/types";
import { State } from "../base";
import { StateHandlerContext, StateHandlerResult } from "../types";

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

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { messageText } = context;

		if (messageText === "Меню") {
			return {
				nextState: UserState.MAIN_MENU,
				handled: true,
			};
		}

		// Все остальное — это текст для оценки
		// Переходим в WRITING_FEEDBACK
		return {
			nextState: UserState.WRITING_FEEDBACK,
			handled: true,
		};
	}
}
