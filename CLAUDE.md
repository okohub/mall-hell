# Mall Hell - Project Definition

## Development Contract

**This contract is binding for all development work on this project.**

### Pre-Implementation (Required)
- [ ] Feature requirements documented in this file
- [ ] Acceptance criteria defined with checkboxes
- [ ] Domain tests written in `src/<domain>/<domain>.test.js`
- [ ] UI tests written in `tests/ui-tests.html` (if UI affected)

### Implementation (Required)
- [ ] Code the feature
- [ ] Run unit tests → **ALL MUST PASS**
- [ ] Run UI tests → **ALL MUST PASS** (if applicable)
- [ ] Manual smoke test (30-second check)

### Post-Implementation (Required)
- [ ] All acceptance criteria checkboxes verified
- [ ] Update version number if significant change
- [ ] Document changes in this file

### Rules
1. **No feature is complete until all tests pass**
2. **Fix code, not tests** - if tests fail, the implementation is wrong
3. **No skipping steps** - every feature follows this flow
4. **Tests first** - write tests before or during implementation, not after
5. **Revert if broken** - if tests can't pass, revert and reassess

### Enforcement
Before claiming any feature is "done", I must confirm:
```
[ ] Unit tests: PASS
[ ] UI tests: PASS (if applicable)
[ ] Smoke test: PASS
[ ] AC verified: YES
```

---

## Test Commands

| Command | Description |
|---------|-------------|
| `bun run-tests.js --failed` | **Re-run only failed tests from last run** |
| `bun run-tests.js --test=<id>` | Run specific test by ID |
| `bun run-tests.js --group=<name>` | Run specific test group |
| `bun run-tests.js --domain=<name>` | Run unit tests for specific domain (weapon, enemy, etc.) |
| `bun run-tests.js --list` | List recent test runs |
| `bun run test:unit` | Run all unit tests |
| `bun run test:ui` | Run all UI tests |
| `bun run test` | Run ALL tests (unit + UI) - **ONLY when user explicitly asks** |

### Test Output

All test runs save output to `.test-output/`:
- `latest.json` - Most recent run results (always overwritten)
- `latest.txt` - Most recent run console output
- `run-<timestamp>.json` - Timestamped results (kept for history)

### Test Workflow Rules (MANDATORY - STRICT ENFORCEMENT)

**⚠️ NEVER run the full test suite (`bun run test`) unless the user EXPLICITLY asks for it.**

**Standard workflow:**

1. **READ `.test-output/latest.json` FIRST**
   - Before running any tests, read the latest results
   - Check what failed in the last run
   - Only run tests if you've made code changes

2. **Run ONLY related tests**
   - Changed enemy code? → `bun run-tests.js --domain=enemy`
   - Changed specific feature? → `bun run-tests.js --test=<test-id>`
   - Need to re-run failures? → `bun run-tests.js --failed`

3. **ONE test run per code change**
   - Make your fix
   - Run the specific test(s) ONCE
   - Read the output file
   - DO NOT re-run unless you made another change

4. **Wait for tests to complete**
   - After starting a test run, WAIT for it to finish
   - Read the output file when done
   - NEVER re-run tests because you're impatient

**Examples:**

```bash
# GOOD: Run only failed tests
bun run-tests.js --failed

# GOOD: Run only enemy domain tests
bun run-tests.js --domain=enemy

# GOOD: Run specific test
bun run-tests.js --test=skeleton-spawn

# GOOD: Run specific group
bun run-tests.js --group=weapon

# BAD: Running full suite unnecessarily
bun run test  # ONLY if user explicitly asks!
```

---

## Architecture

### Domain-Driven Design

The codebase follows a domain-driven architecture where each domain is self-contained:

