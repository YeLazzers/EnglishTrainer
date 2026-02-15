// @legacy: works with TestUserState/TestUserProfile tables.
// Use @adapters/db/user/prisma-repository for new code.
//
// TODO: TECH DEBT - Remove this file and all references to it:
// - This is legacy code used only by src/state.ts facade
// - src/state.ts itself should be removed or migrated to use @adapters/db/user
// - All imports of createUserRepository should use @adapters/db/user instead
// - After migration, delete this file and @adapters/db/index.ts

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { UserRepository } from "@domain/repository";
import { UserState, UserProfile, CreateUserProfile } from "@domain/types";

import { toDomainProfile, toDbProfileData } from "./mappers";

export class PrismaUserRepository implements UserRepository {
	private prisma: PrismaClient;

	constructor(connectionString?: string) {
		const url = connectionString ?? process.env.DATABASE_URL;
		if (!url) throw new Error("DATABASE_URL is not set");

		const adapter = new PrismaBetterSqlite3({ url });
		this.prisma = new PrismaClient({ adapter });
	}

	async getState(userId: number): Promise<UserState | undefined> {
		const record = await this.prisma.testUserState.findUnique({
			where: { id: userId },
		});

		return record?.state as UserState | undefined;
	}

	async setState(userId: number, state: UserState): Promise<void> {
		const prev = await this.getState(userId);
		const prevStr = prev ?? "NONE";
		console.log(`[state] user=${userId}: ${prevStr} → ${state}`);

		await this.prisma.testUserState.upsert({
			where: { id: userId },
			update: { state },
			create: { id: userId, state },
		});
	}

	async getProfile(userId: number): Promise<UserProfile | undefined> {
		const record = await this.prisma.testUserProfile.findUnique({
			where: { id: userId },
		});

		if (!record) return undefined;
		return toDomainProfile(record);
	}

	async setProfile(userId: number, profile: CreateUserProfile): Promise<void> {
		const data = toDbProfileData(userId, profile);

		await this.prisma.testUserProfile.upsert({
			where: { id: userId },
			update: {
				level: data.level,
				goals: data.goals,
				interests: data.interests,
				rawResponse: data.rawResponse,
			},
			create: data,
		});
	}
}
