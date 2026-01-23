# Mall Hell - Project Definition

## Development Contract

**This contract is binding for all development work on this project.**

### Pre-Implementation (Required)
- [ ] Feature requirements documented in this file
- [ ] Acceptance criteria defined with checkboxes
- [ ] Unit tests written in `tests/unit-tests.html`
- [ ] UI tests written in `tests/ui-tests.html` (if UI affected)

### Implementation (Required)
- [ ] Code the feature
- [ ] Run unit tests → **ALL MUST PASS**
- [ ] Run UI tests → **ALL MUST PASS**
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
[ ] UI tests: PASS
[ ] Smoke test: PASS
[ ] AC verified: YES
```

---

## Overview

**Title:** Mall Hell
**Version:** 1.2
**Platform:** Desktop Browser
**Tech Stack:** HTML5, CSS3, JavaScript, Three.js (r128)
**Delivery:** Single `index.html` file, runs locally without build tools

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
| Mouse Move | Aim slingshot |
| Left Click | Fire projectile |
| ESC | Pause/Resume game |
| Arrow Left / A | Move cart left |
| Arrow Right / D | Move cart right |
| Arrow Up / W | Speed boost (temporary) |
| Arrow Down / S | Slow down (temporary) |

## Core Mechanics

### Player Cart
- First-person POV from inside shopping cart
- Automatic forward movement with player steering
- Camera height: 3 units
- Base movement speed: 25 units/second
- Lateral movement speed: 8 units/second
- Speed boost: 1.5x (while holding Up/W)
- Slow down: 0.5x (while holding Down/S)
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
- Slingshot with infinite ammo
- Projectile speed: 120 units/second
- Shooting cooldown: 500ms
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
- **Cooldown Indicator** (bottom-center): Circular progress ring
- **Crosshair** (center): White cross with red dot
- **Pause Hint** (top-right): "ESC to Pause"

### Menus
- Main Menu: Title, version, subtitle, instructions, Start button
- Pause Menu: Score display, Resume button, Quit button
- Game Over: Final score, rating, Play Again button

## Visual Effects

- Hit marker (X shape) on successful hits
- Floating score popups at hit location
- Particle explosions on destruction
- Health bar color (green) with background (dark)
- Enemy flash white when hit
- Obstacle falling/toppling animation

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

## File Structure

```
mall-hell/
├── index.html      # Complete game (single file)
└── CLAUDE.md       # This document
```

## Future Considerations (v2+)

- Player steering/dodge mechanics
- Multiple weapon types
- Power-ups
- Multiple aisles/levels
- Sound effects and music
- Mobile touch controls
- Leaderboard (local storage)
- Different enemy types
- Boss encounters

## Acceptance Criteria

### AC1: Build & Load
- [ ] Single `index.html` file with all code inlined
- [ ] No external dependencies except Three.js CDN
- [ ] File opens in Chrome, Firefox, Safari without errors
- [ ] No console errors on load
- [ ] No console warnings related to game code
- [ ] Three.js initializes and renders first frame within 2 seconds

### AC2: Game State Management
- [ ] Game starts in MENU state
- [ ] Start button transitions to PLAYING state
- [ ] ESC key transitions PLAYING → PAUSED
- [ ] ESC key transitions PAUSED → PLAYING
- [ ] Resume button transitions PAUSED → PLAYING
- [ ] Quit button transitions PAUSED → MENU
- [ ] Reaching checkout transitions PLAYING → GAME_OVER
- [ ] Play Again button transitions GAME_OVER → PLAYING
- [ ] No stuck states or invalid transitions possible

### AC3: Player Controls
- [ ] Mouse movement aims camera (limited range)
- [ ] Left click fires projectile
- [ ] Shooting respects 500ms cooldown
- [ ] Cannot shoot during MENU, PAUSED, or GAME_OVER states
- [ ] Pointer lock activates on game canvas click
- [ ] ESC exits pointer lock AND pauses game

### AC4: Player Movement
- [ ] Cart moves forward automatically at constant speed
- [ ] Camera position updates smoothly each frame
- [ ] Progress bar reflects actual distance traveled
- [ ] Player reaches checkout at correct distance (800 units)

### AC5: Projectiles
- [ ] Projectile spawns at camera position on shoot
- [ ] Projectile travels in aim direction
- [ ] Projectile has visible glow effect
- [ ] Projectile despawns when out of bounds
- [ ] Projectile despawns on collision
- [ ] No projectile accumulation/memory leak

### AC6: Enemy Behavior
- [ ] Enemies spawn ahead of player
- [ ] Enemies move toward player (slower than player)
- [ ] Enemies drift horizontally randomly
- [ ] Enemies stay within aisle bounds
- [ ] Enemy health bar displays correctly
- [ ] Enemy health bar updates on hit
- [ ] Enemy flashes white when hit
- [ ] Enemy destroyed after 3 hits
- [ ] Destroyed enemies show particle explosion
- [ ] Enemies despawn when behind camera

### AC7: Obstacle Behavior
- [ ] Obstacles spawn ahead of player
- [ ] Three obstacle types render correctly (stack, barrel, display)
- [ ] Obstacles fall/topple when hit
- [ ] Fallen obstacles despawn properly
- [ ] Obstacles show particle effect on hit

### AC8: Collision Detection
- [ ] Projectile-enemy collision detected accurately
- [ ] Projectile-obstacle collision detected accurately
- [ ] No collision tunneling at normal speeds
- [ ] Hit marker displays on successful hit
- [ ] Only one collision registered per projectile

### AC9: Scoring System
- [ ] Score starts at 0
- [ ] +100 points on enemy hit
- [ ] +300 points on enemy destroy
- [ ] +150 points on obstacle hit
- [ ] Score popup appears at hit location
- [ ] Score popup floats up and fades
- [ ] HUD score updates immediately
- [ ] Final score displays on game over
- [ ] Correct rating displayed based on score

### AC10: UI/HUD
- [ ] Main menu displays title, version, instructions, start button
- [ ] HUD shows score, progress bar, ammo status, pause hint
- [ ] Crosshair visible and centered during gameplay
- [ ] Cooldown indicator animates correctly
- [ ] Pause menu shows current score, resume, quit buttons
- [ ] Game over shows final score, rating, play again button
- [ ] All buttons respond to hover state
- [ ] All buttons trigger correct actions on click

### AC11: Environment
- [ ] Floor renders with tile pattern
- [ ] Ceiling renders with light fixtures
- [ ] Walls render on both sides
- [ ] Shelf units line both walls with products
- [ ] Checkout zone visible at end of aisle
- [ ] Fog effect creates depth perception

### AC12: Performance
- [ ] Maintains ~60 FPS during normal gameplay
- [ ] No frame drops below 30 FPS
- [ ] No memory leaks (stable RAM usage over 5 minutes)
- [ ] Object arrays don't grow unbounded
- [ ] Particle count stays reasonable (<100)

### AC13: Restart/Reset
- [ ] Restart resets score to 0
- [ ] Restart resets distance to 0
- [ ] Restart clears all projectiles
- [ ] Restart clears all enemies
- [ ] Restart clears all obstacles
- [ ] Restart clears all particles
- [ ] Restart resets camera position
- [ ] No duplicate objects after restart
- [ ] Game plays identically after restart

### AC14: Edge Cases
- [ ] Rapid clicking doesn't break shooting cooldown
- [ ] Pause during projectile flight works correctly
- [ ] Resume after pause continues smoothly (no time jump)
- [ ] Window resize updates camera aspect ratio
- [ ] Game handles alt-tab/focus loss gracefully

### AC15: Player Movement Controls
- [ ] Left arrow / A key moves cart left
- [ ] Right arrow / D key moves cart right
- [ ] Up arrow / W key increases speed (boost)
- [ ] Down arrow / S key decreases speed (slow)
- [ ] Cart stays within aisle bounds (±10 units)
- [ ] Movement is smooth (no jitter)
- [ ] Controls work during PLAYING state only
- [ ] Controls disabled during PAUSED state
- [ ] Multiple keys can be held simultaneously
- [ ] Movement stops when key released

### AC16: Player Health System
- [ ] Health bar displays in HUD (bottom-left)
- [ ] Health starts at 100
- [ ] Health bar visually reflects current health
- [ ] Collision with enemy cart deals 20 damage
- [ ] Collision with obstacle deals 10 damage
- [ ] Screen flashes red on damage
- [ ] 1 second invulnerability after taking damage
- [ ] Invulnerability has visual indicator (flashing)
- [ ] Health reaching 0 triggers Game Over
- [ ] Game Over shows "WRECKED!" instead of "CHECKOUT!"
- [ ] Health does not go below 0
- [ ] Health does not regenerate

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

### Stress Test (5 minutes)
1. Play game while rapidly clicking (test cooldown)
2. Let many enemies/obstacles spawn
3. Pause and resume multiple times
4. Check browser memory usage (should be stable)
5. Verify no console errors accumulated

---

## Development Notes

- All 3D models are procedurally generated using Three.js primitives
- Canvas textures used for signs and floor tiles
- Pointer lock API for smooth FPS-style aiming
- requestAnimationFrame for game loop
- Delta time used for frame-rate independent movement
- Objects stored in arrays, filtered each frame for cleanup
