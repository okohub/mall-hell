# Integration Test Suite Design

**Date:** 2026-01-27
**Status:** Approved
**Purpose:** Add integration tests for end-to-end game mechanics validation

## Problem Statement

Current test coverage has gaps:
- **Unit tests** validate isolated data structures and individual functions
- **UI tests** check DOM elements and state transitions
- **Missing:** End-to-end validation of complete game mechanics working together

Integration tests are needed to verify:
- Combat flow: shoot → hit → damage → kill
- Enemy behavior: spawn → AI → attack → death
- Room progression: pre-spawning, materialization, room traversal
- Player lifecycle: movement → damage → death

These tests will make future refactoring safer by catching mechanics-level regressions.

## Architecture

### File Structure

```
tests/
├── integration-tests.html          # New test runner (like ui-tests.html)
├── integration-test-framework.js   # Extends test-framework with scenario helpers
├── integration/
│   ├── combat.tests.js            # Shoot → hit → damage → kill flows
│   ├── enemy-lifecycle.tests.js   # Spawn → AI → attack → death
│   ├── room-progression.tests.js  # Enter → clear → advance
│   └── player-lifecycle.tests.js  # Movement → damage → death
```

### Key Architectural Decisions

**1. Separate Test Suite**

Integration tests live in their own test suite (not mixed with unit or UI tests):
- Clear separation of test types
- Independent test runner
- Can run integration tests separately: `bun run-tests.js --suite=integration`

**2. Hybrid Timing Approach**

Balance speed with accuracy:
- **Setup/positioning:** Use `manualUpdate()` to fast-forward (no waits)
- **Critical mechanics:** Use real `await runner.wait()` for actual game loop timing
- **Example:** Spawn enemy instantly, but wait for real projectile flight time

**Rationale:** Tests run in ~5-10 seconds each instead of 20+ seconds, while still catching timing bugs in critical paths.

**3. Scenario Helper Functions**

Reusable setup utilities reduce boilerplate:
```javascript
// Instead of 20 lines of setup code:
const { enemy, weapon } = await helpers.setupCombatScenario({
    weapon: 'slingshot',
    enemyType: 'SKELETON',
    distance: 20
});
```

**4. Test Isolation**

Each test gets:
- Fresh game reset via `runner.resetGame()` (handled by framework)
- Clean DOM state
- Independent scenario setup via helpers
- No shared state between tests

## Test Organization

### Combat Flow Tests (`tests/integration/combat.tests.js`)

Verify complete weapon firing → projectile → collision → damage chain:

| Test ID | Scenario | Validates |
|---------|----------|-----------|
| `slingshot-hits-skeleton` | Fire slingshot at close enemy | Projectile travels, hits enemy, deals 1 damage |
| `slingshot-kills-skeleton` | Fire at low-health enemy | Health depletes to 0, enemy dies, score increases |
| `watergun-rapid-fire-kills` | Hold fire button | Multiple projectiles spawn, rapid hits, kill enemy |
| `nerfgun-headshot-bonus` | Aim at head height | Bonus damage applies correctly |
| `weapon-cooldown-prevents-fire` | Fire twice rapidly | Second fire blocked by cooldown |
| `projectile-max-range` | Fire at distant enemy (beyond range) | Projectile despawns at max range, no hit |
| `collision-with-obstacle` | Fire at enemy behind shelf | Projectile hits obstacle, enemy unharmed |
| `weapon-switch-mid-combat` | Fire, switch weapons, fire again | State clears, new weapon fires correctly |

### Enemy Lifecycle Tests (`tests/integration/enemy-lifecycle.tests.js`)

Verify enemy spawning → behavior → attacking → death mechanics:

