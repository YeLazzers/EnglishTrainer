import { Context } from "grammy";

import { getState, getProfile } from "../state";

export async function debugCommand(ctx: Context): Promise<void> {
	const userId = ctx.from?.id;
	if (!userId) {
		await ctx.reply("Ошибка: не удалось определить пользователя");
		return;
	}

	const state = (await getState(userId)) ?? "NONE";
	const profile = await getProfile(userId);

	const lines = [`State: ${state}`];
	if (profile) {
		lines.push(`Level: ${profile.level}`);
		lines.push(`Goals: ${profile.goals.join(", ")}`);
		lines.push(`Interests: ${profile.interests.join(", ")}`);
	} else {
		lines.push("Profile: not set");
	}

	await ctx.reply(lines.join("\n"));
}
