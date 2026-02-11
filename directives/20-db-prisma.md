# Database & Prisma Directives

## D-020: Schema Changes
- Edit: `/prisma/schema.prisma`
- After changes, generate migration: `npx prisma migrate dev --name <description>`
- This auto-creates migration file AND updates Prisma client in `/src/generated/prisma`
- Test migration applies cleanly to test.db

## D-021: Prisma Client Usage
- Import from `/src/generated/prisma`: auto-generated types and client
- Use through state.ts functions, not directly in bot.ts
- Never modify `/src/generated/` files directly (auto-generated)

## D-022: Data Models
Current models (TestUserState, TestUserProfile):
- User ID is Telegram user ID (Int)
- State field: ONBOARDING, MAIN_MENU, etc. (see PRODUCT.md state machine)
- Profile: immutable after onboarding (level, goals, interests)

## D-023: Database File
- Dev database: `/test.db` (SQLite, in .gitignore)
- Migrations in `/prisma/migrations/`
- Never commit .db files, only schema and migrations
