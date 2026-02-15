// Adapter: Prisma implementation of UserRepository (user + user_profile tables)

import type { PrismaClient } from "@prisma/client";

import type { UserState } from "@domain/types";
import type { UserRepository } from "@domain/user/repository";
import type { User, UserProfile, CreateUser, CreateUserProfile } from "@domain/user/types";

import { toDomainUser, toDomainProfile, toDbUserData, toDbProfileData } from "./mappers";

export class PrismaUserRepository implements UserRepository {
	constructor(private prisma: PrismaClient) {}

	async findById(userId: number): Promise<User | null> {
		const record = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		return record ? toDomainUser(record) : null;
	}

	async upsert(data: CreateUser): Promise<User> {
		const dbData = toDbUserData(data);

		const record = await this.prisma.user.upsert({
			where: { id: data.id },
			update: dbData,
			create: dbData,
		});

		return toDomainUser(record);
	}

	async getState(userId: number): Promise<UserState | null> {
		const record = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { state: true },
		});

		return (record?.state as UserState) ?? null;
	}

	async setState(userId: number, state: UserState): Promise<void> {
		console.log(`[state] user=${userId}: → ${state}`);

		await this.prisma.user.update({
			where: { id: userId },
			data: { state },
		});
	}

	async getProfile(userId: number): Promise<UserProfile | null> {
		const record = await this.prisma.userProfile.findUnique({
			where: { userId },
		});

		return record ? toDomainProfile(record) : null;
	}

	async setProfile(userId: number, profile: CreateUserProfile): Promise<void> {
		const data = toDbProfileData(profile);

		await this.prisma.userProfile.upsert({
			where: { userId },
			update: data,
			create: { userId, ...data },
		});
	}
}