| Test ID | Scenario | Validates |
|---------|----------|-----------|
| `skeleton-spawns-in-room` | Enter new room | Skeleton spawns with correct health/speed |
| `skeleton-chases-player` | Enemy sees player | Moves toward player, closes distance over time |
| `skeleton-line-of-sight` | Place obstacle between player/enemy | Enemy stops or pathfinds around obstacle |
| `skeleton-collides-player` | Enemy reaches player | Collision detected, player takes damage |
| `skeleton-death-sequence` | Enemy health reaches 0 | Removed from scene, score awarded |
| `dinosaur-boss-spawns-at-5000` | Reach 5000 score | Boss warning appears, dino spawns |
| `dinosaur-takes-multiple-hits` | Attack boss (10 health) | Requires 10 hits to kill |
| `no-respawn-after-death` | Kill enemy, wait several seconds | Enemy stays dead (no respawn) |
| `pre-spawning-ahead` | Check rooms player hasn't entered | Enemies exist in nearby rooms |
| `safe-room-no-spawn` | Start game | Starting room (1,2) has zero enemies |

### Room Progression Tests (`tests/integration/room-progression.tests.js`)

Verify player movement through rooms and pre-spawning system:

| Test ID | Scenario | Validates |
|---------|----------|-----------|
| `nearby-rooms-materialize-enemies` | Start game, check adjacent rooms | Enemies already materialized before entering |
| `distant-rooms-not-materialized` | Check rooms far from player | Enemies planned but not materialized yet |
| `approach-room-triggers-materialization` | Move toward unmaterialized room | Enemies spawn before player enters |
| `room-themes-assigned-at-start` | Check multiple rooms | Each has theme, themes don't change during play |
| `minimap-updates-on-room-change` | Move between rooms | Minimap highlights current room correctly |
| `enemies-only-in-nearby-rooms` | Check enemy positions | Only current + adjacent rooms have materialized enemies |
| `timer-counts-down-while-playing` | Start at 3:00, wait 2 seconds | Timer decreases correctly |
| `game-over-when-timer-zero` | Set timer to 1 second, wait | Game over (loss) when timer expires |
| `score-increases-through-gameplay` | Kill enemies | Score accumulates, no cap |

### Player Lifecycle Tests (`tests/integration/player-lifecycle.tests.js`)

Verify player controls, damage, and death (survival mechanics):

| Test ID | Scenario | Validates |
|---------|----------|-----------|
| `wasd-movement-in-game` | Press W key | Cart moves forward in world space |
| `player-collision-with-obstacle` | Drive into shelf | Cart stops/blocked by obstacle |
| `enemy-collision-damages-player` | Enemy touches player | Health decreases, damage overlay flashes |
| `multiple-hits-reduce-health` | Take 5 hits | Health bar at 50% (5/10 health) |
| `player-death-at-zero-health` | Health reaches 0 | Game over screen shows "WRECKED!" |
| `death-is-loss-condition` | Die | Game state = GAME_OVER, no respawn |
| `movement-disabled-when-dead` | After death, press WASD | No movement occurs |
| `weapon-pickup-equips-weapon` | Drive over weapon pickup | Weapon switches, ammo resets |
| `pause-stops-gameplay` | Press ESC | Enemies freeze, timer stops, projectiles freeze |
| `resume-restores-gameplay` | Resume from pause | Everything continues from paused state |
| `high-score-survival-goal` | Play game | Focus is score maximization (no "clear mall" victory) |

**Game Mechanics Clarifications:**
- **No victory condition:** Game is survival-focused (high score), not objective-based
- **Loss conditions:** (1) Player health reaches 0, or (2) Timer runs out
- **Room themes:** Assigned per room at game start, don't change during play
- **Pre-spawning:** Enemies materialize in nearby rooms BEFORE player enters them

## Helper Functions

### Integration Test Framework (`tests/integration-test-framework.js`)

Extends existing test framework with scenario setup helpers.

#### Scenario Setup Helpers

```javascript
helpers.setupCombatScenario(options)
```
- **Parameters:** `{ weapon, enemyType, distance, enemyHealth }`
- **Actions:** Starts game, spawns enemy at distance, equips weapon, positions player facing enemy
- **Returns:** `{ enemy, weapon, player }`
- **Timing:** Uses `manualUpdate()` for instant setup

```javascript
helpers.spawnEnemyAt(x, z, type, health)
```
- **Actions:** Creates enemy mesh via `EnemyOrchestrator`, sets position, optionally overrides health
- **Returns:** Enemy reference
- **Adds to:** Scene and enemies array

