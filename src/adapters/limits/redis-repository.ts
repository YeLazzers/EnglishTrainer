import Redis from "ioredis";

import { LimitRepository } from "@domain/limits/repository";
import { RequestType, UsageStats, DailyLimits, LimitCheckResult } from "@domain/limits/types";

/**
 * Default free tier limits
 */
const DEFAULT_LIMITS: DailyLimits = {
	total: 2,
	maxTheory: 1, // 50% of total
};

/**
 * Redis adapter implementing LimitRepository interface
 * Stores daily usage counters with automatic expiration at end of day (00:00 UTC)
 */
export class RedisLimitRepository implements LimitRepository {
	private client: Redis;
	private readonly keyPrefix = "limits:";

	constructor(client: Redis) {
		this.client = client;
	}

	/**
	 * Generate Redis key for user's daily usage
	 * Pattern: limits:{userId}:{YYYY-MM-DD}
	 */
	private getKey(userId: number, date?: string): string {
		const dateStr = date || this.getCurrentDate();
		return `${this.keyPrefix}${userId}:${dateStr}`;
	}

	/**
	 * Get current date in YYYY-MM-DD format (UTC)
	 */
	private getCurrentDate(): string {
		const now = new Date();
		return now.toISOString().split("T")[0]; // Get YYYY-MM-DD part
	}

	/**
	 * Calculate TTL in seconds until end of current day (00:00 UTC tomorrow)
	 */
	private getTTLUntilEndOfDay(): number {
		const now = new Date();
		const endOfDay = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
		);
		const ttlMs = endOfDay.getTime() - now.getTime();
		return Math.ceil(ttlMs / 1000); // Convert to seconds, round up
	}

	/**
	 * Parse stored usage data from Redis
	 */
	private parseUsageData(
		userId: number,
		data: string | null
	): Omit<UsageStats, "userId" | "date"> {
		if (!data) {
			return {
				totalUsed: 0,
				theoryUsed: 0,
				practiceUsed: 0,
				freeWritingUsed: 0,
			};
		}

		try {
			return JSON.parse(data);
		} catch (error) {
			console.error(`[Limits] Failed to parse usage data for user ${userId}:`, error);
			return {
				totalUsed: 0,
				theoryUsed: 0,
				practiceUsed: 0,
				freeWritingUsed: 0,
			};
		}
	}

	async getUsage(userId: number): Promise<UsageStats> {
		const key = this.getKey(userId);
		const data = await this.client.get(key);
		const parsed = this.parseUsageData(userId, data);

		return {
			userId,
			date: this.getCurrentDate(),
			...parsed,
		};
	}

	async checkLimit(userId: number, requestType: RequestType): Promise<LimitCheckResult> {
		const currentUsage = await this.getUsage(userId);

		// Check total limit
		if (currentUsage.totalUsed >= DEFAULT_LIMITS.total) {
			return {
				allowed: false,
				reason: "TOTAL_LIMIT_REACHED",
				currentUsage,
				limits: DEFAULT_LIMITS,
			};
		}

		// Check theory-specific limit
		if (
			requestType === RequestType.THEORY &&
			currentUsage.theoryUsed >= DEFAULT_LIMITS.maxTheory
		) {
			return {
				allowed: false,
				reason: "THEORY_LIMIT_REACHED",
				currentUsage,
				limits: DEFAULT_LIMITS,
			};
		}

		return {
			allowed: true,
			currentUsage,
			limits: DEFAULT_LIMITS,
		};
	}

	async incrementUsage(userId: number, requestType: RequestType): Promise<UsageStats> {
		const key = this.getKey(userId);
		const ttl = this.getTTLUntilEndOfDay();

		// Get current usage
		const currentUsage = await this.getUsage(userId);

		// Increment counters based on request type
		const updatedUsage = {
			totalUsed: currentUsage.totalUsed + 1,
			theoryUsed:
				requestType === RequestType.THEORY
					? currentUsage.theoryUsed + 1
					: currentUsage.theoryUsed,
			practiceUsed:
				requestType === RequestType.PRACTICE
					? currentUsage.practiceUsed + 1
					: currentUsage.practiceUsed,
			freeWritingUsed:
				requestType === RequestType.FREE_WRITING
					? currentUsage.freeWritingUsed + 1
					: currentUsage.freeWritingUsed,
		};

		// Store updated usage with TTL until end of day
		await this.client.setex(key, ttl, JSON.stringify(updatedUsage));

		console.log(
			`[Limits] User ${userId} usage: ${updatedUsage.totalUsed} total (${updatedUsage.theoryUsed} theory, ${updatedUsage.practiceUsed} practice, ${updatedUsage.freeWritingUsed} writing), TTL: ${ttl}s`
		);

		return {
			userId,
			date: this.getCurrentDate(),
			...updatedUsage,
		};
	}

	async resetUsage(userId: number): Promise<void> {
		const key = this.getKey(userId);
		await this.client.del(key);
		console.log(`[Limits] Reset usage for user ${userId}`);
	}
}
