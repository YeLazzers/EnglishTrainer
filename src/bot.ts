import { Bot } from "grammy";

import { createSessionRepository } from "@adapters/session";
import { debugCommand } from "@commands/debug";
import { createDebugRedisCommand } from "@commands/debugRedis";
import { createStartCommand } from "@commands/start";
import { createMessageHandler } from "@handlers/messageWithStateMachine";
import { createStateMachine } from "@sm";

import { getProfile } from "./state";

const token = process.env.BOT_TOKEN;
if (!token) {
	throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(token);

// Инициализировать SessionRepository один раз
const sessionRepository = createSessionRepository();

// Инициализировать State Machine с SessionRepository
const stateMachine = createStateMachine(sessionRepository);

// Регистрировать команды
bot.command("debug", debugCommand);
bot.command("debug_redis", createDebugRedisCommand(sessionRepository));
bot.command("start", createStartCommand(stateMachine));

// Регистрировать обработчик текстовых сообщений
// Этот обработчик инициализирует пользователя и передает в State Machine
bot.on("message:text", createMessageHandler(stateMachine));

// Регистрировать обработчик callback_query (нажатия на inline_buttons)
bot.on("callback_query", async (ctx) => {
	const userId = ctx.from?.id;
	if (!userId) {
		await ctx.answerCallbackQuery({ text: "Ошибка: не удалось определить пользователя" });
		return;
	}

	try {
		const profile = await getProfile(userId);
		await stateMachine.handleCallback(ctx, profile);
	} catch (error) {
		console.error(`[CallbackQuery] Error for user ${userId}:`, error);
		await ctx.answerCallbackQuery({ text: "Произошла ошибка при обработке ответа" });
	}
});

void bot.start();
console.log("[Boot] Bot is running...");
