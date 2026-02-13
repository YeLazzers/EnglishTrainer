import { Context } from "grammy";

import { UserState } from "@domain/types";
import type { User, UserProfile } from "@domain/user/types";

/**
 * Context passed to state handlers
 * Содержит все необходимое для обработки сообщения в состоянии
 *
 * user.state — текущее состояние пользователя (заменяет бывший currentState)
 * user.id — ID пользователя (заменяет бывший userId)
 */
export interface StateHandlerContext {
	ctx: Context;
	user: User;
	messageText: string; // Для текстовых сообщений
	callbackData?: string; // Для callback_query (нажатия на кнопки)
	profile: UserProfile | undefined; // Профиль пользователя (может быть undefined в ONBOARDING)
	grammarRule?: string; // Название грамматического правила (передается из GRAMMAR_THEORY в GRAMMAR_PRACTICE)
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
 * Конфигурация состояния
 * Все методы принимают единый StateHandlerContext
 */
export interface StateConfig {
	type: UserState;
	onEnter?: (context: StateHandlerContext) => Promise<void>;
	/**
	 * Handler для обработки текстового сообщения в конкретном состоянии
	 */
	handle: (context: StateHandlerContext) => Promise<StateHandlerResult>;
	onExit?: (context: StateHandlerContext) => Promise<void>;
}
