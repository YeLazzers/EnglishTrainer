import { UserState } from "../../domain/types";
import { State } from "../base";
import { StateHandlerContext, StateHandlerResult } from "../types";

/**
 * WRITING_FEEDBACK состояние
 *
 * Вход: Пользователь отправил текст для оценки из FREE_WRITING
 * Обработка: LLM оценивает текст (грамматика, вокабуляр, сильные/слабые стороны)
 * Выход: После отправки фидбэка переход в MAIN_MENU или возврат в FREE_WRITING
 *
 * Доступные переходы:
 * - "Написать ещё" → FREE_WRITING
 * - "Меню" → MAIN_MENU
 */
export class WritingFeedbackState extends State {
  readonly type = UserState.WRITING_FEEDBACK;

  async onEnter(context: StateHandlerContext): Promise<void> {
    // TODO: Загрузить текст пользователя из предыдущего состояния
    // и отправить LLM запрос на анализ
  }

  async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
    const { messageText } = context;

    switch (messageText) {
      case "Написать ещё":
        return {
          nextState: UserState.FREE_WRITING,
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
