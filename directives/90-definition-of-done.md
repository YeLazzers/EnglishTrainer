# Definition of Done

A task is **DONE** when:

## Code
- [ ] Changes align with PRODUCT.md (Section 3, 4, 8, 9)
- [ ] TypeScript compiles without errors
- [ ] Code follows existing patterns (no new abstractions)
- [ ] Comments only where logic isn't obvious

## Testing & Verification
- [ ] Dev server starts: `npm run dev` runs cleanly
- [ ] Smoke check: bot responds to test commands/messages
- [ ] If schema changed: migration applied, Prisma client regenerated
- [ ] If env vars added: .env.example updated

## Quality
- [ ] Git status clean: only intended files modified
- [ ] Diff is minimal and readable
- [ ] No dead code, no commented-out logic
- [ ] No console.logs left (except debug logging with DEBUG env)

## Communication
- [ ] Short report posted: what changed, how verified, any gotchas
- [ ] If blocked: clear explanation of issue

## Not Required
- [ ] Tests (no test suite yet; MVP stage)
- [ ] Documentation beyond inline comments
- [ ] Refactoring outside task scope
