import type { GrammarRepository } from "@domain/grammar/repository";
import type { ExerciseGenerator } from "@domain/practice/exercise-generator";
import type { ExerciseGenerationRequest } from "@domain/practice/types";
import type { Exercise } from "@domain/session-types";
import { ExerciseType } from "@domain/session-types";
import type { LLMAdapter } from "@llm/types";

import { EXERCISE_RESPONSE_SCHEMA } from "./prompts/common";
import { LOW_MASTERY_THRESHOLD, REVIEW_SYSTEM_PROMPT, REVIEW_USER_PROMPT_TEMPLATE } from "./prompts/review-mixed";
import { TOPIC_SYSTEM_PROMPT, TOPIC_USER_PROMPT_TEMPLATE } from "./prompts/topic-focused";

/**
 * LLM-based exercise generator
 * Implements ExerciseGenerator domain port using LLM adapter
 */
export class LLMExerciseGenerator implements ExerciseGenerator {
	constructor(
		private llm: LLMAdapter,
		private grammarRepository: GrammarRepository
	) {}

	async generate(request: ExerciseGenerationRequest): Promise<Exercise[]> {
		switch (request.mode) {
			case "topic":
				return this.generateTopicExercises(request);
			case "review":
				return this.generateReviewExercises(request);
			case "adaptive":
				// TODO: смесь новых и повторений (будущее)
				return this.generateReviewExercises(request);
			default:
				throw new Error(`Unknown mode: ${request.mode}`);
		}
	}

	/**
	 * Генерация упражнений на ОДНО правило (после теории)
	 */
	private async generateTopicExercises(request: ExerciseGenerationRequest): Promise<Exercise[]> {
		if (!request.topicId || !request.ruleName) {
			throw new Error("topicId and ruleName required for topic mode");
		}

		const userPrompt = TOPIC_USER_PROMPT_TEMPLATE.replace("{{grammarRule}}", request.ruleName)
			.replace("{{level}}", request.level)
			.replace("{{interests}}", request.interests.join(", "))
			.replace("{{goals}}", request.goals.join(", "));

		const response = await this.llm.chat(
			[
				{ role: "system", content: TOPIC_SYSTEM_PROMPT },
				{ role: "user", content: userPrompt },
			],
			EXERCISE_RESPONSE_SCHEMA
		);

		return this.parseExercises(response);
	}

	/**
	 * Генерация упражнений на ПОВТОРЕНИЕ пройденных правил (слабые зоны)
	 */
	private async generateReviewExercises(request: ExerciseGenerationRequest): Promise<Exercise[]> {
		// Загружаем прогресс пользователя
		const userProgress = await this.grammarRepository.getAllUserProgress(request.userId);

		// Фильтруем слабые зоны (low mastery < 70%)
		const weakTopics = userProgress
			.filter(
				(p) =>
					p.exposed &&
					(p.practiceCount === 0 ||
						(p.mastery < LOW_MASTERY_THRESHOLD && p.totalCount > 0))
			)
			.sort((a, b) => a.mastery - b.mastery) // Сортируем по возрастанию mastery
			.slice(0, request.maxTopics || 5); // Берем топ-5 слабых

		// Если слабых зон нет, берем любые пройденные
		const fallbackTopics =
			weakTopics.length === 0 ? userProgress.filter((p) => p.exposed).slice(0, 3) : [];

		const topicsToReview = weakTopics.length > 0 ? weakTopics : fallbackTopics;

		if (topicsToReview.length === 0) {
			throw new Error("No topics available for review");
		}

		// Загружаем названия топиков из БД
		const topicDetails = await Promise.all(
			topicsToReview.map(async (p) => {
				const topic = await this.grammarRepository.findTopicById(p.topicId);
				return {
					id: p.topicId,
					name: topic?.name || p.topicId,
					mastery: p.mastery,
				};
			})
		);

		// Формируем промпт
		const topicsSection = topicDetails
			.map((t) => `- ${t.name} (ID: ${t.id}, mastery: ${t.mastery}%)`)
			.join("\n");

		const userPrompt = REVIEW_USER_PROMPT_TEMPLATE.replace("{{level}}", request.level)
			.replace("{{interests}}", request.interests.join(", "))
			.replace("{{goals}}", request.goals.join(", "))
			.replace("{{topicsSection}}", topicsSection)
			.replace("{{topicCount}}", topicDetails.length.toString());

		const response = await this.llm.chat(
			[
				{ role: "system", content: REVIEW_SYSTEM_PROMPT },
				{ role: "user", content: userPrompt },
			],
			EXERCISE_RESPONSE_SCHEMA
		);

		return this.parseExercises(response);
	}

	/**
	 * Парсинг ответа LLM в Exercise[]
	 */
	private parseExercises(response: string): Exercise[] {
		const parsed = JSON.parse(response) as {
			exercises: Array<{
				id: string;
				topicId: string;
				type: string;
				question: string;
				options?: string[];
				correctAnswer: string;
			}>;
		};

		return parsed.exercises.map((ex) => ({
			id: ex.id,
			topicId: ex.topicId,
			type: ex.type as ExerciseType,
			question: ex.question,
			options: ex.options,
			correctAnswer: ex.correctAnswer,
		}));
	}
}
