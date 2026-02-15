// Factory and re-exports for User domain adapter

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import type { UserRepository } from "@domain/user/repository";

import { PrismaUserRepository } from "./prisma-repository";

export function createUserRepository(): UserRepository {
	const url = process.env.DATABASE_URL;
	// TEMP DEBUG: Comment out to see next error
	// if (!url) throw new Error("DATABASE_URL is not set");
	console.log("[NEW createUserRepository] DATABASE_URL:", url ? `✓ set (${url.substring(0, 30)}...)` : "✗ missing");

	const adapter = new PrismaBetterSqlite3({ url: url || "file:./dev.db" });
	const prisma = new PrismaClient({ adapter });

	return new PrismaUserRepository(prisma);
}

export type { UserRepository } from "@domain/user/repository";
export type { User, UserProfile, CreateUser, CreateUserProfile } from "@domain/user/types";
