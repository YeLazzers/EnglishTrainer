# Git & Quality Directives

## D-050: Before Any Commit
- Run: `git status` — verify only intended files are staged
- Never commit: .db files, .env, node_modules, dist/ (check .gitignore)
- Check: no accidental large files or secrets

## D-051: Commit Message Format
- Concise, imperative: "Add /grammar command" (not "Added grammar feature")
- One sentence per logical change
- Reference PRODUCT.md sections if relevant
- Co-author line if pair-programmed (usually not needed)

## D-052: Pushing & PR
- **Always ask before pushing** or creating PRs
- Check: branch is up-to-date with main
- Never force-push to main
- Test locally before push (see runtime.md D-011)

## D-053: Revert & Fix
- Never destructive operations (reset --hard, rm -rf) without explicit approval
- If broken: fix root cause, create new commit (not amend)
- If stuck: ask for guidance

## D-054: Code Quality
- TypeScript: no implicit `any`, prefer typed functions
- No dead code: delete unused, don't comment out
- No "just in case" abstractions
- Simple > clever
