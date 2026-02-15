// Adapter: Prisma implementation of GrammarRepository (grammar_topic + user_topic_progress tables)

import type { PrismaClient } from "@prisma/client";

import type { GrammarRepository } from "@domain/grammar/repository";
import type {
	GrammarTopic,
	CreateGrammarTopic,
	UserTopicProgress,
	UpdateUserTopicProgress,
} from "@domain/grammar/types";

import { toDomainTopic, toDomainProgress, toDbTopicData } from "./mappers";

export class PrismaGrammarRepository implements GrammarRepository {
	constructor(private prisma: PrismaClient) {}

	async findTopicById(topicId: string): Promise<GrammarTopic | null> {
		const record = await this.prisma.grammarTopic.findUnique({
			where: { id: topicId },
		});

		return record ? toDomainTopic(record) : null;
	}

	async upsertTopic(topic: CreateGrammarTopic): Promise<GrammarTopic> {
		const data = toDbTopicData(topic);

		const record = await this.prisma.grammarTopic.upsert({
			where: { id: topic.id },
			update: data,
			create: data,
		});

		return toDomainTopic(record);
	}

	async getProgress(userId: number, topicId: string): Promise<UserTopicProgress | null> {
		const record = await this.prisma.userTopicProgress.findUnique({
			where: {
				userId_topicId: { userId, topicId },
			},
		});

		return record ? toDomainProgress(record) : null;
	}

	async getAllUserProgress(userId: number): Promise<UserTopicProgress[]> {
		const records = await this.prisma.userTopicProgress.findMany({
			where: { userId },
			include: {
				topic: true, // Include topic data for richer context
			},
			orderBy: [
				{ lastPracticedAt: "desc" }, // Most recent first
				{ createdAt: "desc" },
			],
		});

		return records.map((r) => toDomainProgress(r));
	}

	async markExposed(userId: number, topicId: string): Promise<void> {
		console.log(`[grammar] user=${userId} exposed to topic=${topicId}`);

		await this.prisma.userTopicProgress.upsert({
			where: {
				userId_topicId: { userId, topicId },
			},
			update: {
				exposed: true,
			},
			create: {
				userId,
				topicId,
				exposed: true,
			},
		});
	}

	async updateProgress(
		userId: number,
		topicId: string,
		data: UpdateUserTopicProgress
	): Promise<void> {
		console.log(
			`[grammar] user=${userId} topic=${topicId} progress: +${data.practiceCount} sessions, ${data.correctCount}/${data.totalCount} correct`
		);

		// Получаем текущий прогресс
		const existing = await this.prisma.userTopicProgress.findUnique({
			where: { userId_topicId: { userId, topicId } },
		});

		if (existing) {
			// Инкрементируем существующие значения
			await this.prisma.userTopicProgress.update({
				where: { userId_topicId: { userId, topicId } },
				data: {
					practiceCount: existing.practiceCount + (data.practiceCount ?? 0),
					correctCount: existing.correctCount + (data.correctCount ?? 0),
					totalCount: existing.totalCount + (data.totalCount ?? 0),
					lastPracticedAt: data.lastPracticedAt ?? existing.lastPracticedAt,
					mastery: data.mastery ?? existing.mastery,
				},
			});
		} else {
			// Создаем новую запись с начальными значениями
			await this.prisma.userTopicProgress.create({
				data: {
					userId,
					topicId,
					practiceCount: data.practiceCount ?? 0,
					correctCount: data.correctCount ?? 0,
					totalCount: data.totalCount ?? 0,
					lastPracticedAt: data.lastPracticedAt,
					mastery: data.mastery ?? 0,
					exposed: false, // Если практика началась без теории
				},
			});
		}
	}
}
