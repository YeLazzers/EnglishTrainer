import { Context } from "grammy";

import type { UserRepository } from "@adapters/db/user";

/**
 * Фабрика для создания обработчика команды /debug
 * Принимает UserRepository для доступа к данным пользователя
 */
export function createDebugCommand(userRepository: UserRepository) {
	return async (ctx: Context): Promise<void> => {
		const userId = ctx.from?.id;
		if (!userId) {
			await ctx.reply("Ошибка: не удалось определить пользователя");
			return;
		}

		const user = await userRepository.findById(userId);
		const profile = await userRepository.getProfile(userId);

		const lines = [`State: ${user?.state ?? "NONE"}`];
		if (profile) {
			lines.push(`Level: ${profile.level}`);
			lines.push(`Goals: ${profile.goals.join(", ")}`);
			lines.push(`Interests: ${profile.interests.join(", ")}`);
		} else {
			lines.push("Profile: not set");
		}

		await ctx.reply(lines.join("\n"));
	};
}
