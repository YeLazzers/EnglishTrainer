import { Context } from "grammy";
import { UserState, UserProfile } from "../domain/types";

/**
 * Context passed to state handlers
 * Содержит все необходимое для обработки сообщения в состоянии
 */
export interface StateHandlerContext {
  ctx: Context;
  userId: number;
  messageText: string; // Для текстовых сообщений
  callbackData?: string; // Для callback_query (нажатия на кнопки)
  currentState: UserState;
  profile: UserProfile | undefined; // Профиль пользователя (может быть undefined в ONBOARDING)
}

/**
 * Result of state handler execution
 * Определяет переход в новое состояние или остаток в текущем
 */
export interface StateHandlerResult {
  nextState?: UserState; // Если не указано, остаемся в текущем состоянии
  handled: boolean; // Было ли сообщение обработано
}

/**
 * Handler для обработки текстового сообщения в конкретном состоянии
 */
export type StateMessageHandler = (
  context: StateHandlerContext
) => Promise<StateHandlerResult>;

/**
 * Конфигурация состояния
 * Все методы принимают единый StateHandlerContext
 */
export interface StateConfig {
  type: UserState;
  onEnter?: (context: StateHandlerContext) => Promise<void>;
  handle: StateMessageHandler;
  onExit?: (context: StateHandlerContext) => Promise<void>;
}
