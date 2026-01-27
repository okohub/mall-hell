# Speed Boost Power-Up Design

**Version**: 5.5+
**Date**: 2026-01-27
**Type**: New Feature - Power-Up System

---

## Overview

Add a speed boost power-up that temporarily doubles player movement speed for 10 seconds. The power-up spawns as an energy drink can pickup in rooms, fitting the mall theme while adding tactical depth to room-clearing gameplay.

---

## Core Mechanics

### Effect
- **Speed Multiplier**: 2x (25 → 50 units/sec)
- **Duration**: 10 seconds
- **Applies to**: Forward, backward, and strafe movement
- **Does NOT affect**: Turn rate (maintains control)

### Spawn Configuration
- **Spawn Chance**: 25% per room
- **Spawn Weight**: 2 (similar rarity to Laser Gun)
- **Max per Room**: 1 (competes with existing weapon/ammo pickups)
- **Placement**: Uses existing PickupOrchestrator collision avoidance

### Stacking Behavior
- Picking up while boosted **refreshes** timer to 10 seconds
- No duration stacking (prevents 30+ second boosts)
- Maintains consistent gameplay tempo

### Visual Identity
- **Mesh**: Cylindrical energy drink can
- **Colors**: Bright red/yellow gradient
- **Glow**: Yellow-orange (0xffaa00)
- **Scale**: 2.0 (similar to weapon pickups)
- **Animation**: Standard float and rotation

---

## Player Feedback

### HUD Timer Display
- **Position**: Top-right corner (near status panel)
- **Format**: "BOOST: 8s" with icon
- **Icon**: Energy drink can sprite
- **Color States**:
  - White/bright: 10-4 seconds
  - Orange: 3 seconds remaining (warning)
  - Red flash: 1 second remaining (imminent expiration)
- **Transitions**: Fades in/out smoothly (0.3s)

### Screen Effects (Primary Feedback)
- **FOV Increase**: +10 degrees (simulates speed perception)
- **Chromatic Aberration**: Subtle edge distortion (motion effect)
- **Vignette Reduction**: Wider peripheral vision (better awareness at speed)
- **Transitions**: All effects lerp in/out over 0.3s

### Audio
- **None** - Keeps implementation simple, relies on visual feedback

### Cart Visual Effects
- **None** - First-person view means player won't see their own cart

---

## Technical Architecture

### New Domain Files

Following the standard domain pattern:

```
src/powerup/
├── powerup.js              # Pure data definitions
├── powerup-orchestrator.js # State management, active effects
└── powerup.test.js         # Unit tests
```

Optional mesh module (if needed):
```
src/powerup/
└── energydrink-mesh.js     # Stateless mesh creation
```

### PowerUp Data Structure

```javascript
// powerup.js
const PowerUp = {
    types: {
        SPEED_BOOST: {
            id: 'speed_boost',
            name: 'Speed Boost',
            isPowerup: true,
            spawnChance: 0.25,
            spawnWeight: 2,
            duration: 10000,        // milliseconds
            speedMultiplier: 2.0,
            visual: {
                color: 0xff3333,     // Red
                glowColor: 0xffaa00, // Yellow-orange
                scale: 2.0
            }
        }
    },

    // Helper methods
    get(typeId) { ... },
    getAll() { ... },
    selectRandom() { ... }
};
```

### PowerUpOrchestrator Responsibilities

```javascript
// powerup-orchestrator.js
const PowerUpOrchestrator = {
    activeEffects: [],  // Currently active power-ups

    // Lifecycle
    init() { ... },
    reset() { ... },

    // Activation
    activate(powerupType, timestamp) { ... },
    deactivate(powerupId) { ... },

    // Queries
    isActive(powerupType) { ... },
    getTimeRemaining(powerupType) { ... },
    getSpeedMultiplier() { ... },  // Returns current multiplier

    // Update
    update(dt, currentTime) { ... }  // Handle expiration
};
```

---

## Integration Points

### 1. PickupOrchestrator (Spawning & Collection)

**Modify spawn selection**:
- Add power-ups to weighted pickup pool
- Power-ups compete with weapons/ammo for room slots
- Use existing collision avoidance logic

**Modify collection**:
- Detect power-up type on collection
- Call `PowerUpOrchestrator.activate()` instead of weapon equip
- Return collection result to game loop for UI updates

**Modify mesh creation**:
- Add power-up mesh creation branch in `_createMesh()`
- Call `EnergyDrinkMesh.create()` or inline mesh creation
- Apply standard glow effect

### 2. PlayerOrchestrator (Movement Speed)