```javascript
helpers.positionPlayerAt(x, z, rotation)
```
- **Actions:** Sets camera position, player cart position, and rotation
- **Timing:** Uses `manualUpdate()` to apply immediately

```javascript
helpers.fireWeapon(chargeTime)
```
- **Actions:** Calls `startFiring()`, waits for charge (optional), calls `stopFiring()`
- **Returns:** Projectile reference
- **Timing:** Real timing for charge

#### Assertion Helpers

```javascript
helpers.waitForProjectileImpact(maxTime = 2000)
```
- **Actions:** Polls until projectile hits or despawns
- **Returns:** `{ hit: boolean, target: enemy|null }`
- **Timing:** Real timing for projectile flight

```javascript
helpers.waitForEnemyDeath(enemy, maxTime = 3000)
```
- **Actions:** Polls until `enemy.userData.active = false`
- **Throws:** Error if timeout

```javascript
helpers.getEnemiesInRoom(roomX, roomZ)
```
- **Actions:** Returns array of enemies in specified room
- **Uses:** `ROOM_UNIT` calculations from game constants

```javascript
helpers.assertPlayerHealth(expected)
```
- **Actions:** Checks player health matches expected value
- **Throws:** Descriptive error if mismatch

## Example Test Implementations

### Combat Flow Example

```javascript
runner.addTest('slingshot-kills-skeleton', 'Combat Flow', 'Full combat cycle from fire to kill',
    'Verifies slingshot can fire, hit, damage, and kill a skeleton enemy',
    async () => {
        // Setup: Spawn skeleton with 1 health at close range
        const { enemy, weapon } = await helpers.setupCombatScenario({
            weapon: 'slingshot',
            enemyType: 'SKELETON',
            distance: 20,
            enemyHealth: 1
        });

        const initialScore = runner.getScore();

        // Action: Fire charged shot (real timing)
        await helpers.fireWeapon(500); // 500ms charge

        // Assert: Projectile hits and kills enemy (real timing)
        const impact = await helpers.waitForProjectileImpact(2000);
        if (!impact.hit) {
            throw new Error('Projectile missed enemy');
        }

        await helpers.waitForEnemyDeath(enemy, 1000);

        // Verify score increased
        const newScore = runner.getScore();
        if (newScore <= initialScore) {
            throw new Error(`Score did not increase: ${initialScore} -> ${newScore}`);
        }
    }
);
```

### Enemy Lifecycle Example

```javascript
runner.addTest('skeleton-chases-player', 'Enemy AI', 'Enemy moves toward player',
    'Verifies skeleton AI detects player and moves closer over time',
    async () => {
        runner.resetGame();
        await runner.wait(100);
        runner.simulateClick(runner.getElement('#start-btn'));
        await runner.wait(300);

        // Spawn enemy 30 units away (instant via manualUpdate)
        const enemy = await helpers.spawnEnemyAt(0, -30, 'SKELETON');
        await helpers.positionPlayerAt(0, 0, 0);

        const initialDistance = Math.abs(enemy.position.z);

        // Wait for AI to move enemy (real timing)
        await runner.wait(2000);

        const newDistance = Math.abs(enemy.position.z);

        if (newDistance >= initialDistance) {
            throw new Error(`Enemy did not move closer: ${initialDistance} -> ${newDistance}`);
        }
    }
);
```

### Room Progression Example

```javascript
runner.addTest('nearby-rooms-pre-spawned', 'Pre-Spawning', 'Adjacent rooms have enemies',
    'Verifies enemies spawn in nearby rooms before player enters',
    async () => {
        runner.resetGame();
        await runner.wait(100);
        runner.simulateClick(runner.getElement('#start-btn'));
        await runner.wait(500);

        // Player starts at room (1,2)
        const currentRoom = runner.gameWindow.currentRoom || { x: 1, z: 2 };

        // Check adjacent rooms
        const adjacentRooms = [
            { x: currentRoom.x + 1, z: currentRoom.z },
            { x: currentRoom.x - 1, z: currentRoom.z },
            { x: currentRoom.x, z: currentRoom.z + 1 },
            { x: currentRoom.x, z: currentRoom.z - 1 }
        ];

        let hasEnemiesInAdjacentRoom = false;
        for (const room of adjacentRooms) {
            const enemies = helpers.getEnemiesInRoom(room.x, room.z);
            if (enemies.length > 0) {
                hasEnemiesInAdjacentRoom = true;
                break;
            }
        }

        if (!hasEnemiesInAdjacentRoom) {
            throw new Error('No enemies found in adjacent rooms - pre-spawning not working');
        }
    }
);
```

