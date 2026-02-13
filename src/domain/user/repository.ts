// Port: defines data access contract for User and UserProfile

import type { UserState } from "../types";

import type { User, UserProfile, CreateUser, CreateUserProfile } from "./types";

export interface UserRepository {
	// User operations
	findById(userId: number): Promise<User | null>;
	upsert(data: CreateUser): Promise<User>;

	// State operations
	getState(userId: number): Promise<UserState | null>;
	setState(userId: number, state: UserState): Promise<void>;

	// Profile operations
	getProfile(userId: number): Promise<UserProfile | null>;
	setProfile(userId: number, profile: CreateUserProfile): Promise<void>;
}
