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

### Related Documents
- **BUILD_LIFECYCLE.md** - Build stages, quality gates, release checklist, rollback procedures

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
├── index.html              # Main game file (orchestration, game loop)
├── CLAUDE.md               # Project definition (this file)
├── BUILD_LIFECYCLE.md      # Build and release procedures
├── README.md               # Player documentation
├── package.json            # Dependencies & scripts
├── run-tests.js            # Test runner
│
├── src/
│   ├── engine/             # Core engine systems
│   │   ├── engine.js           # Engine constants
│   │   ├── state-system.js     # State machine (MENU, PLAYING, PAUSED, GAME_OVER)
│   │   ├── loop-system.js      # RAF loop, delta time
│   │   ├── input-system.js     # Keyboard/mouse input handling
│   │   ├── collision-system.js # Collision detection utilities
│   │   ├── scene-system.js     # Three.js scene management
│   │   ├── entity-system.js    # Entity lifecycle + array management
│   │   ├── game-session.js     # Game state (score, timer, lifecycle)
│   │   ├── post-process-system.js # Post-processing (bloom, vignette)
│   │   ├── test-bridge.js      # Test compatibility (injected during tests only)
│   │   └── engine.test.js      # Engine tests
│   │
│   ├── shared/             # Cross-domain utilities
│   │   └── materials-theme.js  # Shared Three.js materials library
│   │
│   ├── ui/                 # User interface
│   │   ├── ui.js               # UI constants (ratings, durations)
│   │   └── ui-system.js        # HUD, menus, popups, health bar
│   │
│   ├── room/               # Room/level domain
│   │   ├── room.js             # Room data, grid constants
│   │   ├── room-theme.js       # Room visual themes
│   │   ├── room-mesh.js        # Room mesh creation
│   │   ├── room-system.js      # Room management
│   │   └── room.test.js        # Room tests
│   │
│   ├── player/             # Player domain
│   │   ├── player.js           # Player constants (movement, health)
│   │   ├── player-theme.js     # Player visual themes
│   │   ├── player-mesh.js      # Player cart mesh creation
│   │   ├── player-system.js    # Player state management
│   │   └── player.test.js      # Player tests
│   │
│   ├── weapon/             # Weapon domain (self-contained weapons)
│   │   ├── weapon.js           # Weapon data (types, aim profiles)
│   │   ├── weapon-manager.js   # Thin orchestrator (registry, delegation)
│   │   ├── slingshot.js        # Self-contained slingshot weapon
│   │   ├── watergun.js         # Self-contained water gun weapon
│   │   ├── nerfgun.js          # Self-contained nerf gun weapon
│   │   ├── pickup.js           # Weapon pickup definitions
│   │   ├── pickup-system.js    # Pickup spawn and collection
│   │   └── weapon.test.js      # Weapon tests
│   │
│   ├── projectile/         # Projectile domain
│   │   ├── projectile.js       # Projectile constants
│   │   ├── projectile-theme.js # Projectile visuals
│   │   ├── projectile-mesh.js  # Projectile mesh creation
│   │   ├── projectile-system.js# Projectile management
│   │   └── projectile.test.js  # Projectile tests
│   │
│   ├── enemy/              # Enemy domain
│   │   ├── enemy.js            # Enemy types, behaviors
│   │   ├── enemy-theme.js      # Enemy visual themes
│   │   ├── enemy-mesh.js       # Enemy cart meshes
│   │   ├── enemy-system.js     # Enemy AI, spawning
│   │   └── enemy.test.js       # Enemy tests
│   │
│   ├── particle/           # Particle effects domain
│   │   └── particle-system.js  # Particle spawning and animation
│   │
│   └── environment/        # Environment domain
│       ├── obstacle.js         # Obstacle types
│       ├── obstacle-theme.js   # Obstacle colors
│       ├── obstacle-mesh.js    # Obstacle meshes
│       ├── shelf.js            # Shelf data
│       ├── shelf-theme.js      # Shelf themes
│       ├── shelf-mesh.js       # Shelf meshes
│       ├── environment-system.js # Environment management
│       ├── spawn-system.js     # Room-based enemy/obstacle spawning
│       └── environment.test.js # Environment tests
│
├── tests/
│   ├── test-framework.js       # Unit test framework class
│   ├── unit-tests.html         # Unit test runner (thin loader)
│   ├── ui-test-framework.js    # UI test framework class
│   ├── ui-tests.html           # UI test runner (thin loader)
│   └── ui/                     # UI test domain files
│       ├── menu.tests.js       # Menu, How to Play tests
│       ├── game-flow.tests.js  # Start, Pause, Game Over tests
│       ├── player.tests.js     # Movement, Health tests
│       ├── weapon.tests.js     # FPS, Charging, Projectile tests
│       ├── enemy.tests.js      # Spawning, Skeleton tests
│       └── environment.tests.js # Visual, Shelf tests
│
└── .test-output/           # Test results (gitignored)
```

### Domain Structure Pattern

Each domain follows this file naming pattern:

| File | Purpose |
|------|---------|
| `<domain>.js` | Pure data definitions, constants, configs (no dependencies) |
| `<domain>-theme.js` | Colors, materials, visual styling |
| `<domain>-mesh.js` | THREE.js mesh/geometry creation |
| `<domain>-system.js` | Orchestrator: state management, logic, coordination |
| `<domain>.test.js` | Domain-specific unit tests |

**Weapon Domain Pattern:** Each weapon is a self-contained module implementing the weapon interface:
- `weapon.js` = Shared aim profiles and config types
- `weapon-manager.js` = Thin orchestrator (registry, equip, delegation)
- `slingshot.js`, `watergun.js`, `nerfgun.js` = Complete weapon modules (config, theme, mesh, animation, state)
- `pickup.js` + `pickup-system.js` = Weapon pickup spawning and collection
- New weapons: Create `<weapon>.js` implementing the weapon interface

### Key Principles

1. **Zero cross-file dependencies** - Each file is self-contained
2. **No imports/exports** - Files use global scope (browser-compatible)
3. **Dependency injection** - THREE.js and MaterialsTheme passed as parameters
4. **Separation of concerns** - Data, theme, mesh, and logic are separate
5. **Testable in isolation** - Each component can be tested independently
6. **Consistent naming** - System files use `-system.js` suffix, theme files use `-theme.js` suffix

### Adding New Features

**To add a new domain:**
1. Create directory `src/<domain>/`
2. Create files following the pattern above
3. Add `<script>` tags to `index.html` (order matters: data → theme → mesh → system)
4. Add tests to `src/<domain>/<domain>.test.js`
5. Register test file in `tests/unit-tests.html`

**To extend an existing domain:**
1. Add constants to `<domain>.js`
2. Add visual styling to `<domain>-theme.js`
3. Add mesh creation to `<domain>-mesh.js`
4. Add logic/state to `<domain>-system.js`
5. Add tests to `<domain>.test.js`

### Script Loading Order

In `index.html`, scripts must be loaded in this order:
1. Three.js (CDN)
2. `src/shared/materials-theme.js` - shared materials
3. `src/ui/ui.js` - UI constants
4. `src/ui/ui-system.js` - UI system
5. `src/engine/*` - core systems (engine.js first, then *-system.js files)
6. Domain files (for each domain: data → theme → mesh → system)

### Using Domain Modules

```javascript
// Access constants from domain data files
const speed = Player.movement.SPEED;
const roomSize = Room.structure.UNIT;

// Create meshes using domain mesh files
const playerCart = PlayerMesh.createPlayerCart(THREE, MaterialsTheme);

// Use WeaponManager for weapon orchestration
WeaponManager.init(scene);
WeaponManager.register(Slingshot);
WeaponManager.register(WaterGun);
WeaponManager.register(NerfGun);
WeaponManager.equip('slingshot', THREE, MaterialsTheme, camera);

// Handle weapon input
WeaponManager.onFireStart(Date.now());
const result = WeaponManager.onFireRelease(Date.now());
WeaponManager.update(dt, Date.now());
WeaponManager.animateFPS(dt);

// Pickup system
PickupSystem.init(scene, THREE);
PickupSystem.trySpawnForRoom(roomPosition, width, length);
const collected = PickupSystem.update(dt, playerPosition, time);
collected.forEach(p => PickupSystem.collect(p, WeaponManager, THREE, materials, camera));

// Use engine systems
StateSystem.init('MENU');
StateSystem.transition('PLAYING');
InputSystem.init();
LoopSystem.init(THREE);
LoopSystem.start();

// Use GameSession for game state
GameSession.init(180, { playerStartX: 45, camera: camera });
GameSession.start();
GameSession.addScore(100, hitPosition);
GameSession.updateTimer(dt);
const timeUp = GameSession.getTimer() <= 0;
GameSession.end(died);

// Use EntitySystem for array management
EntitySystem.init(scene);
EntitySystem.registerArray('enemy', { maxCount: 10 }, EnemySystem.createMesh);
const enemy = EntitySystem.create('enemy', THREE, 'SKELETON', x, z);
EntitySystem.updateAndCleanup('enemy', EnemySystem.updateSingle, options);

// Use UI module for all UI operations
UISystem.init();
UISystem.updateScore(score, true);
UISystem.showGameOver(score, UI.getScoreRating(score), died);

// TestBridge is injected during UI tests only (not in production)
// It reads from window.__gameInternals and auto-initializes
```

---

## Overview

**Title:** Mall Hell
**Version:** 4.1
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
| W / ↑ | Drive forward |
| S / ↓ | Reverse |
| A / ← | Turn left (also used for aiming) |
| D / → | Turn right (also used for aiming) |
| SPACE (hold) | Charge slingshot |
| SPACE (release) | Fire projectile |
| ESC | Pause/Resume game |

**Note:** The crosshair is fixed at screen center (slightly above). Aim by turning left/right - projectile collision handles hits.

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
- **Fixed crosshair aiming**: Crosshair fixed at screen center (slightly above)
  - Player aims by dodging left/right with A/D keys
  - Projectile collision detection handles hits
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
- **Crosshair** (center): Fixed position crosshair, slightly above center
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

### Technical Implementation
- All 3D models are procedurally generated using Three.js primitives
- Canvas textures used for signs and floor tiles
- Fixed crosshair aiming (player aims by dodging left/right)
- Tension-based shooting with visual feedback
- Projectile collision detection for hit registration
- requestAnimationFrame for game loop
- Delta time used for frame-rate independent movement
- Objects stored in arrays, filtered each frame for cleanup
- Puppeteer-based automated testing

### Agent Guidelines

**Before making changes:**
1. Read this file (CLAUDE.md) for requirements
2. Identify which domain(s) will be affected
3. Read the relevant domain files to understand existing patterns
4. Check `.test-output/latest.json` for current test status

**When implementing features:**
1. Follow the domain pattern (data → theme → mesh → system)
2. Add constants to `<domain>.js`, not hardcoded in functions
3. Use `Materials` library for shared materials
4. Use `UI` module for all UI operations
5. Use domain systems (e.g., `WeaponSystem`, `EnemySystem`) for state

**When writing tests:**
1. Add unit tests to `src/<domain>/<domain>.test.js`
2. Add UI tests to `tests/ui-tests.html` if UI is affected
3. Run domain-specific tests first: `bun run-tests.js --domain=<name>`
4. Only run full suite when explicitly requested

**Critical testing patterns:**
- **NEVER reference specific implementations directly in tests** - use managers/systems instead
- Example: To reset weapon cooldown, use `WeaponManager.currentWeapon.state.lastFireTime = 0`, NOT `Slingshot.state.lastFireTime = 0`
- This ensures tests remain weapon-agnostic and work with any equipped weapon
- Same principle applies to other domains: use `EntitySystem`, `StateSystem`, etc. rather than specific instances

**Code style:**
- No ES6 imports/exports (use global scope)
- Pass THREE.js as parameter, don't assume global
- Use descriptive function names (e.g., `createPlayerCart`, not `makeCart`)
- Keep mesh creation in `-mesh.js` files
- Keep state management in `-system.js` files

### File Ownership

| File/Directory | Owner | Purpose |
|----------------|-------|---------|
| `index.html` | Game orchestration | Main game loop, collision handling, spawning |
| `src/engine/` | Core systems | State machine, input, game loop |
| `src/shared/` | Shared utilities | Materials, common helpers |
| `src/ui/` | User interface | All HUD and menu operations |
| `src/<domain>/` | Domain logic | Self-contained domain implementation |
| `tests/` | Test runners | Unit and UI test execution |