```
mall-hell/
├── index.html              # Main game file
├── CLAUDE.md               # Project definition (this file)
├── README.md               # Player documentation
├── package.json            # Dependencies & scripts
├── run-tests.js            # Test runner
│
├── src/
│   ├── weapon/             # Weapon domain
│   │   ├── weapon.js           # Data definitions (types, configs)
│   │   ├── weapon-visual.js    # Mesh creation (THREE.js)
│   │   ├── weapon-system.js    # Orchestrator (state, logic)
│   │   └── weapon.test.js      # Domain tests
│   │
│   ├── projectile/         # Projectile domain
│   │   ├── projectile.js
│   │   ├── projectile-visual.js
│   │   ├── projectile-system.js
│   │   └── projectile.test.js
│   │
│   ├── enemy/              # Enemy domain
│   │   ├── enemy.js
│   │   ├── enemy-visual.js
│   │   ├── enemy-system.js
│   │   └── enemy.test.js
│   │
│   └── environment/        # Environment domain
│       ├── obstacle.js
│       ├── obstacle-visual.js
│       ├── shelf.js
│       ├── shelf-visual.js
│       ├── environment-system.js
│       └── environment.test.js
│
├── tests/
│   ├── unit-tests.html     # Unit test runner (loads domain tests)
│   └── ui-tests.html       # UI/integration tests
│
└── .test-output/           # Test results
```

### Domain Structure Pattern

Each domain follows this pattern:

| File | Purpose |
|------|---------|
| `<domain>.js` | Pure data definitions (no dependencies) |
| `<domain>-visual.js` | THREE.js mesh creation (receives THREE as parameter) |
| `<domain>-system.js` | Orchestrator: state management, logic, coordination |
| `<domain>.test.js` | Domain-specific unit tests |

**Key principles:**
- **Zero cross-file dependencies** - Each file is self-contained
- **No imports** - Files use global scope or receive dependencies as parameters
- **Separation of concerns** - Data, visuals, and logic are separate
- **Testable** - Each component can be tested in isolation

---

## Overview

**Title:** Mall Hell
**Version:** 3.3
**Platform:** Desktop Browser
**Tech Stack:** HTML5, CSS3, JavaScript, Three.js (r128)
**Delivery:** Single `index.html` file with domain modules in `src/`

## Game Concept

A fast, chaotic first-person browser game where the player is a child sitting in a shopping cart, shooting a slingshot at rival carts and supermarket objects while being pushed forward automatically through a supermarket aisle.

## Technical Constraints

- Single-player only
- No backend/server required
- No build tools or bundlers
- No external assets (all graphics generated via code)
- Keyboard + mouse input only
- Must run immediately when opened in browser
- Target ~60 FPS performance
- Three.js loaded via CDN

## Game States

| State | Description |
|-------|-------------|
| `MENU` | Main menu with title and start button |
| `PLAYING` | Active gameplay |
| `PAUSED` | Game paused, overlay visible |
| `GAME_OVER` | End screen with final score |

### State Transitions

```
MENU → PLAYING (Start button)
PLAYING → PAUSED (ESC key)
PAUSED → PLAYING (ESC key / Resume button)
PAUSED → MENU (Quit button)
PLAYING → GAME_OVER (Reach checkout)
GAME_OVER → PLAYING (Play Again button)
```

## Controls

| Input | Action |
|-------|--------|
| Arrow Keys | Aim crosshair |
| A / D | Dodge cart left/right |
| SPACE (hold) | Charge slingshot |
| SPACE (release) | Fire projectile |
| ESC | Pause/Resume game |

## Core Mechanics

### Player Cart
- First-person POV from inside shopping cart
- Automatic forward movement
- Acceleration-based dodge with cart leaning (A/D keys)
- Camera height: 3 units
- Base movement speed: 25 units/second
- Lateral movement speed: 8 units/second
- Movement bounds: ±10 units from center

### Player Health
- Maximum health: 100 HP
- Starting health: 100 HP
- Collision damage from enemy cart: 20 HP
- Collision damage from obstacle: 10 HP
- Collision invulnerability: 1 second after hit
- Health regeneration: None
- Death condition: Health reaches 0
- On death: Game Over (early checkout)

### Weapon System
- Slingshot with infinite ammo (visible in first-person view)
- Tension-based charging: hold SPACE to charge, release to fire
- Minimum tension: 0.2 (quick tap)
- Maximum tension: 1.0 (fully charged)
- Charge rate: 1.2 per second
- Projectile speed: 60-180 units/second (based on tension)
- Shooting cooldown: 300ms
- Aim-assist locks onto nearby targets
- Projectiles despawn when out of bounds
- Visual: Orange glowing sphere

