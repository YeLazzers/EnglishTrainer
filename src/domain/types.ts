// Domain layer - pure business logic types, no infrastructure dependencies

export enum UserState {
	ONBOARDING = "ONBOARDING",
	MAIN_MENU = "MAIN_MENU",
	GRAMMAR_THEORY = "GRAMMAR_THEORY",
	GRAMMAR_PRACTICE = "GRAMMAR_PRACTICE",
	PRACTICE_RESULT = "PRACTICE_RESULT",
	FREE_WRITING = "FREE_WRITING",
	WRITING_FEEDBACK = "WRITING_FEEDBACK",
	STATS = "STATS",
}

export interface UserProfile {
	id: number;
	level: string;
	goals: string[];
	interests: string[];
	rawResponse: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateUserProfile = Omit<UserProfile, "id" | "createdAt" | "updatedAt">;
