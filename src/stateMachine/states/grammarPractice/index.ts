import { InlineKeyboard } from "grammy";

import type { ExerciseGenerator } from "@domain/practice/exercise-generator";
import type { ExerciseGenerationRequest } from "@domain/practice/types";
import { SessionRepository } from "@domain/session-repository";
import { Exercise, ExerciseType } from "@domain/session-types";
import { UserState } from "@domain/types";
import { State } from "@sm/base";
import { StateHandlerContext, StateHandlerResult } from "@sm/types";

import { GRAMMAR_PRACTICE_REPLY_KEYBOARD } from "./constants";

/**
 * GRAMMAR_PRACTICE состояние
 *
 * Вход: Пользователь выбрал "Практика на это правило" из GRAMMAR_THEORY или "Практика" из MAIN_MENU
 * Обработка: Показывает серию упражнений, проверяет ответы, дает фидбэк
 * Выход: После завершения серии переход в PRACTICE_RESULT, или MAIN_MENU при пропуске
 *
 * Режимы генерации упражнений:
 * - topic: упражнения на конкретное правило (из GRAMMAR_THEORY)
 * - review: упражнения на повторение пройденных правил с приоритетом слабых зон (из MAIN_MENU)
 *
 * Доступные переходы:
 * - При завершении серии → PRACTICE_RESULT
 * - "Завершить" → PRACTICE_RESULT
 * - "Меню" → MAIN_MENU
 */
export class GrammarPracticeState extends State {
	readonly type = UserState.GRAMMAR_PRACTICE;

	constructor(
		private sessionRepository: SessionRepository,
		private exerciseGenerator: ExerciseGenerator
	) {
		super();
	}

	/**
	 * Отправляет упражнение пользователю с соответствующей разметкой (inline_buttons для single_choice)
	 */
	private async sendExercise(
		context: StateHandlerContext,
		exercise: Exercise,
		exerciseNumber: number,
		totalExercises: number
	): Promise<void> {
		const { ctx } = context;
		let message = `<b>#${exerciseNumber}/${totalExercises}</b>\n\n${exercise.question}\n\n`;

		if (exercise.type === ExerciseType.SINGLE_CHOICE && exercise.options) {
			const keyboard = new InlineKeyboard();

			// Добавляем кнопки для каждого варианта ответа
			exercise.options.forEach((option, index) => {
				keyboard.text(option, `answer_${exercise.id}_${index}`).row();
			});

			await ctx.reply(message, {
				parse_mode: "HTML",
				reply_markup: keyboard,
			});
		} else {
			// FILL_IN_BLANK - ожидаем текстовый ответ
			message += "(Напиши ответ текстом)";
			await ctx.reply(message, {
				parse_mode: "HTML",
			});
		}
	}

	async onEnter(context: StateHandlerContext): Promise<void> {
		const { ctx, user, grammarTopicId, grammarRule, profile } = context;

		if (!profile) {
			await ctx.reply("Профиль не найден. Выполни /start.");
			return;
		}

		// Определяем режим генерации
		const mode = grammarTopicId ? "topic" : "review";
		const displayName = grammarRule || "пройденные правила";

		await ctx.reply(`Генерируем упражнения: <b>${displayName}</b>...`, {
			parse_mode: "HTML",
			reply_markup: GRAMMAR_PRACTICE_REPLY_KEYBOARD,
		});

		try {
			// Формируем запрос на генерацию упражнений
			const request: ExerciseGenerationRequest = {
				mode,
				userId: user.id,
				level: profile.level,
				interests: profile.interests,
				goals: profile.goals,
				topicId: grammarTopicId,
				ruleName: grammarRule,
			};

			// Генерируем упражнения через адаптер
			const exercises = await this.exerciseGenerator.generate(request);

			// Создаем сессию в Redis
			const sessionId = await this.sessionRepository.createSession({
				userId: user.id,
				topicId: grammarTopicId || "REVIEW_MIXED",
				grammarRule: displayName,
				level: profile.level,
				exercises,
			});

			console.log(
				`[GrammarPractice] Created session ${sessionId} for user ${user.id} (mode: ${mode}, exercises: ${exercises.length})`
			);

			await ctx.reply(
				`🎯 Начинаем практику: <b>${displayName}</b>\n\nВсего упражнений: ${exercises.length}`,
				{
					parse_mode: "HTML",
					reply_markup: GRAMMAR_PRACTICE_REPLY_KEYBOARD,
				}
			);

			// Показываем первое упражнение
			const session = await this.sessionRepository.getSession(user.id);
			if (session && session.exercises.length > 0) {
				await this.sendExercise(context, session.exercises[0], 1, session.exercises.length);
			}
		} catch (error) {
			console.error(`[GrammarPractice] Error in onEnter for user ${user.id}:`, error);
			await ctx.reply("Не удалось загрузить практику. Попробуй позже или напиши /start.");
		}
	}

