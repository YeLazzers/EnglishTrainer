# LLM Integration Directives

## D-040: LLM Provider Pattern
- Factory pattern: `createLLM()` in `/src/llm/index.ts`
- Returns provider based on env var (default: OpenAI)
- Providers implement shared interface (types.ts)
- Current: OpenAI, Gemini available

## D-041: OpenAI (Default)
- Provider: `openai.ts`
- Model: GPT (specify in code or via env, currently hardcoded)
- Authentication: OPENAI_API_KEY env var
- Usage: `llm.chat([{role, content}, ...])`

## D-042: Gemini (Alternative)
- Provider: `gemini.ts`
- Model: Gemini
- Authentication: GOOGLE_API_KEY env var
- Drop-in replacement if needed

## D-043: Prompting for Onboarding
- Prompt in `/src/bot.ts` line ~93-107 (onboarding message analysis)
- Input: user's free text about themselves
- Expected output: JSON with level, goals, interests, summary
- Must parse JSON response
- Fallback: ask user to re-submit if parse fails

## D-044: Cost & Rate Limits
- Watch API usage (each message = API call)
- Avoid unnecessary calls (use cache if possible)
- Test with Gemini if OpenAI rate limited
