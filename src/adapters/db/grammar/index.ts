// Factory and re-exports for Grammar domain adapter

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import type { GrammarRepository } from "@domain/grammar/repository";

import { PrismaGrammarRepository } from "./prisma-repository";

export function createGrammarRepository(): GrammarRepository {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const adapter = new PrismaBetterSqlite3({ url });
	const prisma = new PrismaClient({ adapter });

	return new PrismaGrammarRepository(prisma);
}

export type { GrammarRepository } from "@domain/grammar/repository";
export type {
	GrammarTopic,
	CreateGrammarTopic,
	UserTopicProgress,
	UpdateUserTopicProgress,
} from "@domain/grammar/types";
