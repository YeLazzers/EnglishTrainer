/**
 * Domain types for exercise generation
 * Pure business logic, no infrastructure dependencies
 */

export type ExerciseGenerationMode = "topic" | "review" | "adaptive";

/**
 * Request to generate exercises
 */
export interface ExerciseGenerationRequest {
	mode: ExerciseGenerationMode;
	userId: number;
	level: string; // CEFR level (A1, A2, B1, etc.)
	interests: string[];
	goals: string[];

	// For topic mode (exercises on one rule)
	topicId?: string; // e.g. "PRESENT_PERFECT"
	ruleName?: string; // e.g. "Present Perfect Simple"

	// For review mode (optional filters)
	maxTopics?: number; // Maximum rules in mix (default 3-5)
}
