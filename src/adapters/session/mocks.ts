/**
 * Mock data for developing practice session flow
 * Simulates LLM response for exercise generation
 */

import { CreateSessionData, ExerciseType } from "@domain/session-types";

/**
 * Mock session for Present Perfect (B1 level)
 * Topic: Travel and experiences (common interest)
 */
export const mockPresentPerfectSessionB1: CreateSessionData = {
	userId: 123456, // Example Telegram user ID
	topicId: "PRESENT_PERFECT",
	grammarRule: "Present Perfect",
	level: "B1",

	exercises: [
		{
			id: "ex-1",
			type: ExerciseType.SINGLE_CHOICE,
			question: "I _____ to Paris three times in my life. It's such a beautiful city!",
			options: ["have been", "am been", "was being", "had been"],
			correctAnswer: "have been",
			explanation:
				'Use "have been" (Present Perfect) to talk about past experiences that are relevant to the present. The speaker is sharing their accumulated travel experience.',
		},

		{
			id: "ex-2",
			type: ExerciseType.FILL_IN_BLANK,
			question:
				"She _____ (not / see) that movie yet, but she wants to watch it this weekend.",
			correctAnswer: "has not seen",
			explanation:
				'"Has not seen" (Present Perfect) is correct because the action started in the past and continues to be relevant now. We use this to talk about incomplete actions.',
		},

		{
			id: "ex-3",
			type: ExerciseType.SINGLE_CHOICE,
			question: "How long _____ you _____ English? Since you were a child?",
			options: ["have / studied", "have / been studying", "are / studying", "do / study"],
			correctAnswer: "have / been studying",
			explanation:
				'Use "have been studying" (Present Perfect Continuous) when asking about an action that started in the past and continues to the present. This emphasizes the duration.',
		},

		{
			id: "ex-4",
			type: ExerciseType.FILL_IN_BLANK,
			question: "We _____ (just / finish) our project. Can we take a break now?",
			correctAnswer: "have just finished",
			explanation:
				'"Have just finished" shows something that happened very recently and is relevant to what happens next. "Just" is a common adverb with Present Perfect.',
		},

		{
			id: "ex-5",
			type: ExerciseType.SINGLE_CHOICE,
			question:
				"The restaurant _____ its menu since they hired the new chef. The food is much better now.",
			options: ["has changed", "changed", "has been changing", "is changing"],
			correctAnswer: "has changed",
			explanation:
				'Use "has changed" when the action (changing the menu) happened at an unspecified past time but is relevant to the present (better food now).',
		},
	],
};

/**
 * Alternative mock: Present Perfect with different theme (work/career)
 */
export const mockPresentPerfectCareerB1: CreateSessionData = {
	userId: 123456,
	topicId: "PRESENT_PERFECT",
	grammarRule: "Present Perfect",
	level: "B1",

	exercises: [
		{
			id: "ex-career-1",
			type: ExerciseType.SINGLE_CHOICE,
			question: "I _____ in the IT industry for 5 years now. It's very rewarding work.",
			options: ["have worked", "worked", "am working", "have been working"],
			correctAnswer: "have worked",
			explanation:
				'Both "have worked" and "have been working" could work here, but "have worked" is simpler and emphasizes the completed action over the duration.',
		},

		{
			id: "ex-career-2",
			type: ExerciseType.FILL_IN_BLANK,
			question:
				"He _____ (complete) three major projects this year. His boss is very impressed.",
			correctAnswer: "has completed",
			explanation:
				"Use Present Perfect because we're talking about results of actions (completed projects) that affect the present (boss impressed).",
		},

		{
			id: "ex-career-3",
			type: ExerciseType.SINGLE_CHOICE,
			question: "Our team _____ two successful campaigns in the last month.",
			options: ["has launched", "have launched", "launched", "are launching"],
			correctAnswer: "have launched",
			explanation:
				'Use "have launched" (plural) because the subject "team" takes a plural verb. Present Perfect because the action\'s results are relevant now.',
		},

		{
			id: "ex-career-4",
			type: ExerciseType.FILL_IN_BLANK,
			question: "_____  you _____ (ever / work) with remote teams before?",
			correctAnswer: "Have / worked",
			explanation:
				'Use "have you worked" (Present Perfect) to ask about accumulated life experience. "Ever" indicates any time in the past.',
		},

		{
			id: "ex-career-5",
			type: ExerciseType.SINGLE_CHOICE,
			question: "I _____ my certification yet, but I'm studying hard for it.",
			options: ["haven't obtained", "did not obtain", "am not obtaining", "have obtained"],
			correctAnswer: "haven't obtained",
			explanation:
				"Use Present Perfect negative to talk about something not yet completed but still possible in the future.",
		},
	],
};

/**
 * Utility function to get a random mock session
 */
export function getRandomMockSession(): CreateSessionData {
	const mocks = [mockPresentPerfectSessionB1, mockPresentPerfectCareerB1];
	return mocks[Math.floor(Math.random() * mocks.length)];
}
