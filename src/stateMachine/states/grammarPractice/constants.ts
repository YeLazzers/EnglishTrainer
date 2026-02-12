import { Keyboard } from "grammy";

import { ExerciseType } from "@domain/session-types";
import { JSONSchema } from "@llm";

export const GRAMMAR_PRACTICE_SYSTEM_PROMPT = `Ты — генератор упражнений по английской грамматике для Telegram-бота.

Сгенерируй пакет упражнений по ОДНОМУ грамматическому правилу.

Требования:
1) Все задания — на английском языке.
2) Ответы для single_choice и fill_in_blank должны быть однозначными, проверяемыми без LLM.
3) Состав пакета (максимум 10 упражнений):
   - 5–7 упражнений single_choice
   - 3–5 упражнений fill_in_blank
4) Сложность под уровень пользователя.
5) Не используй редкую лексику. Темы — повседневные или рабочие.
6) single_choice: correctAnswer — правильный вариант из options.
7) fill_in_blank: correctAnswer — все допустимые варианты через "|" ("is not|isn't"). В question укажи формат ответа (поставь глагол в нужную форму / выбери из вариантов через слэш и т.д.).
9) Можно использовать HTML-форматирование в question (<b>, <i>, <code>).
10) Минимум токенов — без лишних слов и пояснений.
11) Перемешай упражнения разных типов в случайном порядке — не группируй по типу.`;
// - 1–2 упражнения free_response (напиши/перепиши/составь предложение)

export const GRAMMAR_PRACTICE_USER_PROMPT_TEMPLATE = `Грамматическое правило: {{grammarRule}}
Уровень: {{level}}
Интересы: {{interests}}
Цели: {{goals}}
`;

export const GRAMMAR_PRACTICE_RESPONSE_SCHEMA: JSONSchema = {
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
						description: "Choices for single_choice (2-4 options)",
					},
					correctAnswer: {
						type: "string",
						description:
							"Correct answer. For single_choice — one of options. For fill_in_blank — pipe-separated accepted variants (e.g. is not|isn't)",
					},
				},
				required: ["id", "type", "question", "correctAnswer"],
			},
		},
	},
	required: ["exercises"],
};

export const GRAMMAR_PRACTICE_REPLY_KEYBOARD = new Keyboard()
	.text("Пропустить")
	.text("Завершить")
	.row()
	.text("Меню")
	.resized();
