// Domain types for User and UserProfile (maps to "user" and "user_profile" tables)

import type { UserState } from "../types";

export interface User {
	id: number; // Telegram user ID
	firstName: string;
	lastName: string | null;
	username: string | null;
	languageCode: string | null;
	isPremium: boolean;
	state: UserState;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateUser = Pick<
	User,
	"id" | "firstName" | "lastName" | "username" | "languageCode" | "isPremium"
>;

export interface UserProfile {
	userId: number;
	level: string;
	goals: string[];
	interests: string[];
	rawResponse: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateUserProfile = Pick<
	UserProfile,
	"level" | "goals" | "interests" | "rawResponse"
>;
