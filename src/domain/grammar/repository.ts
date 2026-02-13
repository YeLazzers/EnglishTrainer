// Port: defines data access contract for Grammar topics and user progress

import type {
	GrammarTopic,
	CreateGrammarTopic,
	UserTopicProgress,
	UpdateUserTopicProgress,
} from "./types";

export interface GrammarRepository {
	// GrammarTopic operations
	findTopicById(topicId: string): Promise<GrammarTopic | null>;
	upsertTopic(topic: CreateGrammarTopic): Promise<GrammarTopic>;

	// UserTopicProgress operations
	getProgress(userId: number, topicId: string): Promise<UserTopicProgress | null>;
	getAllUserProgress(userId: number): Promise<UserTopicProgress[]>;
	markExposed(userId: number, topicId: string): Promise<void>;
	updateProgress(userId: number, topicId: string, data: UpdateUserTopicProgress): Promise<void>;
}