## Test Runner Integration

### Running Integration Tests

Add to `CLAUDE.md` quick commands:

```bash
bun run-tests.js --suite=integration              # Run all integration tests
bun run-tests.js --suite=integration --group="Combat Flow"  # Run specific group
bun run-tests.js --suite=integration --failed     # Re-run failed integration tests
bun run-tests.js --suite=integration --test=<id>  # Run single test
```

### Test Runner HTML (`tests/integration-tests.html`)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mall Hell - Integration Tests</title>
    <!-- Load Three.js -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>

    <!-- Load game files (same order as index.html) -->
    <script src="../src/shared/materials-theme.js"></script>
    <script src="../src/ui/ui.js"></script>
    <script src="../src/ui/ui-orchestrator.js"></script>
    <!-- ... all other game files ... -->

    <!-- Load test framework -->
    <script src="test-framework.js"></script>
    <script src="integration-test-framework.js"></script>

    <!-- Load integration test files -->
    <script src="integration/combat.tests.js"></script>
    <script src="integration/enemy-lifecycle.tests.js"></script>
    <script src="integration/room-progression.tests.js"></script>
    <script src="integration/player-lifecycle.tests.js"></script>
</head>
<body>
    <iframe id="game-frame" src="../index.html"></iframe>
</body>
</html>
```

### Test Execution Strategy

**Performance:**
- Integration tests run slower than unit tests (5-10 seconds each with hybrid timing)
- Estimated ~30-40 integration tests total
- Full suite runtime: ~3-5 minutes

**Development Workflow:**
- Use `--group` or `--test` flags for targeted testing during development
- Run full integration suite before commits/PRs
- Run `--failed` to quickly iterate on broken tests

**CI/CD:**
- Run integration tests after unit tests pass
- Integration failures should block merges

## Implementation Plan

### Phase 1: Framework Setup
1. Create `tests/integration-test-framework.js` with helper functions
2. Create `tests/integration-tests.html` test runner
3. Update `run-tests.js` to support `--suite=integration` flag
4. Verify basic setup works with one smoke test

### Phase 2: Combat Tests
1. Implement all 8 combat flow tests from design
2. Validate timing (should run in ~60-80 seconds total)
3. Fix any game bugs discovered (validate with user first)

### Phase 3: Enemy Tests
1. Implement all 10 enemy lifecycle tests
2. Focus on pre-spawning and AI behavior validation
3. Verify boss spawn mechanics at 5000 score

### Phase 4: Room & Player Tests
1. Implement 9 room progression tests
2. Implement 11 player lifecycle tests
3. Verify complete game flow coverage

### Phase 5: Documentation & Integration
1. Update `CLAUDE.md` with integration test commands
2. Update `TESTING.md` with integration test guidance
3. Add integration tests to CI/CD pipeline (if applicable)

## Success Criteria

✅ Integration tests catch mechanics-level bugs that unit/UI tests miss
✅ Tests run in <5 minutes for full suite
✅ Helper functions reduce test boilerplate by >50%
✅ Tests are maintainable (can update when game mechanics change)
✅ Clear separation between unit, UI, and integration test types

## Notes

- **Validation before fixes:** When integration tests fail, validate with user before changing game logic (test might be wrong about mechanics)
- **Hybrid timing rationale:** Pure real-time would take 15-20 minutes for full suite, pure manualUpdate() would miss timing bugs
- **Helper extensibility:** Framework designed to add new helpers as test patterns emerge
