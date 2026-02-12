import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { SessionRepository } from "../../domain/session-repository";
import { PracticeSessionData, CreateSessionData, SessionAnswer } from "../../domain/session-types";
import { serializeSession, deserializeSession } from "./mappers";

/**
 * Redis adapter implementing SessionRepository interface
 * Stores active practice sessions in Redis with automatic expiration (TTL)
 */
export class RedisSessionRepository implements SessionRepository {
  private client: Redis;
  private readonly keyPrefix = "session:practice:";
  private readonly defaultTTL = 86400; // 24 hours in seconds

  constructor(client: Redis) {
    this.client = client;
  }

  /**
   * Generate Redis key for user's session
   * Pattern: session:practice:{userId}
   */
  private getKey(userId: number): string {
    return `${this.keyPrefix}${userId}`;
  }

  async createSession(data: CreateSessionData): Promise<string> {
    const sessionId = uuidv4();

    const session: PracticeSessionData = {
      ...data,
      sessionId,
      currentExerciseIndex: 0,
      correct: 0,
      total: 0,
      startTime: new Date(),
    };

    const key = this.getKey(data.userId);
    const serialized = serializeSession(session);

    // Store with TTL: expires after 24 hours of inactivity
    await this.client.setex(key, this.defaultTTL, serialized);

    console.log(
      `[Session] Created ${sessionId} for user ${data.userId} (TTL: ${this.defaultTTL}s)`
    );

    return sessionId;
  }

  async getSession(userId: number): Promise<PracticeSessionData | undefined> {
    const key = this.getKey(userId);
    const data = await this.client.get(key);

    if (!data) return undefined;

    return deserializeSession(data);
  }

  async updateSession(userId: number, answer: SessionAnswer): Promise<void> {
    const session = await this.getSession(userId);

    if (!session) {
      throw new Error(`[Session] No active session for user ${userId}`);
    }

    // Get current exercise
    const currentExercise = session.exercises[session.currentExerciseIndex];

    if (!currentExercise || currentExercise.id !== answer.exerciseId) {
      throw new Error(
        `[Session] Exercise mismatch: expected ${currentExercise?.id}, got ${answer.exerciseId}`
      );
    }

    // Check answer correctness (case-insensitive, trimmed)
    const isCorrect =
      currentExercise.correctAnswer.trim().toLowerCase() === answer.userAnswer.trim().toLowerCase();

    // Update exercise with user's answer
    currentExercise.userAnswer = answer.userAnswer;
    currentExercise.isCorrect = isCorrect;

    // Update session counters
    session.total += 1;
    if (isCorrect) {
      session.correct += 1;
    }

    // Move to next exercise
    session.currentExerciseIndex += 1;

    // Save updated session back to Redis
    const key = this.getKey(userId);
    const serialized = serializeSession(session);
    await this.client.setex(key, this.defaultTTL, serialized);

    console.log(`[Session] Updated user ${userId}: ${session.correct}/${session.total}`);
  }

  async completeSession(userId: number): Promise<void> {
    const session = await this.getSession(userId);

    if (!session) {
      throw new Error(`[Session] No active session for user ${userId}`);
    }

    // Mark as completed
    session.completedAt = new Date();
    session.endTime = new Date();

    const key = this.getKey(userId);
    const serialized = serializeSession(session);

    // Keep completed session for 1 hour (for result display, then migrated to SQLite)
    await this.client.setex(key, 3600, serialized);

    console.log(`[Session] Completed ${session.sessionId} for user ${userId}`);
  }

  async deleteSession(userId: number): Promise<void> {
    const key = this.getKey(userId);
    await this.client.del(key);
    console.log(`[Session] Deleted session for user ${userId}`);
  }

  async hasActiveSession(userId: number): Promise<boolean> {
    const key = this.getKey(userId);
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async listActiveSessions(): Promise<PracticeSessionData[]> {
    const pattern = `${this.keyPrefix}*`;
    const keys = await this.client.keys(pattern);

    const sessions: PracticeSessionData[] = [];

    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        sessions.push(deserializeSession(data));
      }
    }

    return sessions;
  }
}
