// Mappers: transform between Prisma models (DB layer) and Domain types
// Works with "grammar_topic" and "user_topic_progress" tables

import type {
	GrammarTopic,
	CreateGrammarTopic,
	UserTopicProgress,
} from "@domain/grammar/types";
import type {
	GrammarTopic as PrismaGrammarTopic,
	UserTopicProgress as PrismaUserTopicProgress,
} from "@prisma-types";

export function toDomainTopic(db: PrismaGrammarTopic): GrammarTopic {
	return {
		id: db.id,
		categoryId: db.categoryId,
		name: db.name,
		nameRu: db.nameRu,
		cefrLevel: db.cefrLevel,
		sortOrder: db.sortOrder,
	};
}

export function toDbTopicData(topic: CreateGrammarTopic) {
	return {
		id: topic.id,
		categoryId: topic.categoryId,
		name: topic.name,
		nameRu: topic.nameRu,
		cefrLevel: topic.cefrLevel,
		sortOrder: topic.sortOrder,
	};
}

export function toDomainProgress(db: PrismaUserTopicProgress): UserTopicProgress {
	return {
		userId: db.userId,
		topicId: db.topicId,
		exposed: db.exposed,
		practiceCount: db.practiceCount,
		correctCount: db.correctCount,
		totalCount: db.totalCount,
		mastery: db.mastery,
		lastPracticedAt: db.lastPracticedAt,
		createdAt: db.createdAt,
		updatedAt: db.updatedAt,
	};
}
