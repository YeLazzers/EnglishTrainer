import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";
import type { TestUserProfile } from "./generated/prisma/client";

export enum UserState {
  ONBOARDING = "ONBOARDING",
  MAIN_MENU = "MAIN_MENU",
}

export type UserProfile = Omit<TestUserProfile, "goals" | "interests"> & {
  goals: string[];
  interests: string[];
};

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export async function getState(userId: number): Promise<UserState | undefined> {
  const record = await prisma.testUserState.findUnique({
    where: { id: userId },
  });

  return record?.state as UserState | undefined;
}

export async function setState(userId: number, state: UserState): Promise<void> {
  const prev = await getState(userId);
  const prevStr = prev ?? "NONE";
  console.log(`[state] user=${userId}: ${prevStr} → ${state}`);

  await prisma.testUserState.upsert({
    where: { id: userId },
    update: { state },
    create: { id: userId, state },
  });
}

export async function getProfile(
  userId: number
): Promise<UserProfile | undefined> {
  const record = await prisma.testUserProfile.findUnique({
    where: { id: userId },
  });

  if (!record) return undefined;

  return {
    id: record.id,
    level: record.level,
    goals: JSON.parse(record.goals),
    interests: JSON.parse(record.interests),
    rawResponse: record.rawResponse,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function setProfile(
  userId: number,
  profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  const data = {
    level: profile.level,
    goals: JSON.stringify(profile.goals),
    interests: JSON.stringify(profile.interests),
    rawResponse: profile.rawResponse,
  };

  await prisma.testUserProfile.upsert({
    where: { id: userId },
    update: data,
    create: {
      id: userId,
      ...data,
    },
  });
}

export async function initializeUser(userId: number): Promise<void> {
  // Check if user already has state
  const existingState = await getState(userId);

  if (!existingState) {
    // New user - start with MAIN_MENU (onboarding is considered completed)
    await setState(userId, UserState.MAIN_MENU);
  }
}
