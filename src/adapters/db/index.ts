// Factory and re-exports (follows /src/llm/ pattern)

import { UserRepository } from "../../domain/repository";
import { PrismaUserRepository } from "./prisma";

/**
 * Factory function - creates UserRepository instance
 * Currently always returns Prisma implementation
 * Future: could switch implementations based on env var (like LLM layer)
 */
export function createUserRepository(): UserRepository {
  return new PrismaUserRepository();
}

// Re-export domain types for convenience
export type { UserRepository } from "../../domain/repository";
export type { UserState, UserProfile, CreateUserProfile } from "../../domain/types";