	async handle(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { messageText, callbackData } = context;

		// Обработка нажатия на inline_button (callback_query)
		if (callbackData) {
			if (callbackData.startsWith("answer_")) {
				return await this.handleButtonAnswer(context, callbackData);
			}
			return { handled: true };
		}

		// Обработка текстовых сообщений
		switch (messageText) {
			case "Пропустить":
				return await this.handleSkip(context);

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
				// Обработка текстового ответа
				if (messageText.trim()) {
					return await this.handleTextAnswer(context, messageText);
				}
				return { handled: true };
		}
	}

	/**
	 * Обработчик нажатия на inline кнопку с ответом (single_choice)
	 * callback_data формат: answer_{exerciseId}_{optionIndex}
	 */
	private async handleButtonAnswer(
		context: StateHandlerContext,
		callbackData: string
	): Promise<StateHandlerResult> {
		const { ctx, user } = context;

		try {
			// Парсим callback_data: answer_{exerciseId}_{optionIndex}
			const parts = callbackData.split("_");
			if (parts.length < 3) {
				return { handled: true };
			}

			const exerciseId = parts.slice(1, -1).join("_"); // exerciseId может содержать подчеркивания
			const optionIndex = parseInt(parts[parts.length - 1]);

			// Получить сессию
			const session = await this.sessionRepository.getSession(user.id);

			if (!session) {
				await ctx.reply("Сессия не найдена.");
				return { handled: true };
			}

			// Найти упражнение
			const currentExercise = session.exercises[session.currentExerciseIndex];

			if (!currentExercise || currentExercise.id !== exerciseId) {
				await ctx.reply("Упражнение не совпадает.");
				return { handled: true };
			}

			if (!currentExercise.options || optionIndex >= currentExercise.options.length) {
				await ctx.reply("Неверный вариант ответа.");
				return { handled: true };
			}

			// Записать ответ
			const userAnswer = currentExercise.options[optionIndex];
			await this.sessionRepository.updateSession(user.id, {
				exerciseId: currentExercise.id,
				userAnswer,
			});

			// Выдать результат (правильно/неправильно)
			const updatedSession = await this.sessionRepository.getSession(user.id);
			const answeredExercise = updatedSession?.exercises[session.currentExerciseIndex];

			if (answeredExercise?.isCorrect) {
				await ctx.reply("✅ Правильно!");
			} else {
				await ctx.reply(
					`❌ Неправильно. Правильный ответ: <b>${currentExercise.correctAnswer}</b>`,
					{
						parse_mode: "HTML",
					}
				);
			}

			// Выдать следующее упражнение
			await this.sendNextExerciseOrComplete(context);

			return { handled: true };
		} catch (error) {
			console.error(
				`[GrammarPractice] Error handling button answer for user ${user.id}:`,
				error
			);
			await ctx.reply("Ошибка при обработке ответа.", {
				reply_markup: GRAMMAR_PRACTICE_REPLY_KEYBOARD,
			});
			return { handled: true };
		}
	}

