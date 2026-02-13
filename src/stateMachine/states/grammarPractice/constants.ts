import { Keyboard } from "grammy";

/**
 * Constants for GRAMMAR_PRACTICE state
 * Note: LLM prompts and schemas moved to /src/adapters/practice/prompts/
 */

export const GRAMMAR_PRACTICE_REPLY_KEYBOARD = new Keyboard()
	.text("Пропустить")
	.text("Завершить")
	.row()
	.text("Меню")
	.resized();
