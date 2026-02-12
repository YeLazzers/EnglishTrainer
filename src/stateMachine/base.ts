import { UserState } from "@domain/types";

import { StateConfig, StateHandlerContext, StateHandlerResult } from "./types";

/**
 * Абстрактный базовый класс для всех состояний
 *
 * Каждое конкретное состояние наследуется от этого класса и реализует:
 * - onEnter() - инициализация при входе в состояние
 * - handle() - обработка текстового сообщения
 * - onExit() - очистка при выходе из состояния
 */
export abstract class State implements StateConfig {
	/**
	 * Тип состояния (используется для идентификации)
	 */
	abstract readonly type: UserState;

	/**
	 * Вызывается при входе в это состояние
	 * Используется для инициализации, отправки приветственного сообщения, и т.д.
	 *
	 * @param context Контекст с информацией о состоянии, пользователе и Telegram Context
	 */
	async onEnter(_: StateHandlerContext): Promise<void> {
		// По умолчанию ничего не делаем
	}

	/**
	 * Обрабатывает входящее текстовое сообщение
	 *
	 * @param context Контекст с информацией о сообщении и состоянии
	 * @returns Результат обработки с возможным переходом в новое состояние
	 */
	abstract handle(context: StateHandlerContext): Promise<StateHandlerResult>;

	/**
	 * Вызывается при выходе из этого состояния
	 * Используется для очистки данных, сохранения информации, и т.д.
	 *
	 * @param context Контекст с информацией о состоянии, пользователе и Telegram Context
	 */
	async onExit(_: StateHandlerContext): Promise<void> {
		// По умолчанию ничего не делаем
	}
}
