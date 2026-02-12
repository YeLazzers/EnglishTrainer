import { UserState } from "../../domain/types";
import { State } from "../base";
import { StateHandlerContext, StateHandlerResult } from "../types";
import { mainMenuKeyboard } from "../../keyboards";

/**
 * MAIN_MENU состояние
 *
 * Вход: Пользователь завершил онбординг или вернулся из другого раздела
 * Обработка: Маршрутизирует выбор пользователя (Грамматика, Практика, Свободное письмо, Статистика)
 * Выход: Переход в выбранный раздел
 *
 * Доступные переходы:
 * - "Грамматика" → GRAMMAR_THEORY
 * - "Практика" → GRAMMAR_PRACTICE (когда будет готово)
 * - "Свободное письмо" → FREE_WRITING (когда будет готово)
 * - "Статистика" → STATS (когда будет готово)
 */
export class MainMenuState extends State {
  readonly type = UserState.MAIN_MENU;

  async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
    const { ctx, messageText } = context;

    switch (messageText) {
      case "Грамматика":
        return {
          nextState: UserState.GRAMMAR_THEORY,
          handled: true,
        };

      case "Практика":
        // TODO: Реализовать GRAMMAR_PRACTICE
        await ctx.reply("TODO: Раздел Практика в разработке", {
          reply_markup: mainMenuKeyboard,
        });
        return { handled: true };

      case "Свободное письмо":
        // TODO: Реализовать FREE_WRITING
        await ctx.reply("TODO: Раздел Свободное письмо в разработке", {
          reply_markup: mainMenuKeyboard,
        });
        return { handled: true };

      case "Статистика":
        // TODO: Реализовать STATS
        await ctx.reply("TODO: Раздел Статистика в разработке", {
          reply_markup: mainMenuKeyboard,
        });
        return { handled: true };

      default:
        // Неизвестный ввод
        await ctx.reply("Выбери раздел из меню ниже.", {
          reply_markup: mainMenuKeyboard,
        });
        return { handled: true };
    }
  }

  /**
   * Вход в MAIN_MENU: отправляем краткую сводку
   * (В будущем можно добавить streak, последнюю активность, рекомендации)
   */
  async onEnter(context: StateHandlerContext): Promise<void> {
    // TODO: Загрузить профиль пользователя и отправить сводку
  }
}
