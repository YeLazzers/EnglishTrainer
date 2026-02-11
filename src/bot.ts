import { Bot } from "grammy";
import { debugCommand } from "./commands/debug";
import { startCommand } from "./commands/start";
import { handleTextMessage } from "./handlers/textMessage";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(token);

bot.command("debug", debugCommand);
bot.command("start", startCommand);
bot.on("message:text", handleTextMessage);

bot.start();
console.log("Bot is running...");