	/**
	 * Обработчик текстового ответа
	 */
	private async handleTextAnswer(
		context: StateHandlerContext,
		userAnswer: string
	): Promise<StateHandlerResult> {
		const { ctx, user } = context;

		try {
			const session = await this.sessionRepository.getSession(user.id);

			if (!session) {
				await ctx.reply("Сессия не найдена.");
				return { handled: true };
			}

			const currentExercise = session.exercises[session.currentExerciseIndex];

			if (!currentExercise) {
				await ctx.reply("Упражнение не найдено.");
				return { handled: true };
			}

			// Для single_choice принимаем только нажатие кнопки
			if (currentExercise.type === ExerciseType.SINGLE_CHOICE) {
				await ctx.reply("Выбери ответ, нажав на кнопку выше.");
				return { handled: true };
			}

			// Записать ответ
			await this.sessionRepository.updateSession(user.id, {
				exerciseId: currentExercise.id,
				userAnswer,
			});

			// Выдать результат (правильно/неправильно)
			const updatedSession = await this.sessionRepository.getSession(user.id);
			const answeredExercise = updatedSession?.exercises[session.currentExerciseIndex];

			if (answeredExercise?.isCorrect) {
				await ctx.reply("✅ Правильно!");
			} else {
				const displayAnswer = currentExercise.correctAnswer.split("|")[0].trim();
				await ctx.reply(`❌ Неправильно. Правильный ответ: <b>${displayAnswer}</b>`, {
					parse_mode: "HTML",
				});
			}

			// Выдать следующее упражнение
			await this.sendNextExerciseOrComplete(context);

			return { handled: true };
		} catch (error) {
			console.error(
				`[GrammarPractice] Error handling text answer for user ${user.id}:`,
				error
			);
			await ctx.reply("Ошибка при обработке ответа.", {
				reply_markup: GRAMMAR_PRACTICE_REPLY_KEYBOARD,
			});
			return { handled: true };
		}
	}

	/**
	 * Выдает следующее упражнение или завершает сессию если упражнения закончились
	 */
	private async sendNextExerciseOrComplete(context: StateHandlerContext): Promise<void> {
		const { ctx, user } = context;

		try {
			const session = await this.sessionRepository.getSession(user.id);

			if (!session) {
				await ctx.reply("Ошибка сессии.");
				return;
			}

			// Проверить, есть ли следующее упражнение
			if (session.currentExerciseIndex < session.exercises.length) {
				const nextExercise = session.exercises[session.currentExerciseIndex];
				const exerciseNumber = session.currentExerciseIndex + 1;
				await this.sendExercise(
					context,
					nextExercise,
					exerciseNumber,
					session.exercises.length
				);
			} else {
				// Все упражнения закончились - завершить сессию
				await this.sessionRepository.completeSession(user.id);
				await ctx.reply(
					"🎉 Все упражнения закончились!\n\nНажми 'Завершить' для просмотра результатов.",
					{
						reply_markup: GRAMMAR_PRACTICE_REPLY_KEYBOARD,
					}
				);
			}
		} catch (error) {
			console.error(
				`[GrammarPractice] Error in sendNextExerciseOrComplete for user ${user.id}:`,
				error
			);
			await ctx.reply("Ошибка при загрузке упражнения.", {
				reply_markup: GRAMMAR_PRACTICE_REPLY_KEYBOARD,
			});
		}
	}

	/**
	 * Обработчик пропуска упражнения (пустой ответ)
	 */
	private async handleSkip(context: StateHandlerContext): Promise<StateHandlerResult> {
		const { ctx, user } = context;

		try {
			const session = await this.sessionRepository.getSession(user.id);

			if (!session) {
				await ctx.reply("Сессия не найдена. Начни заново с /start.");
				return { handled: true };
			}

			// Получить текущее упражнение
			const currentExercise = session.exercises[session.currentExerciseIndex];

			if (!currentExercise) {
				await ctx.reply("Все упражнения закончились!");
				return { handled: true };
			}

			// Пропустить упражнение (пустой ответ)
			await this.sessionRepository.updateSession(user.id, {
				exerciseId: currentExercise.id,
				userAnswer: "",
			});

			// Выдать следующее упражнение или завершить сессию
			await this.sendNextExerciseOrComplete(context);

			return { handled: true };
		} catch (error) {
			console.error(`[GrammarPractice] Error skipping exercise for user ${user.id}:`, error);
			await ctx.reply("Ошибка при пропуске упражнения.", {
				reply_markup: GRAMMAR_PRACTICE_REPLY_KEYBOARD,
			});
			return { handled: true };
		}
	}
}
