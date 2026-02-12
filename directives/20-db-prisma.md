# Database & Prisma Directives

## D-020: Schema Changes
- Edit: `/prisma/schema.prisma`
<!-- - After changes, generate migration: `npx prisma migrate dev --name <description>` -->
- This auto-creates migration file AND updates Prisma client in `/src/generated/prisma`
- Test migration applies cleanly to test.db

## D-021: Prisma Client Usage
- Import from `/src/generated/prisma`: auto-generated types and client
- Use through state.ts functions, not directly in bot.ts
- Never modify `/src/generated/` files directly (auto-generated)

## D-022: Data Models

### Current models (new)
- **User** — Telegram user ID (Int @id), Telegram metadata (firstName, lastName, username, languageCode, isPremium), state (current bot dialog state)
- **UserProfile** — 1:1 with User (userId is PK+FK), CEFR level, goals, interests, rawResponse
- **Skill** — standalone reference, String ID ("GRAMMAR", "VOCABULARY", etc.)
- **GrammarCategory** — grammar categories, String ID ("TENSES", "MODALS", etc.)
- **GrammarTopic** — topics within category, String ID, FK → GrammarCategory, cefrLevel
- **UserTopicProgress** — composite PK (userId, topicId), mastery 0-100, practice counts

### Legacy models (will be removed after migration)
- **TestUserState** — old user state table
- **TestUserProfile** — old user profile table

## D-023: Database File
- Dev database: `/test.db` (SQLite, in .gitignore)
- Migrations in `/prisma/migrations/`
- Never commit .db files, only schema and migrations
