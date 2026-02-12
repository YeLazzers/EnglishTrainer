/**
 * Serialization/deserialization for Redis storage
 * Handles Date conversion (Redis stores everything as strings)
 */

import { PracticeSessionData } from "../../domain/session-types";

/**
 * Convert domain session to JSON string for Redis storage
 * Handles Date ISO string conversion
 */
export function serializeSession(session: PracticeSessionData): string {
  return JSON.stringify({
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString(),
    completedAt: session.completedAt?.toISOString(),
  });
}

/**
 * Convert JSON string from Redis back to domain session
 * Handles Date object reconstruction
 */
export function deserializeSession(data: string): PracticeSessionData {
  const parsed = JSON.parse(data);

  return {
    ...parsed,
    startTime: new Date(parsed.startTime),
    endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
    completedAt: parsed.completedAt ? new Date(parsed.completedAt) : undefined,
  };
}
