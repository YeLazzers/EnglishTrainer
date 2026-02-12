import { Context } from "grammy";

import { SessionRepository } from "../domain/session-repository";
import { UserState, UserProfile } from "../domain/types";
import { getState, setState } from "../state";

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
 * 1. Определение текущего состояния пользователя
 * 2. Маршрутизацию сообщения в нужный обработчик состояния
 * 3. Управление входом (onEnter) и выходом (onExit) из состояний
 * 4. Сохранение нового состояния при переходе
 *
 * Принцип работы:
 * - Когда приходит сообщение, machine определяет текущее состояние
 * - Передает сообщение в обработчик этого состояния
 * - Если обработчик вернул nextState, выполняет переход:
 *   1. Вызывает onExit текущего состояния
 *   2. Сохраняет новое состояние в БД
 *   3. Вызывает onEnter нового состояния
 */
export class StateMachine {
	private states: Map<UserState, State> = new Map();

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
	 * @param profile Профиль пользователя (может быть undefined для новых пользователей)
	 */
	async handleMessage(ctx: Context, profile: UserProfile | undefined): Promise<void> {
		const userId = ctx.from?.id;
		if (!userId) {
			await ctx.reply("Ошибка: не удалось определить пользователя");
			return;
		}

		const messageText = ctx.message?.text;

		if (!messageText) {
			await ctx.reply("Пожалуйста, отправь текстовое сообщение.");
			return;
		}

		// Получаем текущее состояние пользователя
		const currentState = await getState(userId);

		// Если пользователя нет в БД, инициализируем в ONBOARDING
		if (!currentState) {
			// changeStateTo вызовет onEnter для ONBOARDING и отправит приветствие
			await this.changeStateTo(userId, UserState.ONBOARDING, ctx, profile);
			return; // Не обрабатываем первое сообщение, пользователь должен прочитать приветствие
		}

		// Логирование (опционально, можно закомментировать)
		if (process.env.DEBUG_STATE_MACHINE === "true") {
			console.log(`[Message] User ${userId} (${currentState ?? "NEW"}) → processing message`);
		}

		// Находим обработчик для этого состояния
		const stateHandler = this.states.get(currentState);
		if (!stateHandler) {
			console.error(`No handler registered for state: ${currentState}`);
			await ctx.reply("Внутренняя ошибка. Выполни /start.");
			return;
		}

		// Создаем контекст, который будет переиспользоваться на протяжении цикла
		const context: StateHandlerContext = {
			ctx,
			userId,
			messageText,
			currentState,
			profile,
		};

		const result = await stateHandler.handle(context);

		// Если обработчик вернул переход в новое состояние
		if (result.nextState && result.nextState !== currentState) {
			await this.transition(currentState, result.nextState, context);
		}
	}

	/**
	 * Обрабатывает callback_query (нажатия на inline_buttons)
	 *
	 * @param ctx grammy Context
	 * @param profile Профиль пользователя
	 */
	async handleCallback(ctx: Context, profile: UserProfile | undefined): Promise<void> {
		const userId = ctx.from?.id;
		if (!userId) {
			await ctx.reply("Ошибка: не удалось определить пользователя");
			return;
		}

		const callbackData = ctx.callbackQuery?.data;

		if (!callbackData) {
			await ctx.answerCallbackQuery({ text: "Ошибка обработки" });
			return;
		}

		try {
			// Получаем текущее состояние пользователя
			const currentState = await getState(userId);

			if (!currentState) {
				await ctx.answerCallbackQuery({ text: "Начни новую практику" });
				return;
			}

			if (process.env.DEBUG_STATE_MACHINE === "true") {
				console.log(`[Callback] User ${userId} (${currentState}) → data: ${callbackData}`);
			}

			// Находим обработчик для этого состояния
			const stateHandler = this.states.get(currentState);
			if (!stateHandler) {
				console.error(`No handler registered for state: ${currentState}`);
				await ctx.answerCallbackQuery({ text: "Ошибка" });
				return;
			}

			// Создаем контекст с callback_data вместо messageText
			const context: StateHandlerContext = {
				ctx,
				userId,
				messageText: "", // Для callback_query messageText пуст
				callbackData, // Передаем callback_data
				currentState,
				profile,
			};

			const result = await stateHandler.handle(context);

			// Если обработчик вернул переход в новое состояние
			if (result.nextState && result.nextState !== currentState) {
				await this.transition(currentState, result.nextState, context);
			}

			await ctx.answerCallbackQuery();
		} catch (error) {
			console.error(`[Callback] Error for user ${userId}:`, error);
			await ctx.answerCallbackQuery({ text: "Произошла ошибка" });
		}
	}

	/**
	 * Явно изменяет состояние пользователя
	 * Используется для команд и других явных переходов
	 *
	 * @param userId ID пользователя
	 * @param nextState Новое состояние
	 * @param ctx grammy Context
	 * @param profile Профиль пользователя (опционально)
	 */
	async changeStateTo(
		userId: number,
		nextState: UserState,
		ctx: Context,
		profile: UserProfile | undefined = undefined
	): Promise<void> {
		const currentState = await getState(userId);

		// Создаем контекст для обработчиков
		const context: StateHandlerContext = {
			ctx,
			userId,
			messageText: "",
			currentState: currentState || nextState,
			profile,
		};

		// Выполняем переход (fromState может быть undefined для новых пользователей)
		await this.transition(currentState || undefined, nextState, context);
	}

	/**
	 * Выполняет переход в новое состояние
	 *
	 * Процесс:
	 * 1. onExit текущего состояния (если оно существует)
	 * 2. setState в БД
	 * 3. onEnter нового состояния
	 *
	 * @param fromState Состояние, из которого переходим (опционально для инициализации)
	 * @param toState Состояние, в которое переходим
	 * @param context Контекст с информацией о пользователе и Telegram
	 */
	private async transition(
		fromState: UserState | undefined,
		toState: UserState,
		context: StateHandlerContext
	): Promise<void> {
		// Выход из текущего состояния (если оно было)
		if (fromState) {
			const currentStateHandler = this.states.get(fromState);
			if (currentStateHandler) {
				await currentStateHandler.onExit(context);
			}
		}

		// Сохраняем новое состояние
		await setState(context.userId, toState);

		// Обновляем контекст с новым состоянием
		context.currentState = toState;

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
 */
export function createStateMachine(sessionRepository: SessionRepository): StateMachine {
	const machine = new StateMachine();

	// Регистрируем все состояния
	machine.register(new OnboardingState());
	machine.register(new MainMenuState());
	machine.register(new GrammarTheoryState());
	machine.register(new GrammarPracticeState(sessionRepository));
	machine.register(new PracticeResultState(sessionRepository));
	machine.register(new FreeWritingState());
	machine.register(new WritingFeedbackState());
	machine.register(new StatsState());

	console.log("[Boot] State Machine initialized");

	return machine;
}
