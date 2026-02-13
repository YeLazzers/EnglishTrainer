import { Bot } from "grammy";

import { createGrammarRepository } from "@adapters/db/grammar";
import { createUserRepository } from "@adapters/db/user";
import { createSessionRepository } from "@adapters/session";
import { debugCommand } from "@commands/debug";
import { createDebugRedisCommand } from "@commands/debugRedis";
import { createStartCommand } from "@commands/start";
import { createMessageHandler } from "@handlers/messageWithStateMachine";
import { createStateMachine } from "@sm";

const token = process.env.BOT_TOKEN;
if (!token) {
	throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(token);

// Инициализировать UserRepository один раз
const userRepository = createUserRepository();

// Инициализировать SessionRepository один раз
const sessionRepository = createSessionRepository();

// Инициализировать GrammarRepository один раз
const grammarRepository = createGrammarRepository();

// Инициализировать State Machine с SessionRepository, UserRepository и GrammarRepository
const stateMachine = createStateMachine(sessionRepository, userRepository, grammarRepository);

// Регистрировать команды
bot.command("debug", debugCommand);
bot.command("debug_redis", createDebugRedisCommand(sessionRepository));
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
