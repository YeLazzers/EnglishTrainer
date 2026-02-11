// Domain layer - pure business logic types, no infrastructure dependencies

export enum UserState {
  ONBOARDING = "ONBOARDING",
  MAIN_MENU = "MAIN_MENU",
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

export type CreateUserProfile = Omit<
  UserProfile,
  "id" | "createdAt" | "updatedAt"
>;
