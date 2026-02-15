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

/**
 * Очищает LLM ответ от некорректных символов и тегов
 * Убирает:
 * - <br> и <br/> теги (заменяет на \n)
 * - Вертикальные табуляции (\u000b)
 * - Другие control characters которые могут сломать JSON
 */
export function sanitizeLLMResponse(response: string): string {
	return (
		response
			// Заменяем <br> и <br/> на \n
			.replace(/<br\s*\/?>/gi, "\\n")
			// Убираем другие потенциально опасные control characters (кроме \n, \r, \t)
			// eslint-disable-next-line no-control-regex
			.replace(/[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g, "")
	);
}
