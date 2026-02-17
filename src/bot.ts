// IMPORTANT: Load environment variables first (before any other imports)
import { existsSync } from "fs";

import { config } from "dotenv";

// Load .env only if it exists (development mode)
// In production (Docker/Railway), env vars are passed directly
if (existsSync(".env")) {
	config();
}

import { Bot } from "grammy";

import { createGrammarRepository } from "@adapters/db/grammar";
import { createUserRepository } from "@adapters/db/user";
import { createLimitRepository } from "@adapters/limits";
import { createExerciseGenerator } from "@adapters/practice";
import { createSessionRepository } from "@adapters/session";
import { createDebugCommand } from "@commands/debug";
import { createDebugLimitsCommand } from "@commands/debugLimits";
import { createDebugRedisCommand } from "@commands/debugRedis";
import { createStartCommand } from "@commands/start";
import { createMessageHandler } from "@handlers/messageWithStateMachine";
import { createStateMachine } from "@sm";

import { detectUpdateType, ErrorReporter } from "./observability/error-reporter";
import { logger } from "./observability/logger";

const token = process.env.BOT_TOKEN;
if (!token) {
	throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(token);
const errorReporter = new ErrorReporter(bot);
const { reportError } = errorReporter;

// Инициализировать UserRepository один раз
const userRepository = createUserRepository();

// Инициализировать SessionRepository один раз
const sessionRepository = createSessionRepository();

// Инициализировать LimitRepository один раз
const limitRepository = createLimitRepository();

// Инициализировать GrammarRepository один раз
const grammarRepository = createGrammarRepository();

// Инициализировать ExerciseGenerator один раз
const exerciseGenerator = createExerciseGenerator(grammarRepository);

// Инициализировать State Machine с SessionRepository, UserRepository, GrammarRepository, ExerciseGenerator и LimitRepository
const stateMachine = createStateMachine(
	sessionRepository,
	userRepository,
	grammarRepository,
	exerciseGenerator,
	limitRepository,
	reportError
);

// Регистрировать команды
bot.command("debug", createDebugCommand(userRepository));
bot.command("debug_redis", createDebugRedisCommand(sessionRepository));
bot.command("debug_limits", createDebugLimitsCommand(limitRepository));
bot.command("start", createStartCommand(stateMachine, userRepository));

// Middleware: lightweight update tracing for production diagnostics
bot.use(async (ctx, next) => {
	const start = Date.now();
	const shouldLogUpdates = process.env.LOG_UPDATES === "true";

	if (shouldLogUpdates) {
		logger.info("update.received", {
			updateId: ctx.update.update_id,
			updateType: detectUpdateType(ctx),
			fromId: ctx.from?.id,
			chatId: ctx.chat?.id,
		});
	}

	await next();

	if (shouldLogUpdates) {
		logger.info("update.handled", {
			updateId: ctx.update.update_id,
			updateType: detectUpdateType(ctx),
			durationMs: Date.now() - start,
		});
	}
});

// Регистрировать обработчик текстовых сообщений
// Этот обработчик инициализирует пользователя и передает в State Machine
bot.on("message:text", createMessageHandler(stateMachine, userRepository, reportError));

// Регистрировать обработчик callback_query (нажатия на inline_buttons)
bot.on("callback_query", async (ctx) => {
	const userId = ctx.from?.id;
	if (!userId) {
		await ctx.answerCallbackQuery({ text: "Ошибка: не удалось определить пользователя" });
		return;
	}

	try {
		const user = await userRepository.findById(userId);

		if (!user) {
			// Пользователь не вызвал /start — игнорируем
			await ctx.answerCallbackQuery();
			return;
		}

		const profile = await userRepository.getProfile(userId);

		await stateMachine.handleCallback(ctx, user, profile ?? undefined);
	} catch (error) {
		await reportError({
			scope: "callback_query",
			error,
			ctx,
			meta: { userId },
		});
		await ctx.answerCallbackQuery({ text: "Произошла ошибка при обработке ответа" });
	}
});

// Глобальный обработчик ошибок
bot.catch(async (err) => {
	const ctx = err.ctx;
	await reportError({
		scope: "bot.catch",
		error: err.error,
		ctx,
	});
	if (ctx && ctx.reply) {
		ctx.reply("Произошла непредвиденная ошибка. Попробуйте позже.").catch(() => {});
	}
});

process.on("unhandledRejection", (reason) => {
	void reportError({
		scope: "process.unhandledRejection",
		error: reason,
	});
});

process.on("uncaughtException", (error) => {
	void reportError({
		scope: "process.uncaughtException",
		error,
	});
});

void bot.start();
logger.info("bot.started");
