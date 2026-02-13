import { ExerciseType } from "@domain/session-types";
import { JSONSchema } from "@llm";

/**
 * Общая схема ответа LLM для генерации упражнений
 * Используется во всех режимах (topic, review, adaptive)
 */
export const EXERCISE_RESPONSE_SCHEMA: JSONSchema = {
	type: "object",
	properties: {
		exercises: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "Unique ID (ex_01, ex_02, ...)",
					},
					topicId: {
						type: "string",
						description:
							"Grammar topic ID this exercise targets (e.g. PRESENT_PERFECT, FIRST_CONDITIONAL). Use UPPER_SNAKE_CASE.",
					},
					type: {
						type: "string",
						enum: [ExerciseType.SINGLE_CHOICE, ExerciseType.FILL_IN_BLANK],
						description: "Exercise type",
					},
					question: {
						type: "string",
						description: "Question text, HTML allowed",
					},
					options: {
						type: "array",
						items: { type: "string" },
						description: "Choices for single_choice (2-4 options). Empty for fill_in_blank",
					},
					correctAnswer: {
						type: "string",
						description:
							"Correct answer. For single_choice — one of options. For fill_in_blank — pipe-separated accepted variants (e.g. is not|isn't)",
					},
				},
				additionalProperties: false,
				required: ["id", "topicId", "type", "question", "options", "correctAnswer"],
			},
		},
	},
	additionalProperties: false,
	required: ["exercises"],
};
