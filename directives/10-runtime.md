# Runtime Directives

## D-010: Dev Mode
- Start: `npm run dev` (uses tsx, loads .env automatically)
- Bot runs with long polling (no web server)
- Watch for TypeScript errors in console

## D-011: Restart Server After Code Changes
- **When:** After completing a task with code modifications
- **How:** Stop running dev server (Ctrl+C) → run `npm run dev`
- **Only at end of task**, not after each file
- **Skip if:** Only comments/docs changed, or no changes made
- **Purpose:** Verify TypeScript compiles, no runtime errors, bot starts cleanly
- **Success:** See "Bot is running..." message in console

## D-012: Build Verification
- Run: `npm run build` before major commits
- Ensures TypeScript compiles to JavaScript
- Check dist/ directory exists with no errors
