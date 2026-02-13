import { Context } from "grammy";

import type { GrammarRepository } from "@domain/grammar/repository";
import { SessionRepository } from "@domain/session-repository";
import { UserState } from "@domain/types";
import { UserRepository } from "@domain/user/repository";
import type { User, UserProfile } from "@domain/user/types";

import { State } from "./base";
import {
	OnboardingState,
	MainMenuState,
	GrammarTheoryState,
	GrammarPracticeState,
	PracticeResultState,
	FreeWritingState,
	WritingFeedbackState,
	StatsState,
} from "./states";
import { StateHandlerContext } from "./types";

/**
 * State Machine - координатор переходов между состояниями
 *
 * Отвечает за:
 * 1. Маршрутизацию сообщения в нужный обработчик состояния
 * 2. Управление входом (onEnter) и выходом (onExit) из состояний
 * 3. Сохранение нового состояния при переходе
 *
 * Принцип работы:
 * - Объект User (с текущим state) приходит из entry point (handler/command)
 * - Machine передает сообщение в обработчик состояния user.state
 * - Если обработчик вернул nextState, выполняет переход:
 *   1. Вызывает onExit текущего состояния
 *   2. Сохраняет новое состояние в БД
 *   3. Вызывает onEnter нового состояния
 */
export class StateMachine {
	private states: Map<UserState, State> = new Map();

	constructor(private userRepository: UserRepository) {}

	/**
	 * Регистрирует обработчик для состояния
	 */
	register(state: State): void {
		this.states.set(state.type, state);
	}

	/**
	 * Обрабатывает входящее сообщение пользователя
	 *
	 * @param ctx grammy Context
	 * @param user Объект пользователя (содержит state)
	 * @param profile Профиль пользователя (может быть undefined для новых пользователей)
	 */
	async handleMessage(ctx: Context, user: User, profile: UserProfile | undefined): Promise<void> {
		const messageText = ctx.message?.text;

		if (!messageText) {
			await ctx.reply("Пожалуйста, отправь текстовое сообщение.");
			return;
		}

		if (process.env.DEBUG_STATE_MACHINE === "true") {
			console.log(`[Message] User ${user.id} (${user.state}) → processing message`);
		}

		// Находим обработчик для этого состояния
		const stateHandler = this.states.get(user.state);
		if (!stateHandler) {
			console.error(`No handler registered for state: ${user.state}`);
			await ctx.reply("Внутренняя ошибка. Выполни /start.");
			return;
		}

		// Создаем контекст, который будет переиспользоваться на протяжении цикла
		const context: StateHandlerContext = {
			ctx,
			user,
			messageText,
			profile,
		};

		const result = await stateHandler.handle(context);

		// Если обработчик вернул переход в новое состояние
		if (result.nextState && result.nextState !== user.state) {
			await this.transition(user.state, result.nextState, context);
		}
	}

	/**
	 * Обрабатывает callback_query (нажатия на inline_buttons)
	 *
	 * @param ctx grammy Context
	 * @param user Объект пользователя (содержит state)
	 * @param profile Профиль пользователя
	 */
	async handleCallback(ctx: Context, user: User, profile: UserProfile | undefined): Promise<void> {
		const callbackData = ctx.callbackQuery?.data;

		if (!callbackData) {
			await ctx.answerCallbackQuery({ text: "Ошибка обработки" });
			return;
		}

		try {
			if (process.env.DEBUG_STATE_MACHINE === "true") {
				console.log(`[Callback] User ${user.id} (${user.state}) → data: ${callbackData}`);
			}

			// Находим обработчик для этого состояния
			const stateHandler = this.states.get(user.state);
			if (!stateHandler) {
				console.error(`No handler registered for state: ${user.state}`);
				await ctx.answerCallbackQuery({ text: "Ошибка" });
				return;
			}

			// Создаем контекст с callback_data вместо messageText
			const context: StateHandlerContext = {
				ctx,
				user,
				messageText: "", // Для callback_query messageText пуст
				callbackData,
				profile,
			};

			const result = await stateHandler.handle(context);

			// Если обработчик вернул переход в новое состояние
			if (result.nextState && result.nextState !== user.state) {
				await this.transition(user.state, result.nextState, context);
			}

			await ctx.answerCallbackQuery();
		} catch (error) {
			console.error(`[Callback] Error for user ${user.id}:`, error);
			await ctx.answerCallbackQuery({ text: "Произошла ошибка" });
		}
	}

	/**
	 * Явно изменяет состояние пользователя
	 * Используется для команд и других явных переходов
	 *
	 * @param user Объект пользователя
	 * @param nextState Новое состояние
	 * @param ctx grammy Context
	 * @param profile Профиль пользователя (опционально)
	 */
	async changeStateTo(
		user: User,
		nextState: UserState,
		ctx: Context,
		profile: UserProfile | undefined = undefined
	): Promise<void> {
		// Создаем контекст для обработчиков
		const context: StateHandlerContext = {
			ctx,
			user,
			messageText: "",
			profile,
		};

		// Выполняем переход
		await this.transition(user.state, nextState, context);
	}

	/**
	 * Выполняет переход в новое состояние
	 *
	 * Процесс:
	 * 1. onExit текущего состояния
	 * 2. setState в БД
	 * 3. onEnter нового состояния
	 *
	 * @param fromState Состояние, из которого переходим
	 * @param toState Состояние, в которое переходим
	 * @param context Контекст с информацией о пользователе и Telegram
	 */
	private async transition(
		fromState: UserState,
		toState: UserState,
		context: StateHandlerContext
	): Promise<void> {
		// Выход из текущего состояния
		const currentStateHandler = this.states.get(fromState);
		if (currentStateHandler) {
			await currentStateHandler.onExit(context);
		}

		// Сохраняем новое состояние в БД
		await this.userRepository.setState(context.user.id, toState);

		// Обновляем состояние в объекте пользователя
		context.user.state = toState;

		// Вход в новое состояние
		const newStateHandler = this.states.get(toState);
		if (newStateHandler) {
			await newStateHandler.onEnter(context);
		}
	}
}

/**
 * Создает и возвращает инстанс State Machine с зарегистрированными состояниями
 *
 * @param sessionRepository SessionRepository для управления практическими сессиями
 * @param userRepository UserRepository для управления пользователями и профилями
 * @param grammarRepository GrammarRepository для работы с грамматическими топиками и прогрессом
 */
export function createStateMachine(
	sessionRepository: SessionRepository,
	userRepository: UserRepository,
	grammarRepository: GrammarRepository
): StateMachine {
	const machine = new StateMachine(userRepository);

	// Регистрируем все состояния
	machine.register(new OnboardingState(userRepository));
	machine.register(new MainMenuState());
	machine.register(new GrammarTheoryState(grammarRepository));
	machine.register(new GrammarPracticeState(sessionRepository));
	machine.register(new PracticeResultState(sessionRepository, grammarRepository));
	machine.register(new FreeWritingState());
	machine.register(new WritingFeedbackState());
	machine.register(new StatsState());

	console.log("[Boot] State Machine initialized");

	return machine;
}
