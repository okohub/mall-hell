# Mall Hell

**Version 5.1** | First-person arcade shooter | Clear the mall of enemies

## Quick Commands

| Task | Command |
|------|---------|
| Run failed tests | `bun run-tests.js --failed` |
| Test domain | `bun run-tests.js --domain=enemy` |
| Test group | `bun run-tests.js --group=weapon` |
| Test single | `bun run-tests.js --test=<id>` |
| Stop on fail | `bun run-tests.js --fail-fast` |
| Full suite | `bun run test` (only when asked) |

## Documentation

| Need to... | Read |
|------------|------|
| Understand codebase structure | [Architecture](.claude/docs/ARCHITECTURE.md) |
| Know game mechanics/enemies/weapons | [Game Design](.claude/docs/GAME_DESIGN.md) |
| Add enemy, weapon, UI, fix bug | [Workflows](.claude/docs/WORKFLOWS.md) |
| Write or run tests | [Testing](.claude/docs/TESTING.md) |

## Development Rules

1. **Read before write** - Never modify code you haven't read
2. **Fix code, not tests** - If tests fail, implementation is wrong
3. **Domain boundaries** - Each domain is self-contained (not pure DDD, but domain-inspired)
4. **Single source of truth** - Use constants from `<domain>.js` files, never hardcode
5. **Managers over instances** - Use `WeaponManager`, `EnemySystem`, not specific implementations
6. **Stateless helpers** - Mesh/animation modules receive all data as parameters (no internal state)

## Domain Quick Reference

| Domain | Data | System | Purpose |
|--------|------|--------|---------|
| enemy | `enemy.js` | `enemy-system.js` | Enemy types, AI, spawning |
| weapon | `weapon.js` | `weapon-manager.js` | Weapons, ammo, firing |
| room | `room.js` | `room-system.js` | Room grid, themes |
| environment | `obstacle.js` | `spawn-system.js` | Obstacles, lazy loading |
| ui | `ui.js` | `ui-system.js` | HUD, menus, minimap |
| player | `player.js` | `player-system.js` | Movement, health |
| projectile | `projectile.js` | `projectile-system.js` | Projectile physics |
| engine | - | `state-system.js`, etc. | Core game systems |

## File Ownership

| File | Purpose |
|------|---------|
| `index.html` | Orchestration only (game loop, glue code) |
| `src/<domain>/` | Domain logic (self-contained) |
| `tests/` | Test runners and test files |

## Before Claiming Done

```
[ ] Related tests pass
[ ] No console errors
[ ] Manual smoke test (30 sec)
```