### Enemy Carts
- Health: 3 hits to destroy
- Move forward at 60% of player speed
- Random horizontal drift every 1.5 seconds
- Visual: Red cart with glowing evil eyes
- Health bar displayed above cart

### Obstacles
| Type | Description |
|------|-------------|
| Stack | Pyramid of colored product boxes |
| Barrel | Blue barrel with metal bands |
| Display | Promotional stand with "SALE!" sign |

All obstacles fall/topple when hit.

## Scoring System

| Action | Points |
|--------|--------|
| Hit enemy cart | +100 |
| Destroy enemy cart | +300 |
| Hit obstacle | +150 |

### Score Ratings (Game Over)

| Score Range | Rating |
|-------------|--------|
| 0-800 | Mild Mischief |
| 801-2000 | Rowdy Kid |
| 2001-4000 | Troublemaker |
| 4001-7000 | Chaos Master |
| 7001-10000 | Total Mayhem! |
| 10001+ | LEGENDARY CHAOS! |

## Environment

### Supermarket Aisle
- Length: 800 units
- Width: 30 units (walls at ±15)
- Ceiling height: 12 units
- Tiled floor with grid pattern
- Shelf units along both walls with colorful products
- Ceiling light fixtures every 20 units
- Fog for depth (starts at 50, ends at 200)

### Checkout Zone
- Located at z = -800 (end of aisle)
- Green counter with "CHECKOUT" sign
- Glowing effect for visibility

## UI Elements

### HUD (During Gameplay)
- **Score** (top-left): "CHAOS SCORE" label with value
- **Progress Bar** (top-center): Distance to checkout
- **Ammo Status** (bottom-right): "SLINGSHOT READY" / "RELOADING..."
- **Tension Indicator** (around crosshair): Ring showing charge level
- **Crosshair** (center): White cross with red dot, turns green on aim-assist lock
- **Health Bar** (bottom-left): Current player health
- **Pause Hint** (top-right): "ESC to Pause"

### Menus
- Main Menu: Title, version, subtitle, instructions, Start button
- Pause Menu: Score display, Resume button, Quit button
- Game Over: Final score, rating, Play Again button

## Visual Effects

- Visible slingshot weapon in first-person view
- Slingshot arm animates with tension charge
- Hit marker (X shape) on successful hits
- Floating score popups at hit location
- Particle explosions on destruction
- Health bar color (green) with background (dark)
- Enemy flash white when hit
- Obstacle falling/toppling animation
- Screen flash red on damage
- Invulnerability flashing effect

## Spawn System

### Initial Spawn
- 5 enemy carts (spread from z=-30 to z=-190)
- 10 obstacles (spread from z=-25 to z=-340)

### Runtime Spawn
- Enemies: 1.5% chance per frame, max 10 active
- Obstacles: 2% chance per frame, max 15 active
- Spawn distance: 150 units ahead of camera

## Object Cleanup

Objects are removed when:
- Projectiles: Out of bounds or hit something
- Enemies: Destroyed or 20 units behind camera
- Obstacles: Fully fallen or 30 units behind camera
- Particles: Life reaches 0

---

## Test Procedure

### Quick Smoke Test (30 seconds)
1. Open index.html in browser
2. Verify no console errors
3. Click Start, verify game begins
4. Shoot a few projectiles, verify they fire
5. Hit an enemy or obstacle, verify score increases
6. Press ESC, verify pause menu appears
7. Click Resume, verify game continues

### Full Playthrough Test (3-5 minutes)
1. Complete Quick Smoke Test
2. Play until reaching checkout
3. Verify game over screen shows
4. Verify score and rating are reasonable
5. Click Play Again
6. Verify fresh game starts
7. Press ESC → Quit to Menu
8. Verify return to main menu
9. Start new game, verify clean state

---

## Development Notes

- All 3D models are procedurally generated using Three.js primitives
- Canvas textures used for signs and floor tiles
- Keyboard-based crosshair aiming (arrow keys)
- Tension-based shooting with visual feedback
- Aim-assist with target proximity detection
- requestAnimationFrame for game loop
- Delta time used for frame-rate independent movement
- Objects stored in arrays, filtered each frame for cleanup
- Puppeteer-based automated testing
