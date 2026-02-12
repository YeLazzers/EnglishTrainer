import { UserState } from "../../domain/types";
import { State } from "../base";
import { StateHandlerContext, StateHandlerResult } from "../types";

/**
 * STATS состояние
 *
 * Вход: Пользователь выбрал "Статистика" из MAIN_MENU
 * Обработка: Показывает общий прогресс, оценки по правилам, слабые зоны, streak
 * Выход: Переход в MAIN_MENU или другой раздел по выбору
 *
 * Доступные переходы:
 * - "По правилам" → Показать детальную статистику
 * - "По сессиям" → Показать историю сессий
 * - "Рекомендации" → Показать рекомендуемые правила
 * - "Меню" → MAIN_MENU
 */
export class StatsState extends State {
  readonly type = UserState.STATS;

  async onEnter(context: StateHandlerContext): Promise<void> {
    // TODO: Загрузить статистику пользователя и отправить основную сводку
  }

  async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
    const { messageText } = context;

    switch (messageText) {
      case "По правилам":
        // TODO: Показать детальную статистику по правилам
        return { handled: true };

      case "По сессиям":
        // TODO: Показать историю сессий
        return { handled: true };

      case "Рекомендации":
        // TODO: Показать рекомендуемые правила для практики
        return { handled: true };

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
