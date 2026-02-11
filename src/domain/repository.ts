// Port - defines the interface for user data access operations
// Any implementation must satisfy this interface

import { UserState, UserProfile, CreateUserProfile } from "./types";

export interface UserRepository {
  // State operations
  getState(userId: number): Promise<UserState | undefined>;
  setState(userId: number, state: UserState): Promise<void>;

  // Profile operations
  getProfile(userId: number): Promise<UserProfile | undefined>;
  setProfile(userId: number, profile: CreateUserProfile): Promise<void>;

  // Composite operations
  initializeUser(userId: number): Promise<void>;
}
