# Agent Protocol — Core Work Cycle

## D-001: Work Cycle
Every task follows this cycle:

1. **Understand context** — read files, find entry points, understand existing code
2. **Make minimal changes** — only what's needed for the task
3. **Run mandatory checks** — see D-050 in git-quality.md
4. **Restart runtime if needed** — see D-020 in runtime.md
5. **Smoke check** — verify bot responds / command works / no crashes
6. **Short report** — what changed, how verified

## D-002: No Guessing
- Never invent configs, endpoints, or commands
- If unsure, search the repo (package.json, README, scripts, .env.example)
- Ask or read existing patterns before implementing

## D-003: Keep Diffs Small
- Minimal diff per change
- No refactoring outside task scope
- No "improvements" unless explicitly requested
- Preserves code review clarity
