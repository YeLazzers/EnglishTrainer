import type { Bot, Context } from "grammy";

import { logger, toErrorDetails } from "./logger";

export interface ReportErrorParams {
	scope: string;
	error: unknown;
	ctx?: Context;
	meta?: Record<string, unknown>;
}

function getAlertChatId(): string | undefined {
	return process.env.ERROR_ALERT_CHAT_ID;
}

function truncate(value: string, max = 3500): string {
	return value.length > max ? `${value.slice(0, max)}...` : value;
}

function extractContextMeta(ctx?: Context): Record<string, unknown> {
	if (!ctx) {
		return {};
	}

	return {
		updateId: ctx.update.update_id,
		updateType: detectUpdateType(ctx),
		fromId: ctx.from?.id,
		chatId: ctx.chat?.id,
	};
}

export function detectUpdateType(ctx: Context): string {
	const key = Object.keys(ctx.update).find((item) => item !== "update_id");
	return key ?? "unknown";
}

function formatAlertText(scope: string, error: unknown, meta: Record<string, unknown>): string {
	const header = `🚨 Bot error: ${scope}`;
	const core = [
		`updateId: ${meta.updateId ?? "-"}`,
		`updateType: ${meta.updateType ?? "-"}`,
		`fromId: ${meta.fromId ?? "-"}`,
		`chatId: ${meta.chatId ?? "-"}`,
	].join("\n");

	const details = toErrorDetails(error);
	const errorLine = `${details.errorName ?? "Error"}: ${details.errorMessage ?? "unknown"}`;

	return truncate(`${header}\n\n${core}\n\n${errorLine}`);
}

export type ReportErrorFn = (params: ReportErrorParams) => Promise<void>;

export class ErrorReporter {
	constructor(private bot: Bot) {}

	private shouldSendAlert(): boolean {
		return Boolean(getAlertChatId());
	}

	reportError: ReportErrorFn = async (params) => {
		const { scope, error, ctx, meta } = params;
		const contextMeta = extractContextMeta(ctx);
		const details = toErrorDetails(error);

		logger.error("bot.error", {
			scope,
			...contextMeta,
			...meta,
			...details,
		});

		if (!this.shouldSendAlert()) {
			return;
		}

		try {
			const chatId = getAlertChatId();
			if (!chatId) {
				return;
			}

			await this.bot.api.sendMessage(
				chatId,
				formatAlertText(scope, error, { ...contextMeta, ...meta })
			);
		} catch (alertError) {
			logger.warn("bot.error.alert_failed", {
				scope,
				...toErrorDetails(alertError),
			});
		}
	};
}
