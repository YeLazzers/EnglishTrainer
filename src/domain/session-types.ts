/**
 * Domain types for practice sessions
 * Pure business logic, no infrastructure dependencies
 */

export enum ExerciseType {
	SINGLE_CHOICE = "single_choice",
	FILL_IN_BLANK = "fill_in_blank",
}

export interface Exercise {
	id: string; // Unique exercise ID
	topicId: string; // Grammar topic ID this exercise targets (e.g., "PRESENT_PERFECT")
	type: ExerciseType;
	question: string; // Question text in English
	options?: string[]; // For single choice (2-4 options)
	correctAnswer: string;
	explanation?: string; // Why this answer is correct
	userAnswer?: string; // User's submitted answer (undefined until answered)
	isCorrect?: boolean; // Result after checking answer
}

export interface PracticeSessionData {
	userId: number; // Telegram user ID
	sessionId: string; // Unique session ID (UUID)
	level: string; // User level (A1, B2, etc.)

	exercises: Exercise[]; // All exercises in this session (each has its own topicId)
	currentExerciseIndex: number; // Current question (0-based)

	correct: number; // Number of correct answers
	total: number; // Total attempted exercises

	startTime: Date;
	endTime?: Date;
	completedAt?: Date;
}

/**
 * Data needed to create a new practice session
 * Omits auto-generated fields: sessionId, currentExerciseIndex, correct, total, startTime
 */
export type CreateSessionData = Omit<
	PracticeSessionData,
	"sessionId" | "currentExerciseIndex" | "correct" | "total" | "startTime"
>;

/**
 * User's answer to an exercise
 */
export interface SessionAnswer {
	exerciseId: string;
	userAnswer: string;
}
