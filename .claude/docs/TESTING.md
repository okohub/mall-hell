# Testing Guide

## Important: No Shell Redirects

Never use `2>&1` or other shell redirects with the test runner:
```bash
# WRONG - unnecessary, provides no benefit
bun run-tests.js 2>&1

# CORRECT
bun run-tests.js
```

The test runner captures all output internally and saves to `.test-output/`. Shell redirects are consumed by the shell before the script runs, so they cannot be detected or blocked.

## Quick Reference

| Command | Use When |
|---------|----------|
| `bun run-tests.js --failed` | Re-run only failed tests |
| `bun run-tests.js --domain=<name>` | Changed a specific domain |
| `bun run-tests.js --group=<name>` | Test specific feature group |
| `bun run-tests.js --test=<id>` | Test single test by ID |
| `bun run-tests.js --fail-fast` | Stop on first failure |
| `bun run-tests.js --suite=integration` | Run integration tests |
| `bun run test` | Full suite (only when user asks) |

## Workflow Rules

### Before Running Tests
1. Read `.test-output/latest.json` first
2. Check what failed in the last run
3. Only run tests if you made code changes

### Run Only Related Tests
- Changed enemy code? → `--domain=enemy`
- Changed specific feature? → `--test=<test-id>`
- Re-run failures? → `--failed`

### One Test Run Per Change
- Make your fix
- Run specific test(s) ONCE
- Read the output file
- DO NOT re-run unless you made another change

## Test Output

Results saved to `.test-output/`:
- `latest.json` - Most recent results
- `latest.txt` - Console output
- `run-<timestamp>.json` - History

## Writing Tests

### Unit Tests
- Location: `src/<domain>/<domain>.test.js`
- Register in: `tests/unit-tests.html`

### UI Tests
- Location: `tests/ui/<domain>.tests.js`
- Register in: `tests/ui-tests.html`

### Integration Tests
- Location: `tests/integration/<feature>.tests.js`
- Register in: `tests/integration-tests.html`
- Purpose: Test complete game mechanics end-to-end
- Run: `bun run-tests.js --suite=integration`
- Runtime: ~3-5 minutes for full suite

**Integration test groups:**
- Combat Flow: Weapon firing → projectile → hit → damage → kill
- Enemy Lifecycle: Spawn → AI → attack → death
- Room Progression: Pre-spawning, materialization, movement
- Player Lifecycle: Movement → damage → death, survival mechanics

### Critical Patterns

**Use orchestrators, not specific implementations:**
```javascript
// GOOD - weapon agnostic
WeaponOrchestrator.currentWeapon.state.lastFireTime = 0;

// BAD - couples to specific weapon
Slingshot.state.lastFireTime = 0;
```

**Same principle for all domains:**
- Use `EntityOrchestrator`, not specific entity arrays
- Use `StateOrchestrator`, not direct state manipulation
- Use `EnemyOrchestrator.getSpawnType()`, not hardcoded types

## Test Isolation

The test runner automatically resets game state before and after each test. Tests should NOT call `runner.resetGame()` manually - the runner handles this.

**What the runner does:**
1. Calls `resetGame()` before each test
2. Waits 100ms for state to settle
3. Runs the test
4. Calls `resetGame()` after test (cleanup)

**What gets reset:**
- Game state → MENU
- UIOrchestrator.showMenu() called
- Pending UI timeouts cleared
- Boss warning elements removed
- Score reset to 0

## Known Limitation: Keyboard Event Simulation

**Keyboard events (`simulateKeyDown`) are unreliable in the puppeteer/iframe test environment.**

The issue: Events dispatched to `gameDocument` sometimes don't reach `InputOrchestrator` listeners, even though:
- InputOrchestrator is initialized
- Callbacks are registered
- Event format is correct

This is an environment limitation, not a game bug. The actual game keyboard input works fine.

**Workaround: Use direct function calls instead of simulated keys**

```javascript
// UNRELIABLE - may intermittently fail
runner.simulateKeyDown('Escape');
await runner.wait(100);
// State might still be PLAYING!

// RELIABLE - use direct function call
runner.gameWindow.pauseGame();
await runner.wait(100);
// State is guaranteed PAUSED
```

**When to use each approach:**

| Action | Unreliable | Reliable Alternative |
|--------|------------|---------------------|
| Pause game | `simulateKeyDown('Escape')` | `gameWindow.pauseGame()` |
| Resume game | `simulateKeyDown('Escape')` | `gameWindow.resumeGame()` |
| Start firing | `simulateKeyDown(' ')` | `gameWindow.startFiring()` |
| Stop firing | `simulateKeyUp(' ')` | `gameWindow.stopFiring()` |

**Note:** Click simulation (`simulateClick`) works reliably - only keyboard events have this issue.

## Weapon State in Tests

When testing weapon functionality, always call `weapon.reset()` before your test to ensure clean state:

```javascript
const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
WeaponOrchestrator.currentWeapon.reset();  // Clean state

// Now test weapon behavior
weapon.onFireStart(Date.now());
```

**Why:** Previous tests may have fired the weapon, reducing ammo or setting cooldown timers. Without reset, `canFire()` may return false unexpectedly.
