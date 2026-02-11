// Mappers: transform between Persistence layer (DB) and Domain layer

import type { TestUserProfile } from "../../generated/prisma/client";
import type { UserProfile, CreateUserProfile } from "../../domain/types";

/**
 * Transform Prisma model (DB layer) to Domain type
 * DB stores goals/interests as JSON strings, Domain uses arrays
 */
export function toDomainProfile(dbProfile: TestUserProfile): UserProfile {
  return {
    id: dbProfile.id,
    level: dbProfile.level,
    goals: JSON.parse(dbProfile.goals),
    interests: JSON.parse(dbProfile.interests),
    rawResponse: dbProfile.rawResponse,
    createdAt: dbProfile.createdAt,
    updatedAt: dbProfile.updatedAt,
  };
}

/**
 * Transform Domain type to Prisma input (DB layer)
 * Domain uses arrays, DB stores goals/interests as JSON strings
 */
export function toDbProfileData(
  userId: number,
  profile: CreateUserProfile
) {
  return {
    id: userId,
    level: profile.level,
    goals: JSON.stringify(profile.goals),
    interests: JSON.stringify(profile.interests),
    rawResponse: profile.rawResponse,
  };
}
