import type { RuleGenerationMode } from "./constants";

/**
 * Формирует инструкцию для LLM в зависимости от режима генерации правил
 */
export function getModeInstruction(mode: RuleGenerationMode): string {
	switch (mode) {
		case "new":
			return "\n\nMode: NEW — Select only topics user hasn't seen yet. Avoid all exposed topics.";
		case "review":
			return "\n\nMode: REVIEW — Select from topics with low mastery. Focus on reinforcing weak areas.";
		case "adaptive":
			return "\n\nMode: ADAPTIVE — 70% new topics, 30% review of low-mastery topics. Balance learning and reinforcement.";
	}
}
