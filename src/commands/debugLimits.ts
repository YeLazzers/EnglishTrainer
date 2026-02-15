import { Context } from "grammy";

import type { LimitRepository } from "@domain/limits/repository";
import { RequestType } from "@domain/limits/types";

/**
 * /debug_limits команда
 *
 * Показывает текущее использование лимитов пользователя
 * Позволяет сбросить лимиты (для тестирования)
 *
 * Использование:
 * - /debug_limits - показать текущее использование
 * - /debug_limits reset - сбросить лимиты
 */
export function createDebugLimitsCommand(limitRepository: LimitRepository) {
	return async (ctx: Context) => {
		const userId = ctx.from?.id;

		if (!userId) {
			await ctx.reply("❌ Не удалось определить пользователя");
			return;
		}

		const args = ctx.message?.text?.split(" ").slice(1) || [];
		const command = args[0];

		try {
			// Получаем реальные лимиты через checkLimit
			const limitCheck = await limitRepository.checkLimit(userId, RequestType.THEORY);
			const limits = limitCheck.limits;

			if (command === "reset") {
				// Сбросить лимиты
				await limitRepository.resetUsage(userId);
				await ctx.reply(
					`✅ Лимиты сброшены!\n\nТеперь доступно: ${limits.total}/${limits.total} запросов`
				);
				return;
			}

			// Показать текущее использование
			const usage = await limitRepository.getUsage(userId);

			const remaining = limits.total - usage.totalUsed;
			const theoryRemaining = limits.maxTheory - usage.theoryUsed;

			let message = "<b>📊 Использование лимитов</b>\n\n";
			message += `Дата: <code>${usage.date}</code>\n\n`;
			message += `Всего: <b>${usage.totalUsed}/${limits.total}</b> (осталось: ${remaining})\n`;
			message += `└ Теория: <b>${usage.theoryUsed}/${limits.maxTheory}</b> (осталось: ${theoryRemaining})\n`;
			message += `└ Практика: <b>${usage.practiceUsed}</b>\n`;
			message += `└ Свободное письмо: <b>${usage.freeWritingUsed}</b>\n\n`;

			if (usage.totalUsed >= limits.total) {
				message += "⏸ Дневной лимит исчерпан!\n";
			} else if (usage.theoryUsed >= limits.maxTheory) {
				message += "📚 Лимит теории исчерпан (попробуйте практику).\n";
			} else {
				message += "✅ Лимиты доступны.\n";
			}

			message += "\n<i>Команды:</i>\n";
			message += "<code>/debug_limits</code> — показать статистику\n";
			message += "<code>/debug_limits reset</code> — сбросить лимиты";

			await ctx.reply(message, { parse_mode: "HTML" });
		} catch (error) {
			console.error(`[DebugLimits] Error for user ${userId}:`, error);
			await ctx.reply("❌ Ошибка при получении информации о лимитах");
		}
	};
}
