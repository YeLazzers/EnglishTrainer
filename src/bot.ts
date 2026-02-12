import { Bot } from "grammy";
import { debugCommand } from "./commands/debug";
import { createStartCommand } from "./commands/start";
import { createMessageHandler } from "./handlers/messageWithStateMachine";
import { createStateMachine } from "./stateMachine";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(token);

// Инициализировать State Machine
const stateMachine = createStateMachine();

// Регистрировать команды
bot.command("debug", debugCommand);
bot.command("start", createStartCommand(stateMachine));

// Регистрировать обработчик текстовых сообщений
// Этот обработчик инициализирует пользователя и передает в State Machine
bot.on("message:text", createMessageHandler(stateMachine));

bot.start();
console.log("[Boot] Bot is running...");