**Add speed multiplier query**:
```javascript
// In movement calculations
const baseSpeed = 25;
const multiplier = PowerUpOrchestrator.getSpeedMultiplier();
const currentSpeed = baseSpeed * multiplier;

// Apply to forward/backward/strafe
velocity.x = direction.x * currentSpeed * dt;
velocity.z = direction.z * currentSpeed * dt;
```

**No changes to**:
- Turn rate (maintains control at high speed)
- Acceleration curves (immediate speed change)

### 3. UIOrchestrator (HUD Timer)

**Add power-up timer display**:
```javascript
updatePowerUpTimer(timeRemaining, powerupType) {
    // Show/hide timer element
    // Update countdown text
    // Apply color transitions (white → orange → red)
    // Flash animation at 1s
}
```

**Position**: Top-right, below or beside status panel

### 4. Camera/Main Loop (FOV Effects)

**Store base FOV**:
```javascript
const BASE_FOV = 75;  // Or current value
```

**Apply FOV boost**:
```javascript
// In update loop
if (PowerUpOrchestrator.isActive('speed_boost')) {
    camera.fov = BASE_FOV + 10;
} else {
    // Lerp back to base FOV over 0.3s
    camera.fov = lerp(camera.fov, BASE_FOV, dt / 0.3);
}
camera.updateProjectionMatrix();
```

**Post-processing** (optional, can defer):
- Add EffectComposer pass for chromatic aberration
- Subtle effect on screen edges only
- Can skip initially and add later if needed

---

## Edge Cases

### Boost Expires Mid-Movement
- Lerp speed multiplier back to 1.0 over 0.2s
- Smooth deceleration, no jarring stops
- Player maintains directional velocity

### Refresh While Active
- Reset timer to 10 seconds
- No visual interruption (FOV stays wide)
- Brief flash on HUD timer to indicate refresh
- Prevents stacking to 20+ seconds

### State Transitions

**Pause Game**:
- Timer pauses (no countdown)
- Effects remain visible
- Resume continues countdown

**Game Over**:
- Clear all active boosts immediately
- Reset FOV and screen effects
- Clean state for next game

**Room Transition**:
- Boost continues (rewards mobility)
- Timer keeps counting down
- No interruption to effect

### Player Death While Boosted
- Clear active boost immediately
- Reset FOV to base value
- Remove HUD timer
- No lingering effects on respawn

---

## Testing Strategy

### Unit Tests (`powerup.test.js`)

Following TESTING.md patterns:

```javascript
// Data structure validation
test('PowerUp.types.SPEED_BOOST has required fields')
test('Duration is 10000ms (10 seconds)')
test('Speed multiplier is 2.0')

// Helper methods
test('PowerUp.get() returns correct config')
test('PowerUp.selectRandom() respects weights')

// Orchestrator logic
test('activate() starts new effect with correct duration')
test('activate() while active refreshes timer')
test('getSpeedMultiplier() returns 2.0 when active')
test('getSpeedMultiplier() returns 1.0 when inactive')
test('update() expires boost after duration')
```

### Integration Tests

```javascript
// Spawning
test('Speed boost spawns in rooms with 25% chance')
test('Speed boost competes with weapon pickups (max 1 per room)')

// Collection & Activation
test('Collecting speed boost activates effect')
test('Player speed increases to 50 units/sec when boosted')
test('Collecting second boost refreshes timer')

// Timer & Expiration
test('Boost expires after 10 seconds')
test('Speed returns to 25 units/sec after expiration')
test('HUD timer counts down accurately')

// FOV Changes
test('FOV increases by 10 when boost active')
test('FOV returns to base when boost expires')

// State Management
test('Pause stops timer countdown')
test('Game over clears active boosts')
test('Player death clears active boosts')
```

### Manual Smoke Test (30 seconds)

```
[ ] Start game, find speed boost pickup
[ ] Collect can → HUD timer appears
[ ] Movement feels noticeably faster (2x)
[ ] FOV wider, screen feels faster
[ ] Timer counts down from 10s
[ ] Timer turns orange at 3s
[ ] Timer flashes red at 1s
[ ] Boost expires smoothly at 0s
[ ] Speed returns to normal
[ ] Find second boost while already boosted
[ ] Timer refreshes to 10s (doesn't stack)
[ ] Pause → timer stops counting
[ ] No console errors
```

---

## Implementation Workflow

Following WORKFLOWS.md - "Add New Feature":

### Step 1: Create Power-Up Domain
1. Create `src/powerup/powerup.js` (data definitions)
2. Create `src/powerup/powerup-orchestrator.js` (state management)
3. Add to `index.html` script loading order (after shared, before engine)

