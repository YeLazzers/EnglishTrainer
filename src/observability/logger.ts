type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

function resolveLogLevel(): LogLevel {
	const configured = process.env.LOG_LEVEL?.toLowerCase();
	if (configured === "debug" || configured === "info" || configured === "warn" || configured === "error") {
		return configured;
	}
	return "info";
}

const activeLevel = resolveLogLevel();

function shouldLog(level: LogLevel): boolean {
	return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[activeLevel];
}

function serializeUnknown(value: unknown): unknown {
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
		};
	}
	return value;
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
	if (!shouldLog(level)) {
		return;
	}

	const payload: Record<string, unknown> = {
		ts: new Date().toISOString(),
		level,
		message,
	};

	if (context) {
		for (const [key, value] of Object.entries(context)) {
			payload[key] = serializeUnknown(value);
		}
	}

	const line = JSON.stringify(payload);
	if (level === "error" || level === "warn") {
		console.error(line);
		return;
	}
	console.log(line);
}

export const logger = {
	debug(message: string, context?: Record<string, unknown>): void {
		write("debug", message, context);
	},
	info(message: string, context?: Record<string, unknown>): void {
		write("info", message, context);
	},
	warn(message: string, context?: Record<string, unknown>): void {
		write("warn", message, context);
	},
	error(message: string, context?: Record<string, unknown>): void {
		write("error", message, context);
	},
};

export function toErrorDetails(error: unknown): Record<string, unknown> {
	if (error instanceof Error) {
		return {
			errorName: error.name,
			errorMessage: error.message,
			errorStack: error.stack,
		};
	}
	return {
		errorMessage: String(error),
	};
}
