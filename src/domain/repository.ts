// @legacy: works with TestUserState/TestUserProfile tables.
// Use @domain/user/repository for new code.

import { UserState, UserProfile, CreateUserProfile } from "./types";

export interface UserRepository {
	// State operations
	getState(userId: number): Promise<UserState | undefined>;
	setState(userId: number, state: UserState): Promise<void>;

	// Profile operations
	getProfile(userId: number): Promise<UserProfile | undefined>;
	setProfile(userId: number, profile: CreateUserProfile): Promise<void>;
}
