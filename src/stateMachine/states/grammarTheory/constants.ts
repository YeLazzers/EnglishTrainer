import { Keyboard } from "grammy";

import { JSONSchema } from "@llm";

export const GRAMMAR_THEORY_SYSTEM_PROMPT = `You are an English teacher inside a Telegram bot.

Task: explain ONE grammar rule.

Rules:
- If user level > A2: write in English. If A2 or below: mostly Russian.
- First, provide a brief summary (1-2 sentences) describing what this rule is and its main purpose.
- Then, provide detailed explanation (180–350 words total): when to use, formula/structure, 3–5 examples, 2–4 common mistakes.
- Be clear, practical, structured. No academic overload.
- No motivational phrases. Do not exceed the length.`;
// Max 1–3 emoji.

// TODO: в будущем rule selection будет опираться на пользовательскую статистику
// (UserTopicProgress: mastery, lastPracticedAt, exposure) вместо стратегических эвристик
export const GRAMMAR_THEORY_USER_PROMPT_TEMPLATE = `Generate explanation for one grammar rule.

User level: {{level}}
Goals: {{goals}}
Interests: {{interests}}

Rule selection: prioritize fundamental, high-frequency rules for this level. Focus on real speech and writing. Avoid rare or academic rules.`;

// Grammar categories from METHODOLOGY.md §3
const GRAMMAR_CATEGORIES = [
	"TENSES",
	"MODALS",
	"CONDITIONALS",
	"PASSIVE",
	"QUESTIONS",
	"ARTICLES",
	"NOUNS",
	"ADJADV",
	"PREPOSITIONS",
	"CLAUSES",
	"VERBPAT",
	"OTHER",
] as const;

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const GRAMMAR_THEORY_RESPONSE_SCHEMA: JSONSchema = {
	type: "object",
	properties: {
		category: {
			type: "string",
			enum: [...GRAMMAR_CATEGORIES],
			description: "Grammar category ID from the catalog",
		},
		topic: {
			type: "string",
			description:
				"Grammar topic ID within category, UPPER_SNAKE_CASE (e.g. PRESENT_PERFECT, FIRST_CONDITIONAL, CAN_COULD)",
		},
		rule_name: {
			type: "string",
			description: "Human-readable rule name (e.g. 'Present Perfect Simple')",
		},
		level: {
			type: "string",
			enum: [...CEFR_LEVELS],
			description: "CEFR level of the rule",
		},
		summary: {
			type: "string",
			description:
				"Brief description (1-2 sentences) of what this rule is and its main purpose. Format: plain text or simple HTML tags.",
		},
		theory: {
			type: "string",
			description:
				"Grammar rule explanation. Format: Telegram HTML tags only (<b>, <i>, <code>, <s>, <pre>). No Markdown, no unsupported HTML. Use bullet lists (• or numbered). Use \n for line breaks, no <br>. Must be valid inside JSON string.",
		},
	},
	required: ["category", "topic", "rule_name", "level", "summary", "theory"],
	additionalProperties: false,
};

export const GRAMMAR_THEORY_REPLY_KEYBOARD = new Keyboard()
	.text("Другое правило")
	.text("Меню")
	.resized();
