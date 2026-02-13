import { Keyboard } from "grammy";

export const mainMenuKeyboard = new Keyboard()
	.text("Грамматика")
	.text("Практика")
	.row()
	.text("Свободное письмо")
	.text("Статистика")
	.resized();