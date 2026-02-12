// Facade layer - backward compatibility wrapper
// All existing imports from this file continue to work unchanged

import { createUserRepository } from "./adapters/db";

// Create singleton repository instance
const repository = createUserRepository();

// Re-export types (same as before)
export { UserState } from "./domain/types";
export type { UserProfile, CreateUserProfile } from "./domain/types";

// Re-export functions with same signatures
// Bind to repository instance to preserve 'this' context
export const getState = repository.getState.bind(repository);
export const setState = repository.setState.bind(repository);
export const getProfile = repository.getProfile.bind(repository);
export const setProfile = repository.setProfile.bind(repository);
