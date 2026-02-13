import type { GrammarRepository } from "@domain/grammar/repository";
import { createLLM } from "@llm";

import { LLMExerciseGenerator } from "./llm-exercise-generator";

/**
 * Factory function для создания ExerciseGenerator
 * Принимает GrammarRepository для переиспользования экземпляра из bot.ts
 */
export function createExerciseGenerator(grammarRepository: GrammarRepository) {
	const llm = createLLM();

	return new LLMExerciseGenerator(llm, grammarRepository);
}
