// Domain types for Grammar (maps to "grammar_category", "grammar_topic", "user_topic_progress" tables)

export interface GrammarCategory {
	id: string; // "TENSES", "MODALS", etc.
	name: string;
	nameRu: string;
	sortOrder: number;
}

export interface GrammarTopic {
	id: string; // "PRESENT_PERFECT", "PRESENT_SIMPLE", etc.
	categoryId: string; // FK → GrammarCategory
	name: string; // "Present Perfect"
	nameRu: string; // "Настоящее совершенное время"
	cefrLevel: string; // "A1", "B2", etc.
	sortOrder: number;
}

export type CreateGrammarTopic = Pick<
	GrammarTopic,
	"id" | "categoryId" | "name" | "nameRu" | "cefrLevel" | "sortOrder"
>;

export interface UserTopicProgress {
	userId: number;
	topicId: string;
	exposed: boolean; // Was theory shown?
	practiceCount: number;
	correctCount: number;
	totalCount: number;
	mastery: number; // 0-100
	lastPracticedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export type UpdateUserTopicProgress = Partial<
	Pick<
		UserTopicProgress,
		"exposed" | "practiceCount" | "correctCount" | "totalCount" | "mastery" | "lastPracticedAt"
	>
>;
