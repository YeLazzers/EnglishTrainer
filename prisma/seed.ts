/**
 * Prisma seed script — populates reference tables
 * Run: npx tsx prisma/seed.ts
 *
 * Data source: METHODOLOGY.md §3 (Grammar Categories)
 */

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const skills = [
	{ id: "GRAMMAR", name: "Grammar", nameRu: "Грамматика", sortOrder: 1, isActive: true },
	{ id: "VOCABULARY", name: "Vocabulary", nameRu: "Вокабуляр", sortOrder: 2, isActive: false },
	{ id: "WRITING", name: "Writing", nameRu: "Письмо", sortOrder: 3, isActive: true },
	{ id: "READING", name: "Reading", nameRu: "Чтение", sortOrder: 4, isActive: false },
	{ id: "LISTENING", name: "Listening", nameRu: "Аудирование", sortOrder: 5, isActive: false },
	{ id: "SPEAKING", name: "Speaking", nameRu: "Говорение", sortOrder: 6, isActive: false },
];

const grammarCategories = [
	{ id: "TENSES", name: "Tenses & Aspect", nameRu: "Времена и видовременные формы", sortOrder: 1 },
	{ id: "MODALS", name: "Modal Verbs", nameRu: "Модальные глаголы", sortOrder: 2 },
	{ id: "CONDITIONALS", name: "Conditionals", nameRu: "Условные предложения", sortOrder: 3 },
	{ id: "PASSIVE", name: "Passive Voice", nameRu: "Страдательный залог", sortOrder: 4 },
	{ id: "QUESTIONS", name: "Questions & Negation", nameRu: "Вопросы и отрицания", sortOrder: 5 },
	{ id: "ARTICLES", name: "Articles & Determiners", nameRu: "Артикли и детерминативы", sortOrder: 6 },
	{ id: "NOUNS", name: "Nouns & Pronouns", nameRu: "Существительные и местоимения", sortOrder: 7 },
	{ id: "ADJADV", name: "Adjectives & Adverbs", nameRu: "Прилагательные и наречия", sortOrder: 8 },
	{ id: "PREPOSITIONS", name: "Prepositions", nameRu: "Предлоги", sortOrder: 9 },
	{ id: "CLAUSES", name: "Clauses & Sentence Structure", nameRu: "Придаточные и структура предложения", sortOrder: 10 },
	{ id: "VERBPAT", name: "Verb Patterns", nameRu: "Глагольные конструкции", sortOrder: 11 },
	{ id: "OTHER", name: "Other Structures", nameRu: "Прочие конструкции", sortOrder: 12 },
];

async function main() {
	console.log("Seeding reference tables...");

	for (const skill of skills) {
		await prisma.skill.upsert({
			where: { id: skill.id },
			update: skill,
			create: skill,
		});
	}
	console.log(`  Skills: ${skills.length} upserted`);

	for (const category of grammarCategories) {
		await prisma.grammarCategory.upsert({
			where: { id: category.id },
			update: category,
			create: category,
		});
	}
	console.log(`  Grammar categories: ${grammarCategories.length} upserted`);

	console.log("Done.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
