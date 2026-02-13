// Mappers: transform between Prisma models (DB layer) and Domain types
// Works with "user" and "user_profile" tables

import type {
	User as PrismaUser,
	UserProfile as PrismaUserProfile,
} from "@prisma-types";
import type { User, UserProfile, CreateUser, CreateUserProfile } from "@domain/user/types";
import type { UserState } from "@domain/types";

export function toDomainUser(db: PrismaUser): User {
	return {
		id: db.id,
		firstName: db.firstName,
		lastName: db.lastName,
		username: db.username,
		languageCode: db.languageCode,
		isPremium: db.isPremium,
		state: db.state as UserState,
		createdAt: db.createdAt,
		updatedAt: db.updatedAt,
	};
}

export function toDomainProfile(db: PrismaUserProfile): UserProfile {
	return {
		userId: db.userId,
		level: db.level,
		goals: JSON.parse(db.goals),
		interests: JSON.parse(db.interests),
		rawResponse: db.rawResponse,
		createdAt: db.createdAt,
		updatedAt: db.updatedAt,
	};
}

export function toDbUserData(data: CreateUser) {
	return {
		id: data.id,
		firstName: data.firstName,
		lastName: data.lastName,
		username: data.username,
		languageCode: data.languageCode,
		isPremium: data.isPremium,
	};
}

export function toDbProfileData(profile: CreateUserProfile) {
	return {
		level: profile.level,
		goals: JSON.stringify(profile.goals),
		interests: JSON.stringify(profile.interests),
		rawResponse: profile.rawResponse,
	};
}
