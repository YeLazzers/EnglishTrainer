import type { Context } from "grammy";
import type { Keyboard } from "grammy";

import type { LimitRepository } from "@domain/limits/repository";
import type { RequestType } from "@domain/limits/types";

/**
 * Проверяет лимит и уведомляет пользователя если лимит исчерпан
 *
 * @param ctx - Grammy context для отправки сообщений
 * @param userId - ID пользователя
 * @param requestType - Тип запроса (THEORY, PRACTICE, FREE_WRITING)
 * @param limitRepository - Репозиторий лимитов
 * @param replyKeyboard - Клавиатура для отображения в сообщении об ошибке
 * @returns true если лимит доступен, false если исчерпан
 */
export async function checkAndNotifyLimit(
	ctx: Context,
	userId: number,
	requestType: RequestType,
	limitRepository: LimitRepository,
	replyKeyboard?: Keyboard
): Promise<boolean> {
	const limitCheck = await limitRepository.checkLimit(userId, requestType);

	if (!limitCheck.allowed) {
		const { currentUsage, limits, reason } = limitCheck;

		switch (reason) {
			case "TOTAL_LIMIT_REACHED":
				await ctx.reply(
					`⏸ Дневной лимит исчерпан!\n\n` +
						`Вы использовали <b>${currentUsage.totalUsed}/${limits.total}</b> запросов сегодня.\n\n` +
						`Лимит обновится завтра в 00:00 UTC.`,
					{
						parse_mode: "HTML",
						reply_markup: replyKeyboard,
					}
				);
				break;

			case "THEORY_LIMIT_REACHED":
				await ctx.reply(
					`📚 Лимит теории на сегодня исчерпан!\n\n` +
						`Вы использовали <b>${currentUsage.theoryUsed}/${limits.maxTheory}</b> запросов теории.\n\n` +
						`Попробуйте практику — осталось <b>${limits.total - currentUsage.totalUsed}</b> запросов.`,
					{
						parse_mode: "HTML",
						reply_markup: replyKeyboard,
					}
				);
				break;
		}

		return false;
	}

	return true;
}
