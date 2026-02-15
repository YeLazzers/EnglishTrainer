/**
 * Limits adapter — Redis implementation for daily usage tracking
 *
 * Factory function for creating LimitRepository instance.
 */
import type { LimitRepository } from "@domain/limits/repository";

import { createRedisClient } from "../session/redis";

import { RedisLimitRepository } from "./redis-repository";

/**
 * Create LimitRepository instance with Redis backend
 *
 * Shares the same Redis client as session repository (reuses connection).
 */
export function createLimitRepository(): LimitRepository {
	const client = createRedisClient();
	return new RedisLimitRepository(client);
}

// Re-export types for convenience
export type { LimitRepository } from "@domain/limits/repository";
export { RequestType } from "@domain/limits/types";
export type { DailyLimits, UsageStats, LimitCheckResult } from "@domain/limits/types";
