import { UserState } from "../../domain/types";
import { State } from "../base";
import { StateHandlerContext, StateHandlerResult } from "../types";

/**
 * GRAMMAR_PRACTICE состояние
 *
 * Вход: Пользователь выбрал "Практика на это правило" из GRAMMAR_THEORY
 * Обработка: Показывает серию упражнений, проверяет ответы, дает фидбэк
 * Выход: После завершения серии переход в PRACTICE_RESULT, или MAIN_MENU при пропуске
 *
 * Доступные переходы:
 * - При завершении серии → PRACTICE_RESULT
 * - "Завершить" → PRACTICE_RESULT
 * - "Меню" → MAIN_MENU
 */
export class GrammarPracticeState extends State {
  readonly type = UserState.GRAMMAR_PRACTICE;

  async onEnter(context: StateHandlerContext): Promise<void> {
    // TODO: Инициализировать серию упражнений, загрузить первое упражнение
  }

  async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
    const { ctx, messageText } = context;

    // TODO: Реализовать логику:
    // 1. Проверить ответ пользователя
    // 2. Дать фидбэк
    // 3. Загрузить следующее упражнение или перейти в PRACTICE_RESULT

    switch (messageText) {
      case "Завершить":
        return {
          nextState: UserState.PRACTICE_RESULT,
          handled: true,
        };

      case "Меню":
        return {
          nextState: UserState.MAIN_MENU,
          handled: true,
        };

      default:
        // Предполагаем, что это ответ на упражнение
        // Проверяем ответ и продолжаем
        return { handled: true };
    }
  }

  async onExit(context: StateHandlerContext): Promise<void> {
    // TODO: Сохранить результаты практики, очистить данные сессии
  }
}
