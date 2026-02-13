import type { Exercise } from "@domain/session-types";

/**
 * Группирует упражнения по topicId и считает статистику для каждого топика
 * Неотвеченные упражнения считаются как неправильные (total++, correct не увеличивается)
 */
export function calculateTopicStats(
	exercises: Exercise[]
): Record<string, { correct: number; total: number }> {
	const stats: Record<string, { correct: number; total: number }> = {};

	for (const exercise of exercises) {
		const topicId = exercise.topicId;

		if (!stats[topicId]) {
			stats[topicId] = { correct: 0, total: 0 };
		}

		stats[topicId].total += 1;
		if (exercise.isCorrect) {
			stats[topicId].correct += 1;
		}
	}

	return stats;
}
