/**
 * Port - defines the interface for practice session data access operations
 * Any implementation (Redis, in-memory, database, etc.) must satisfy this interface
 * Follows the same pattern as UserRepository
 */

import { PracticeSessionData, CreateSessionData, SessionAnswer } from "./session-types";

export interface SessionRepository {
  /**
   * Create a new practice session for a user
   * @returns sessionId (UUID)
   */
  createSession(data: CreateSessionData): Promise<string>;

  /**
   * Get active session for a user
   * @returns session data or undefined if not found
   */
  getSession(userId: number): Promise<PracticeSessionData | undefined>;

  /**
   * Update session with user's answer and progress to next exercise
   */
  updateSession(userId: number, answer: SessionAnswer): Promise<void>;

  /**
   * Mark session as completed
   */
  completeSession(userId: number): Promise<void>;

  /**
   * Delete session (after migration to SQLite)
   */
  deleteSession(userId: number): Promise<void>;

  /**
   * Check if user has an active session
   */
  hasActiveSession(userId: number): Promise<boolean>;

  /**
   * List all active sessions (for admin/debugging)
   */
  listActiveSessions(): Promise<PracticeSessionData[]>;
}
