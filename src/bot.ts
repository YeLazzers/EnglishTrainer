// IMPORTANT: Load environment variables first (before any other imports)
import { existsSync } from "fs";

import { config } from "dotenv";

// Version marker for debugging Railway deployment
console.log("🚀 Bot starting - BUILD_VERSION: 2026-02-15-v4");

// Load .env only if it exists (development mode)
// In production (Docker/Railway), env vars are passed directly
if (existsSync(".env")) {
	console.log("✅ .env file found, loading with dotenv");
	config();
} else {
	console.log("ℹ️  No .env file, using system environment variables (production mode)");
}

import { Bot } from "grammy";

import { createGrammarRepository } from "@adapters/db/grammar";
import { createUserRepository } from "@adapters/db/user";
import { createLimitRepository } from "@adapters/limits";
import { createExerciseGenerator } from "@adapters/practice";
import { createSessionRepository } from "@adapters/session";
import { debugCommand } from "@commands/debug";
import { createDebugLimitsCommand } from "@commands/debugLimits";
import { createDebugRedisCommand } from "@commands/debugRedis";
import { createStartCommand } from "@commands/start";
import { createMessageHandler } from "@handlers/messageWithStateMachine";
import { createStateMachine } from "@sm";

// DEBUG: Print environment variables
console.log("[DEBUG] Environment variables:");
console.log("BOT_TOKEN:", process.env.BOT_TOKEN ? "✓ set" : "✗ missing");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ set" : "✗ missing");
console.log("REDIS_URL:", process.env.REDIS_URL ? "✓ set" : "✗ missing");
console.log("All env keys:", Object.keys(process.env).filter(k => !k.startsWith("npm_")).slice(0, 20).join(", "));

const token = process.env.BOT_TOKEN;
if (!token) {
	throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(token);

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
	limitRepository
);

// Регистрировать команды
bot.command("debug", debugCommand);
bot.command("debug_redis", createDebugRedisCommand(sessionRepository));
bot.command("debug_limits", createDebugLimitsCommand(limitRepository));
bot.command("start", createStartCommand(stateMachine, userRepository));

// Регистрировать обработчик текстовых сообщений
// Этот обработчик инициализирует пользователя и передает в State Machine
bot.on("message:text", createMessageHandler(stateMachine, userRepository));

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
		console.error(`[CallbackQuery] Error for user ${userId}:`, error);
		await ctx.answerCallbackQuery({ text: "Произошла ошибка при обработке ответа" });
	}
});

// Глобальный обработчик ошибок
bot.catch((err) => {
	const ctx = err.ctx;
	console.error("[Bot Error]", err.error);
	if (ctx && ctx.reply) {
		ctx.reply("Произошла непредвиденная ошибка. Попробуйте позже.").catch(() => {});
	}
});

void bot.start();
console.log("[Boot] Bot is running...");
