# Mall Hell

**Version 5.5** | First-person arcade shooter | Clear the mall of enemies

## Quick Commands

| Task | Command |
|------|---------|
| Run failed tests | `bun run-tests.js --failed` |
| Test domain | `bun run-tests.js --domain=enemy` |
| Test group | `bun run-tests.js --group=weapon` |
| Test single | `bun run-tests.js --test=<id>` |
| Integration tests | `bun run-tests.js --suite=integration` |
| Full suite | `bun run test` (only when asked) |
| Rerun flaky test | Run failed test in isolation to verify if timing issue |

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
3. **Domain boundaries** - Each domain is self-contained
4. **Single source of truth** - Use constants from `<domain>.js` files
5. **Orchestrators over instances** - Use `WeaponOrchestrator`, `EnemyOrchestrator`, etc.
6. **Stateless helpers** - Mesh/animation modules receive all data as parameters
7. **Integration tests use manualUpdate** - Call `LoopOrchestrator.stop()` then use `manualUpdate(dt)` for deterministic control
8. **Test isolation** - Framework stops game loop before each test; reset weapon state between tests
9. **Valid room positions** - Default start is (45, 75) in room (1,2); position (0,0) is invalid
10. **Damage calculations in domain files** - collision-orchestrator reads damage from userData, never calculates it
11. **Weapon fire() returns damage** - Must pass through createMesh options chain to projectile userData
12. **Status effects use userData timestamps** - Store `slowedUntil`, check `Date.now() < timestamp`, auto-expire

## Domain Quick Reference

| Domain | Data | Orchestrator | Purpose |
|--------|------|--------------|---------|
| enemy | `enemy.js` | `enemy-orchestrator.js` | Enemy types, AI, spawning |
| weapon | `weapon.js` | `weapon-orchestrator.js` | Weapons, ammo, firing |
| room | `room.js` | `room-orchestrator.js` | Room grid, themes |
| environment | `obstacle.js` | `spawn-orchestrator.js` | Obstacles, lazy loading |
| ui | `ui.js` | `ui-orchestrator.js` | HUD, menus, minimap |
| player | `player.js` | `player-orchestrator.js` | Movement, health |
| projectile | `projectile.js` | `projectile-orchestrator.js` | Projectile physics |
| engine | - | `state-orchestrator.js`, etc. | Core game systems |

## File Ownership

| File | Purpose |
|------|---------|
| `index.html` | Orchestration only (game loop, glue code) |
| `src/<domain>/` | Domain logic (self-contained) |
| `tests/` | Test runners and test files |

## Common Patterns

**Weapon config access:** `weapon.config.projectile.speed.min` (not speedMin)
**Enemy visual effects:** Traverse `enemy.mesh.userData.cart`, set `child.material.emissive`
**Test helpers in index.html:** `startFiring()` → `startCharging()`, `stopFiring()` → `releaseAndFire()`
**Weapon spawn offsets:** Each weapon has `spawnOffset: { forward, down, right }` for projectile origin

## Weapon Balance (v5.5)

| Weapon | Damage | Ammo | Charge Time | Notes |
|--------|--------|------|-------------|-------|
| Slingshot | 1 base, +3 per charge<br>Quick: 1, Half: 2, Full: 4 | 25 | 2.0s to full charge<br>minTension: 0.05 | Skill-based workhorse, rewards patience |
| Nerf Gun | 3 flat | 12 | N/A | Reliable sidearm, 20% faster projectiles (120 speed) |
| Water Gun | 2 direct, 3 splash | 30 | N/A | Crowd control, 50% stronger AOE |
| Laser Gun | 1 per shot | 75 | N/A | Power weapon, melts 18 skeletons per magazine |

## Before Claiming Done

```
[ ] Related tests pass
[ ] No console errors
[ ] Manual smoke test (30 sec)
```