### Step 2: Create Energy Drink Mesh
1. Create `src/powerup/energydrink-mesh.js` (optional, or inline in orchestrator)
2. Use `THREE.CylinderGeometry` for can shape
3. Apply red/yellow gradient materials
4. Return mesh for PickupOrchestrator

### Step 3: Integrate with Pickup System
1. Modify `PickupOrchestrator._createMesh()` to handle power-ups
2. Add power-ups to weighted selection in `WeaponPickup` or create separate pool
3. Modify collection logic to detect and activate power-ups

### Step 4: Player Movement Integration
1. Modify `PlayerOrchestrator` movement calculations
2. Add `getCurrentSpeedMultiplier()` query to PowerUpOrchestrator
3. Apply multiplier to forward/backward/strafe speeds
4. Add lerp for smooth expiration transition

### Step 5: Visual Feedback
1. Add FOV manipulation in main game loop (or CameraOrchestrator)
2. Store base FOV, apply +10 when boost active
3. Extend `UIOrchestrator` with power-up timer display
4. Implement color transitions (white → orange → red)
5. (Optional) Add chromatic aberration post-processing pass

### Step 6: Testing
1. Write unit tests for PowerUp config and orchestrator
2. Write integration tests for spawn → collect → boost → expire
3. Manual smoke test for feel, timing, and edge cases
4. Iterate on speed/duration if balance feels off

---

## Files Affected

### New Files (3)
- `src/powerup/powerup.js`
- `src/powerup/powerup-orchestrator.js`
- `src/powerup/powerup.test.js`

### Modified Files (4-5)
- `src/weapon/pickup-orchestrator.js` (spawn & collection)
- `src/player/player-orchestrator.js` (movement speed)
- `src/ui/ui-orchestrator.js` (HUD timer)
- `index.html` (script loading order)
- Main game loop or camera orchestrator (FOV effects)

### Optional Files (1-2)
- `src/powerup/energydrink-mesh.js` (if extracted)
- Post-processing shader (if adding chromatic aberration)

---

## Future Considerations

### Additional Power-Ups
This design creates a reusable power-up system. Future power-ups could include:
- Damage multiplier (2x or 3x damage for 8 seconds)
- Shield (temporary invulnerability extension)
- Slow-motion (bullet-time effect for precision aiming)
- Infinite ammo (no reload for 15 seconds)

All would use the same domain structure and integration points.

### Balance Tuning
Monitor after implementation:
- Is 2x speed too fast/slow? (adjust multiplier)
- Is 10s too long/short? (adjust duration)
- Is 25% spawn rate too common/rare? (adjust spawn chance)
- Does FOV change feel disorienting? (reduce to +5 degrees)

### Visual Polish
Potential enhancements:
- Particle trail effect when moving at boost speed
- Screen shake on collection (brief impact moment)
- More elaborate can design (label graphics, reflections)
- Pickup "anticipation" (glow pulses faster when player nearby)

---

## Design Rationale

### Why Speed Boost First?
- **Simplest implementation**: Single multiplier, no complex interactions
- **Clear player value**: Speed is universally understood and desired
- **Fits gameplay**: Rewards aggressive room-clearing playstyle
- **Mall theme**: Energy drink fits retail environment perfectly

### Why 2x Speed?
- **Noticeable impact**: 1.5x feels too subtle, 3x too chaotic
- **Maintains control**: Doubling speed is manageable in mall corridors
- **Risk/reward**: Faster movement means faster repositioning but less precision

### Why 10 Seconds?
- **Room-clearing window**: Enough time to clear most rooms aggressively
- **Not overpowered**: Short enough to feel tactical, not dominant
- **Session length**: In 3-minute sessions, 10s is meaningful but not game-warping

### Why Refresh (Not Stack)?
- **Predictable duration**: Player always knows they have 10s, not "10s + X"
- **Prevents runaway**: Stacking could create 30+ second boost chains
- **Rewards finding multiple**: Still valuable to grab second boost mid-effect

### Why Screen Effects?
- **Visceral feedback**: FOV change instantly communicates speed
- **No distraction**: Subtle effects don't obscure enemies or aiming
- **First-person focus**: Can't see cart in FPS, so screen is the canvas

---

## Success Criteria

Power-up is successful if:
- [ ] Collecting boost immediately feels faster (2x speed confirmed)
- [ ] Players use boost tactically (room clearing, repositioning)
- [ ] 10-second duration feels balanced (not too short/long)
- [ ] Visual feedback is clear without being distracting
- [ ] No performance issues (FOV changes, HUD updates)
- [ ] No bugs in edge cases (pause, death, refresh)
- [ ] Fits naturally into existing gameplay loop
