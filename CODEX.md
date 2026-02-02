# CODEX.md

This repo uses `CLAUDE.md` as the primary project guide. Read it first:
- `CLAUDE.md`

## Codex Notes (session learnings)
- Integration tests should follow the game-boot pattern: `resetGame()` → click `#start-btn` → stop loop → use `manualUpdate()` for deterministic steps.
- The shared helper `IntegrationHelpers.bootGameForIntegration()` mirrors this flow.
- Unit/UI/integration tests are browser-driven via Puppeteer; in restricted environments, browser launch may fail.
- `progress.md` is a local scratchpad and is ignored in `.gitignore`.

## Co-Authoring
When making commits, include:
`Co-authored-by: Codex <noreply@openai.com>`
