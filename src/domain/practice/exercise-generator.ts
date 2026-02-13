import type { Exercise } from "@domain/session-types";

import type { ExerciseGenerationRequest } from "./types";

/**
 * Domain port for exercise generation.
 * Adapter (LLM, mock, cache) implements this interface.
 */
export interface ExerciseGenerator {
	/**
	 * Generates exercises based on request
	 * @throws Error if generation fails
	 */
	generate(request: ExerciseGenerationRequest): Promise<Exercise[]>;
}
