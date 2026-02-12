import { UserState } from "../../domain/types";
import { State } from "../base";
import { StateHandlerContext, StateHandlerResult } from "../types";
import { SessionRepository } from "../../domain/session-repository";

/**
 * PRACTICE_RESULT состояние
 *
 * Вход: Пользователь завершил серию упражнений в GRAMMAR_PRACTICE
 * Обработка: Показывает итоги (X/Y правильно, % прогресса)
 * Выход: Переход в GRAMMAR_PRACTICE (продолжить практику) или MAIN_MENU
 *
 * Доступные переходы:
 * - "Ещё практика" → GRAMMAR_PRACTICE
 * - "Меню" → MAIN_MENU
 */
export class PracticeResultState extends State {
  readonly type = UserState.PRACTICE_RESULT;

  constructor(private sessionRepository: SessionRepository) {
    super();
  }

  async onEnter(context: StateHandlerContext): Promise<void> {
    // TODO: Загрузить результаты практики и отправить итоговое сообщение
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
