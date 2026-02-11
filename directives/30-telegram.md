# Telegram Bot Directives

## D-030: grammY Framework
- Entry point: `/src/bot.ts`
- Bot instance created with token from BOT_TOKEN env var
- Message handlers use middleware pattern:
  - `bot.command()` — slash commands (/start, /debug)
  - `bot.on()` — event handlers (message:text, callback_query, etc.)
- Keyboard class for reply keyboards (menu buttons)

## D-031: Message Routing by State
- Current: free text routing by user state (not LLM-routing)
- State machine (see PRODUCT.md Section 8):
  - ONBOARDING: collect user profile via LLM analysis
  - MAIN_MENU: show menu, wait for button press
- **No free text commands in MAIN_MENU** (menu is the interface)

## D-032: Inline vs Reply Keyboards
- **Reply Keyboard** — persistent buttons below text input (main menu)
- **Inline Buttons** — buttons inside message (context actions, later stages)
- Current MVP: only reply keyboards in use

## D-033: Message Language
- Bot messages to user: Russian primary, English in exercises
- Code comments: English
- See CLAUDE.md Language section
