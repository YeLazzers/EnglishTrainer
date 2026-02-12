/**
 * Factory and re-exports (follows /src/llm/ pattern)
 */

import { SessionRepository } from "../../domain/session-repository";

import { createRedisClient } from "./redis";
import { RedisSessionRepository } from "./redis-repository";

/**
 * Factory function - creates SessionRepository instance
 * Currently always returns Redis implementation
 * Future: could switch implementations based on env var (like LLM layer)
 */
export function createSessionRepository(): SessionRepository {
	const client = createRedisClient();
	return new RedisSessionRepository(client);
}

// Re-export domain types for convenience (follows LLM pattern)
export type { SessionRepository } from "../../domain/session-repository";
export type {
	PracticeSessionData,
	CreateSessionData,
	Exercise,
	ExerciseType,
	SessionAnswer,
} from "../../domain/session-types";
