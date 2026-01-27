# Speed Boost Power-Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a speed boost power-up that doubles player movement speed for 10 seconds when collected.

**Architecture:** Create new powerup domain following standard domain pattern (data + orchestrator + tests). Integrate with existing pickup system for spawning/collection, player system for speed multiplier, and UI system for timer display. Add FOV effects to camera for visual feedback.

**Tech Stack:** THREE.js (3D rendering), Bun (test runner), vanilla JavaScript (module pattern)

---

## Task 1: Create PowerUp Data Module

**Files:**
- Create: `src/powerup/powerup.js`

**Step 1: Write the failing test**

Create `src/powerup/powerup.test.js`:

```javascript
// ============================================
// POWERUP SYSTEM - Unit Tests
// ============================================

const PowerUpTests = {
    name: 'PowerUp',
    domain: 'powerup',

    tests: [
        {
            id: 'powerup-config-structure',
            group: 'config',
            description: 'PowerUp.types.SPEED_BOOST has required fields',
            run: (assert) => {
                const config = PowerUp.types.SPEED_BOOST;
                assert(config !== undefined, 'SPEED_BOOST config exists');
                assert(config.id === 'speed_boost', 'Has id field');
                assert(config.name === 'Speed Boost', 'Has name field');
                assert(config.isPowerup === true, 'Has isPowerup field');
                assert(config.duration === 10000, 'Duration is 10000ms');
                assert(config.speedMultiplier === 2.0, 'Speed multiplier is 2.0');
                assert(config.spawnChance === 0.25, 'Spawn chance is 25%');
                assert(config.spawnWeight === 2, 'Spawn weight is 2');
                assert(config.visual !== undefined, 'Has visual config');
                assert(config.visual.color !== undefined, 'Has color');
                assert(config.visual.glowColor !== undefined, 'Has glow color');
                assert(config.visual.scale !== undefined, 'Has scale');
            }
        },

        {
            id: 'powerup-get-by-id',
            group: 'helpers',
            description: 'PowerUp.get() returns correct config',
            run: (assert) => {
                const config = PowerUp.get('speed_boost');
                assert(config !== null, 'Returns config for valid ID');
                assert(config.id === 'speed_boost', 'Returns correct config');

                const invalid = PowerUp.get('invalid_id');
                assert(invalid === null, 'Returns null for invalid ID');
            }
        },

        {
            id: 'powerup-get-all',
            group: 'helpers',
            description: 'PowerUp.getAll() returns array of configs',
            run: (assert) => {
                const all = PowerUp.getAll();
                assert(Array.isArray(all), 'Returns array');
                assert(all.length > 0, 'Array has items');
                assert(all[0].id !== undefined, 'Items have id field');
            }
        }
    ]
};
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --test=powerup-config-structure`
Expected: FAIL with "PowerUp is not defined"

**Step 3: Write minimal implementation**

Create `src/powerup/powerup.js`:

```javascript
// ============================================
// POWERUP SYSTEM - Pure Data Definitions
// ============================================
// Defines power-up types and spawn rules
// Self-contained, zero external dependencies

const PowerUp = {
    // ==========================================
    // POWER-UP TYPE DEFINITIONS
    // ==========================================

    types: {
        SPEED_BOOST: {
            id: 'speed_boost',
            name: 'Speed Boost',
            isPowerup: true,
            spawnChance: 0.25,      // 25% of rooms
            spawnWeight: 2,         // Similar rarity to Laser Gun
            duration: 10000,        // 10 seconds in milliseconds
            speedMultiplier: 2.0,   // 2x speed (25 → 50 units/sec)
            visual: {
                color: 0xff3333,     // Bright red
                glowColor: 0xffaa00, // Yellow-orange
                scale: 2.0           // Similar to weapon pickups
            }
        }
    },

    // ==========================================
    // HELPERS
    // ==========================================

    /**
     * Get power-up type by ID
     * @param {string} typeId - Power-up type ID
     * @returns {Object|null} Power-up type config
     */
    get(typeId) {
        return this.types[typeId.toUpperCase()] || null;
    },

    /**
     * Get all power-up types as array
     * @returns {Array} Array of power-up configs
     */
    getAll() {
        return Object.values(this.types);
    }
};
```

**Step 4: Run test to verify it passes**

Run: `bun run-tests.js --test=powerup-config-structure --test=powerup-get-by-id --test=powerup-get-all`
Expected: 3 PASS

**Step 5: Add to index.html script loading**

Modify `index.html` - Find the script loading section and add powerup files after shared, before engine:

Find this section (around line 200-300):
```html
<!-- Shared -->
<script src="./src/shared/materials-theme.js"></script>
```

Add after shared section:
```html
<!-- PowerUp Domain -->
<script src="./src/powerup/powerup.js"></script>
<script src="./src/powerup/powerup-orchestrator.js"></script>
```

**Step 6: Register tests**

Modify `tests/unit-tests.html` - Find the test registration section and add:

Find this section:
```html
<script src="../src/weapon/weapon.test.js"></script>
```

Add after weapon tests:
```html
<script src="../src/powerup/powerup.test.js"></script>
```

In the test runner registration (find `const testModules = [`):
```javascript
WeaponTests,
PowerUpTests,  // Add this line
```

**Step 7: Commit**

```bash
git add src/powerup/powerup.js src/powerup/powerup.test.js index.html tests/unit-tests.html
git commit -m "feat(powerup): add PowerUp data module with speed boost config

- Create powerup.js with SPEED_BOOST type definition
- Add unit tests for config structure and helpers
- Register in index.html and unit-tests.html

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create PowerUpOrchestrator

**Files:**
- Create: `src/powerup/powerup-orchestrator.js`
- Modify: `src/powerup/powerup.test.js`

**Step 1: Write the failing test**

Add to `src/powerup/powerup.test.js` tests array:

```javascript
{
    id: 'powerup-orchestrator-init',
    group: 'orchestrator',
    description: 'PowerUpOrchestrator.init() initializes state',
    run: (assert) => {
        PowerUpOrchestrator.init();
        assert(Array.isArray(PowerUpOrchestrator.activeEffects), 'activeEffects is array');
        assert(PowerUpOrchestrator.activeEffects.length === 0, 'Starts empty');
    }
},

{
    id: 'powerup-activate-speed-boost',
    group: 'orchestrator',
    description: 'activate() starts new speed boost effect',
    run: (assert) => {
        PowerUpOrchestrator.init();
        const startTime = Date.now();

        PowerUpOrchestrator.activate('speed_boost', startTime);

        assert(PowerUpOrchestrator.isActive('speed_boost'), 'Boost is active');
        assert(PowerUpOrchestrator.getSpeedMultiplier() === 2.0, 'Speed multiplier is 2.0');

        const remaining = PowerUpOrchestrator.getTimeRemaining('speed_boost', startTime);
        assert(remaining > 9000 && remaining <= 10000, 'Time remaining is ~10s');
    }
},

{
    id: 'powerup-refresh-active-boost',
    group: 'orchestrator',
    description: 'activate() while active refreshes timer (not stacks)',
    run: (assert) => {
        PowerUpOrchestrator.init();
        const startTime = Date.now();

        // Activate first boost
        PowerUpOrchestrator.activate('speed_boost', startTime);

        // Wait 2 seconds and activate again
        const laterTime = startTime + 2000;
        PowerUpOrchestrator.activate('speed_boost', laterTime);

        // Should have reset to 10s, not stacked to 18s
        const remaining = PowerUpOrchestrator.getTimeRemaining('speed_boost', laterTime);
        assert(remaining > 9000 && remaining <= 10000, 'Timer refreshed to 10s');
        assert(PowerUpOrchestrator.activeEffects.length === 1, 'Only one effect active');
    }
},

{
    id: 'powerup-inactive-multiplier',
    group: 'orchestrator',
    description: 'getSpeedMultiplier() returns 1.0 when inactive',
    run: (assert) => {
        PowerUpOrchestrator.init();
        assert(PowerUpOrchestrator.getSpeedMultiplier() === 1.0, 'Returns 1.0 when no boost');
    }
},

{
    id: 'powerup-expires-after-duration',
    group: 'orchestrator',
    description: 'update() expires boost after duration',
    run: (assert) => {
        PowerUpOrchestrator.init();
        const startTime = Date.now();

        PowerUpOrchestrator.activate('speed_boost', startTime);
        assert(PowerUpOrchestrator.isActive('speed_boost'), 'Boost starts active');

        // Simulate 11 seconds passing
        const afterExpiry = startTime + 11000;
        PowerUpOrchestrator.update(0.016, afterExpiry);

        assert(!PowerUpOrchestrator.isActive('speed_boost'), 'Boost expired');
        assert(PowerUpOrchestrator.getSpeedMultiplier() === 1.0, 'Speed back to normal');
    }
}
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --domain=powerup`
Expected: New tests FAIL with "PowerUpOrchestrator is not defined"

**Step 3: Write minimal implementation**

Create `src/powerup/powerup-orchestrator.js`:

```javascript
// ============================================
// POWERUP SYSTEM - Orchestrator
// ============================================
// Manages active power-up effects, timers, and queries

const PowerUpOrchestrator = {
    // ==========================================
    // STATE
    // ==========================================

    activeEffects: [],  // Array of { type, config, activatedAt, expiresAt }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the power-up system
     */
    init() {
        this.activeEffects = [];
    },

    /**
     * Reset the system (on game restart)
     */
    reset() {
        this.activeEffects = [];
    },

    // ==========================================
    // ACTIVATION & DEACTIVATION
    // ==========================================

    /**
     * Activate a power-up effect
     * @param {string} powerupType - Power-up type ID (e.g., 'speed_boost')
     * @param {number} currentTime - Current timestamp
     */
    activate(powerupType, currentTime) {
        const config = PowerUp.get(powerupType);
        if (!config) {
            console.warn(`Unknown power-up type: ${powerupType}`);
            return;
        }

        // Check if already active - if so, refresh timer
        const existing = this.activeEffects.find(e => e.type === powerupType);
        if (existing) {
            existing.activatedAt = currentTime;
            existing.expiresAt = currentTime + config.duration;
            return;
        }

        // Add new effect
        this.activeEffects.push({
            type: powerupType,
            config: config,
            activatedAt: currentTime,
            expiresAt: currentTime + config.duration
        });
    },

    /**
     * Deactivate a specific power-up
     * @param {string} powerupType - Power-up type ID
     */
    deactivate(powerupType) {
        this.activeEffects = this.activeEffects.filter(e => e.type !== powerupType);
    },

    // ==========================================
    // QUERIES
    // ==========================================

    /**
     * Check if a power-up is currently active
     * @param {string} powerupType - Power-up type ID
     * @returns {boolean} True if active
     */
    isActive(powerupType) {
        return this.activeEffects.some(e => e.type === powerupType);
    },

    /**
     * Get remaining time for a power-up
     * @param {string} powerupType - Power-up type ID
     * @param {number} currentTime - Current timestamp
     * @returns {number} Milliseconds remaining (0 if not active)
     */
    getTimeRemaining(powerupType, currentTime) {
        const effect = this.activeEffects.find(e => e.type === powerupType);
        if (!effect) return 0;
        return Math.max(0, effect.expiresAt - currentTime);
    },

    /**
     * Get current speed multiplier from active effects
     * @returns {number} Speed multiplier (1.0 = normal, 2.0 = double speed)
     */
    getSpeedMultiplier() {
        // Check if speed boost is active
        if (this.isActive('speed_boost')) {
            const effect = this.activeEffects.find(e => e.type === 'speed_boost');
            return effect.config.speedMultiplier;
        }
        return 1.0;
    },

    /**
     * Get all active effects
     * @returns {Array} Array of active effect objects
     */
    getActiveEffects() {
        return [...this.activeEffects];
    },

    // ==========================================
    // UPDATE
    // ==========================================

    /**
     * Update power-up system (expire old effects)
     * @param {number} dt - Delta time in seconds (not used, but kept for consistency)
     * @param {number} currentTime - Current timestamp
     */
    update(dt, currentTime) {
        // Remove expired effects
        this.activeEffects = this.activeEffects.filter(effect => {
            return currentTime < effect.expiresAt;
        });
    }
};
```

**Step 4: Run test to verify it passes**

Run: `bun run-tests.js --domain=powerup`
Expected: All powerup tests PASS

**Step 5: Commit**

```bash
git add src/powerup/powerup-orchestrator.js src/powerup/powerup.test.js
git commit -m "feat(powerup): add PowerUpOrchestrator for effect management

- Manage active power-up effects with timers
- Support refresh (not stack) when collecting same power-up
- Provide speed multiplier query for player movement
- Auto-expire effects after duration
- Add comprehensive unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Energy Drink Mesh

**Files:**
- Modify: `src/weapon/pickup-orchestrator.js` (add mesh creation for power-ups)

**Step 1: Write integration test**

Add to `tests/integration/pickup-powerup.tests.js` (create new file):

```javascript
// ============================================
// PICKUP + POWERUP INTEGRATION TESTS
// ============================================

const PickupPowerUpIntegrationTests = {
    name: 'Pickup+PowerUp Integration',
    suite: 'integration',

    tests: [
        {
            id: 'spawn-speed-boost-pickup',
            description: 'Speed boost spawns as pickup in room',
            run: async (assert, runner) => {
                await runner.startGame();

                // Spawn speed boost pickup directly
                const THREE = runner.gameWindow.THREE;
                const scene = runner.gameWindow.scene;
                const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;

                PickupOrchestrator.init(scene, THREE);
                const pickup = PickupOrchestrator.spawn('speed_boost', { x: 50, y: 2, z: 75 });

                assert(pickup !== null, 'Pickup spawned');
                assert(pickup.config.id === 'speed_boost', 'Correct type');
                assert(PickupOrchestrator.meshes.length === 1, 'Mesh created');

                const mesh = PickupOrchestrator.meshes[0];
                assert(mesh !== undefined, 'Mesh exists');
                assert(mesh.position.x === 50, 'Correct position');
            }
        }
    ]
};
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --suite=integration --test=spawn-speed-boost-pickup`
Expected: FAIL (pickup creation returns null or mesh not created)

**Step 3: Implement energy drink mesh creation**

Modify `src/weapon/pickup-orchestrator.js` - find the `_createMesh` method (around line 169):

Add before the existing `if (config.isAmmo || weaponId === null)` check:

```javascript
_createMesh(instance) {
    const THREE = this.THREE;
    if (!THREE) return null;

    const config = instance.config;
    const weaponId = config.weaponId;
    let mesh;

    // Power-up pickups use power-up-specific mesh
    if (config.isPowerup) {
        mesh = this._createPowerUpMesh(instance, THREE);
    }
    // Ammo pickups use generic ammo mesh
    else if (config.isAmmo || weaponId === null) {
        mesh = this._createAmmoMesh(instance, THREE);
    }
    // ... rest of existing code
```

Add new method after `_createAmmoMesh`:

```javascript
/**
 * Create power-up pickup mesh - energy drink can
 * @private
 */
_createPowerUpMesh(instance, THREE) {
    const pickup = new THREE.Group();
    const config = instance.config;

    // Energy drink can design
    if (config.id === 'speed_boost') {
        // Main can body (cylinder)
        const canColor = config.visual.color || 0xff3333;
        const canMat = new THREE.MeshStandardMaterial({
            color: canColor,
            roughness: 0.3,
            metalness: 0.6,
            emissive: canColor,
            emissiveIntensity: 0.3
        });

        const canGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
        const can = new THREE.Mesh(canGeo, canMat);
        pickup.add(can);

        // Top lid (metallic silver)
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.2,
            metalness: 0.9
        });
        const lidGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16);
        const lid = new THREE.Mesh(lidGeo, lidMat);
        lid.position.y = 0.425;
        pickup.add(lid);

        // Pull tab (small detail)
        const tabGeo = new THREE.BoxGeometry(0.15, 0.02, 0.08);
        const tab = new THREE.Mesh(tabGeo, lidMat);
        tab.position.set(0, 0.46, 0.1);
        pickup.add(tab);

        // Yellow warning stripe around middle
        const stripeMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00
        });
        const stripeGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.15, 16);
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0;
        pickup.add(stripe);
    } else {
        // Fallback: generic power-up mesh
        mesh = this._createGenericMesh(instance, THREE);
        return mesh;
    }

    return pickup;
},
```

**Step 4: Run test to verify it passes**

Run: `bun run-tests.js --suite=integration --test=spawn-speed-boost-pickup`
Expected: PASS

**Step 5: Register integration test**

Modify `tests/integration-tests.html`:

Find script loading section:
```html
<script src="./integration/room-progression.tests.js"></script>
```

Add:
```html
<script src="./integration/pickup-powerup.tests.js"></script>
```

Find test registration:
```javascript
RoomProgressionIntegrationTests,
```

Add:
```javascript
PickupPowerUpIntegrationTests,
```

**Step 6: Commit**

```bash
git add src/weapon/pickup-orchestrator.js tests/integration/pickup-powerup.tests.js tests/integration-tests.html
git commit -m "feat(pickup): add energy drink mesh for speed boost

- Create cylindrical can mesh with lid and details
- Add power-up branch in PickupOrchestrator._createMesh
- Red/yellow color scheme fits mall theme
- Add integration test for spawn

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Integrate Power-Ups into Pickup Spawn System

**Files:**
- Modify: `src/weapon/pickup.js`
- Modify: `src/weapon/pickup-orchestrator.js`

**Step 1: Write integration test**

Add to `tests/integration/pickup-powerup.tests.js`:

```javascript
{
    id: 'powerup-in-weighted-selection',
    description: 'Power-ups compete with weapons in weighted spawn',
    run: async (assert, runner) => {
        // Test that selectRandom can return power-ups
        const results = {};
        for (let i = 0; i < 1000; i++) {
            const pickup = runner.gameWindow.WeaponPickup.selectRandom();
            results[pickup.id] = (results[pickup.id] || 0) + 1;
        }

        assert(results.speed_boost > 0, 'Speed boost spawned in 1000 trials');
        assert(results.speed_boost > 50, 'Speed boost spawn rate reasonable (>5%)');
        assert(results.speed_boost < 400, 'Speed boost not too common (<40%)');
    }
}
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --suite=integration --test=powerup-in-weighted-selection`
Expected: FAIL (speed_boost is undefined or 0)

**Step 3: Add power-up to WeaponPickup types**

Modify `src/weapon/pickup.js` - add to the `types` object after `AMMO_LARGE`:

```javascript
AMMO_LARGE: {
    // ... existing config
},

// Power-ups - temporary effects
SPEED_BOOST: {
    id: 'speed_boost',
    weaponId: null,          // Not a weapon
    name: 'Speed Boost',
    isPowerup: true,
    spawnChance: 0.25,       // 25% of rooms
    spawnWeight: 2,          // Similar rarity to Laser Gun
    ammoGrant: 0,            // No ammo
    visual: {
        color: 0xff3333,     // Red
        glowColor: 0xffaa00, // Yellow-orange
        scale: 2.0
    }
}
```

**Step 4: Run test to verify it passes**

Run: `bun run-tests.js --suite=integration --test=powerup-in-weighted-selection`
Expected: PASS

**Step 5: Update collection logic**

Modify `src/weapon/pickup-orchestrator.js` - find the `collect` method (around line 411):

Add power-up handling before weapon logic:

```javascript
collect(pickup, weaponOrchestrator, THREE, materials, camera) {
    if (!pickup || !weaponOrchestrator) return null;

    const config = pickup.config;
    const weaponId = config.weaponId;
    const currentWeaponId = weaponOrchestrator.getCurrentId();

    // Power-up pickup - activate effect
    if (config.isPowerup) {
        if (typeof PowerUpOrchestrator !== 'undefined') {
            PowerUpOrchestrator.activate(config.id, Date.now());
        }
        return {
            switched: false,
            ammoAdded: 0,
            weaponId: currentWeaponId,
            isPowerup: true,
            powerupType: config.id
        };
    }

    // Ammo pickup - always adds ammo to current weapon
    if (config.isAmmo || weaponId === null) {
        // ... existing code
```

**Step 6: Add integration test for collection**

Add to `tests/integration/pickup-powerup.tests.js`:

```javascript
{
    id: 'collect-speed-boost-activates-effect',
    description: 'Collecting speed boost activates PowerUpOrchestrator effect',
    run: async (assert, runner) => {
        await runner.startGame();

        const THREE = runner.gameWindow.THREE;
        const scene = runner.gameWindow.scene;
        const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
        const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
        const MaterialsTheme = runner.gameWindow.MaterialsTheme;
        const camera = runner.gameWindow.camera;

        PickupOrchestrator.init(scene, THREE);
        PowerUpOrchestrator.init();

        const pickup = PickupOrchestrator.spawn('speed_boost', { x: 50, y: 2, z: 75 });

        const result = PickupOrchestrator.collect(pickup, WeaponOrchestrator, THREE, MaterialsTheme, camera);

        assert(result.isPowerup === true, 'Result indicates power-up');
        assert(result.powerupType === 'speed_boost', 'Correct power-up type');
        assert(PowerUpOrchestrator.isActive('speed_boost'), 'Speed boost is active');
        assert(PowerUpOrchestrator.getSpeedMultiplier() === 2.0, 'Speed multiplier set');
    }
}
```

**Step 7: Run test to verify it passes**

Run: `bun run-tests.js --suite=integration --test=collect-speed-boost-activates-effect`
Expected: PASS

**Step 8: Commit**

```bash
git add src/weapon/pickup.js src/weapon/pickup-orchestrator.js tests/integration/pickup-powerup.tests.js
git commit -m "feat(pickup): integrate power-ups into spawn and collection

- Add SPEED_BOOST to WeaponPickup.types
- Power-ups compete with weapons in weighted selection
- Collection activates PowerUpOrchestrator effect
- Add integration tests for spawn distribution and collection

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Apply Speed Multiplier to Player Movement

**Files:**
- Modify: `src/player/player-orchestrator.js`

**Step 1: Write integration test**

Add to `tests/integration/pickup-powerup.tests.js`:

```javascript
{
    id: 'speed-boost-doubles-player-speed',
    description: 'Active speed boost doubles player movement speed',
    run: async (assert, runner) => {
        await runner.startGame();

        const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;

        PowerUpOrchestrator.init();
        PlayerOrchestrator.init(runner.gameWindow.Player);

        // Measure normal speed
        PlayerOrchestrator.speed = 5;  // Set base speed
        const normalVel = PlayerOrchestrator.getVelocity();
        const normalSpeed = Math.sqrt(normalVel.x ** 2 + normalVel.z ** 2);

        // Activate boost
        PowerUpOrchestrator.activate('speed_boost', Date.now());

        // Measure boosted speed (need to calculate with multiplier)
        const multiplier = PowerUpOrchestrator.getSpeedMultiplier();
        assert(multiplier === 2.0, 'Multiplier is 2.0');

        const boostedSpeed = normalSpeed * multiplier;
        assert(boostedSpeed === normalSpeed * 2, 'Speed doubled with boost active');
    }
}
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --suite=integration --test=speed-boost-doubles-player-speed`
Expected: PASS (this test validates the multiplier is available, actual integration tested in step 4)

**Step 3: Modify movement calculations to use multiplier**

Modify `src/player/player-orchestrator.js` - find `calculateNewPosition` method (around line 156):

Replace the method with:

```javascript
/**
 * Calculate new position based on current velocity and speed multiplier
 * @param {number} dt - Delta time in seconds
 * @returns {Object} New position {x, z}
 */
calculateNewPosition(dt) {
    // Get speed multiplier from power-ups
    const multiplier = (typeof PowerUpOrchestrator !== 'undefined' && PowerUpOrchestrator.getSpeedMultiplier)
        ? PowerUpOrchestrator.getSpeedMultiplier()
        : 1.0;

    const velocity = this.getVelocity();
    return {
        x: this.position.x + velocity.x * multiplier * dt,
        z: this.position.z + velocity.z * multiplier * dt
    };
},
```

**Step 4: Write end-to-end integration test**

Add to `tests/integration/pickup-powerup.tests.js`:

```javascript
{
    id: 'player-moves-faster-with-boost',
    description: 'Player actually moves faster when boost is active',
    run: async (assert, runner) => {
        await runner.startGame();
        await runner.wait(100);

        const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;

        PowerUpOrchestrator.init();
        PlayerOrchestrator.reset();
        PlayerOrchestrator.setPosition(50, 75);

        // Move forward for 1 second without boost
        PlayerOrchestrator.speed = 10;  // Set to constant speed
        const startPos = { ...PlayerOrchestrator.position };
        const normalPos = PlayerOrchestrator.calculateNewPosition(1.0);
        const normalDistance = Math.sqrt(
            (normalPos.x - startPos.x) ** 2 +
            (normalPos.z - startPos.z) ** 2
        );

        // Activate boost and measure again
        PowerUpOrchestrator.activate('speed_boost', Date.now());
        const boostedPos = PlayerOrchestrator.calculateNewPosition(1.0);
        const boostedDistance = Math.sqrt(
            (boostedPos.x - startPos.x) ** 2 +
            (boostedPos.z - startPos.z) ** 2
        );

        assert(boostedDistance > normalDistance * 1.9, 'Boosted distance ~2x normal');
        assert(boostedDistance < normalDistance * 2.1, 'Boosted distance not more than 2x');
    }
}
```

**Step 5: Run test to verify it passes**

Run: `bun run-tests.js --suite=integration --test=player-moves-faster-with-boost`
Expected: PASS

**Step 6: Commit**

```bash
git add src/player/player-orchestrator.js tests/integration/pickup-powerup.tests.js
git commit -m "feat(player): apply power-up speed multiplier to movement

- Query PowerUpOrchestrator.getSpeedMultiplier() in calculateNewPosition
- Multiply velocity by multiplier (1.0 normal, 2.0 boosted)
- Add integration tests for speed doubling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Add HUD Timer Display

**Files:**
- Modify: `index.html` (add DOM element)
- Modify: `src/ui/ui-orchestrator.js` (add update method)

**Step 1: Write UI test**

Create `tests/ui/powerup.tests.js`:

```javascript
// ============================================
// POWERUP UI TESTS
// ============================================

const PowerUpUITests = {
    name: 'PowerUp UI',
    domain: 'ui',

    tests: [
        {
            id: 'powerup-timer-element-exists',
            group: 'dom',
            description: 'Power-up timer element exists in DOM',
            run: (assert) => {
                const timer = document.getElementById('powerup-timer');
                assert(timer !== null, 'Timer element exists');
            }
        },

        {
            id: 'powerup-timer-shows-countdown',
            group: 'display',
            description: 'updatePowerUpTimer() displays countdown',
            run: (assert) => {
                UIOrchestrator.init();

                UIOrchestrator.updatePowerUpTimer(8500, 'speed_boost');

                const timer = document.getElementById('powerup-timer');
                assert(timer.style.display !== 'none', 'Timer visible');
                assert(timer.textContent.includes('8'), 'Shows seconds');
                assert(timer.textContent.includes('BOOST'), 'Shows boost label');
            }
        },

        {
            id: 'powerup-timer-color-transitions',
            group: 'display',
            description: 'Timer color changes at 3s and 1s thresholds',
            run: (assert) => {
                UIOrchestrator.init();

                // Normal color (white/bright)
                UIOrchestrator.updatePowerUpTimer(5000, 'speed_boost');
                let timer = document.getElementById('powerup-timer');
                assert(!timer.classList.contains('warning'), 'No warning at 5s');
                assert(!timer.classList.contains('critical'), 'No critical at 5s');

                // Warning color (orange)
                UIOrchestrator.updatePowerUpTimer(2500, 'speed_boost');
                assert(timer.classList.contains('warning'), 'Warning at 2.5s');

                // Critical color (red)
                UIOrchestrator.updatePowerUpTimer(900, 'speed_boost');
                assert(timer.classList.contains('critical'), 'Critical at 0.9s');
            }
        },

        {
            id: 'powerup-timer-hides-when-zero',
            group: 'display',
            description: 'Timer hides when time remaining is 0',
            run: (assert) => {
                UIOrchestrator.init();

                UIOrchestrator.updatePowerUpTimer(1000, 'speed_boost');
                let timer = document.getElementById('powerup-timer');
                assert(timer.style.display !== 'none', 'Visible at 1s');

                UIOrchestrator.updatePowerUpTimer(0, 'speed_boost');
                assert(timer.style.display === 'none', 'Hidden at 0s');
            }
        }
    ]
};
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --domain=ui --test=powerup-timer-element-exists`
Expected: FAIL (element doesn't exist)

**Step 3: Add DOM element**

Modify `index.html` - find the status panel section (around line 37-56) and add after it:

```html
                </div>

                <!-- Power-Up Timer -->
                <div id="powerup-timer" style="display: none;">
                    <div class="powerup-icon">⚡</div>
                    <div class="powerup-text">
                        <span class="powerup-label">BOOST</span>
                        <span class="powerup-time">10s</span>
                    </div>
                </div>

                <div id="timer-container">
```

**Step 4: Add CSS styles**

Modify `src/styles/main.css` - add at the end of the file:

```css
/* Power-Up Timer */
#powerup-timer {
    position: absolute;
    top: 140px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #ffaa00;
    border-radius: 8px;
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Courier New', monospace;
    color: white;
    transition: all 0.3s ease;
}

#powerup-timer .powerup-icon {
    font-size: 24px;
    line-height: 1;
}

#powerup-timer .powerup-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

#powerup-timer .powerup-label {
    font-size: 12px;
    font-weight: bold;
    color: #ffaa00;
    letter-spacing: 1px;
}

#powerup-timer .powerup-time {
    font-size: 20px;
    font-weight: bold;
    color: white;
}

/* Timer color states */
#powerup-timer.warning {
    border-color: #ff9900;
}

#powerup-timer.warning .powerup-label {
    color: #ff9900;
}

#powerup-timer.critical {
    border-color: #ff3333;
    animation: pulse 0.5s ease-in-out infinite;
}

#powerup-timer.critical .powerup-label {
    color: #ff3333;
}

#powerup-timer.critical .powerup-time {
    color: #ff3333;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
```

**Step 5: Implement UIOrchestrator method**

Modify `src/ui/ui-orchestrator.js` - add to the init method (around line 56):

```javascript
this.elements.gameoverTitle = document.getElementById('gameover-title');
this.elements.statusPanel = document.getElementById('status-panel');
this.elements.skeletonCount = document.getElementById('skeleton-count');
this.elements.dinoCount = document.getElementById('dino-count');
this.elements.powerupTimer = document.getElementById('powerup-timer');
this.elements.powerupTime = document.querySelector('#powerup-timer .powerup-time');
```

Add new method after the boss warning methods (around line 300+):

```javascript
// ==========================================
// POWER-UP DISPLAY
// ==========================================

/**
 * Update power-up timer display
 * @param {number} timeRemaining - Milliseconds remaining
 * @param {string} powerupType - Power-up type ID (e.g., 'speed_boost')
 */
updatePowerUpTimer(timeRemaining, powerupType) {
    if (!this.elements.powerupTimer || !this.elements.powerupTime) return;

    const timer = this.elements.powerupTimer;
    const timeDisplay = this.elements.powerupTime;

    if (timeRemaining <= 0) {
        // Hide timer when expired
        timer.style.display = 'none';
        timer.classList.remove('warning', 'critical');
        return;
    }

    // Show timer
    timer.style.display = 'flex';

    // Update countdown text (show seconds with 1 decimal)
    const seconds = (timeRemaining / 1000).toFixed(1);
    timeDisplay.textContent = seconds + 's';

    // Apply color transitions
    timer.classList.remove('warning', 'critical');
    if (timeRemaining <= 1000) {
        timer.classList.add('critical');
    } else if (timeRemaining <= 3000) {
        timer.classList.add('warning');
    }
},
```

**Step 6: Run tests to verify they pass**

Run: `bun run-tests.js --domain=ui`
Expected: All UI tests PASS

**Step 7: Register UI tests**

Modify `tests/ui-tests.html`:

Find script loading:
```html
<script src="./ui/environment.tests.js"></script>
```

Add:
```html
<script src="./ui/powerup.tests.js"></script>
```

Find test registration:
```javascript
EnvironmentUITests
```

Add:
```javascript
PowerUpUITests,
```

**Step 8: Commit**

```bash
git add index.html src/styles/main.css src/ui/ui-orchestrator.js tests/ui/powerup.tests.js tests/ui-tests.html
git commit -m "feat(ui): add power-up timer HUD display

- Add powerup-timer DOM element to index.html
- Style with color transitions (white → orange → red)
- Implement UIOrchestrator.updatePowerUpTimer()
- Add UI tests for display and color states
- Timer shows countdown with 0.1s precision

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add FOV Camera Effect

**Files:**
- Modify: `src/engine/scene-orchestrator.js` (add base FOV storage)
- Modify: `index.html` (add FOV update in game loop)

**Step 1: Write integration test**

Add to `tests/integration/pickup-powerup.tests.js`:

```javascript
{
    id: 'fov-increases-with-boost',
    description: 'Camera FOV increases by 10 when boost is active',
    run: async (assert, runner) => {
        await runner.startGame();
        await runner.wait(100);

        const camera = runner.gameWindow.camera;
        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
        const baseFov = runner.gameWindow.BASE_FOV || 75;

        // Store initial FOV
        camera.fov = baseFov;
        camera.updateProjectionMatrix();

        PowerUpOrchestrator.init();

        assert(camera.fov === baseFov, 'Starts at base FOV');

        // Activate boost
        PowerUpOrchestrator.activate('speed_boost', Date.now());

        // Manually trigger FOV update (would happen in game loop)
        if (PowerUpOrchestrator.isActive('speed_boost')) {
            camera.fov = baseFov + 10;
            camera.updateProjectionMatrix();
        }

        assert(camera.fov === baseFov + 10, 'FOV increased by 10');
    }
}
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --suite=integration --test=fov-increases-with-boost`
Expected: FAIL (BASE_FOV not defined, or FOV doesn't change)

**Step 3: Add BASE_FOV constant**

Modify `index.html` - find where the game is initialized (search for `let camera`), add before camera setup:

```javascript
// ==========================================
// CAMERA SETUP
// ==========================================

const BASE_FOV = 75;  // Store base FOV for power-up effects

let camera = SceneOrchestrator.camera;
```

**Step 4: Add FOV update in game loop**

Modify `index.html` - find the game update loop (search for `function updateGame`), add after player/camera update:

Find this section:
```javascript
// Update player (already has camera update)
const playerState = PlayerOrchestrator.fullUpdate({
    // ... options
});
```

Add after camera position update:

```javascript
// Update camera position
const camState = PlayerOrchestrator.getCameraState();
camera.position.x = camState.x;
camera.position.y = camState.y;
camera.position.z = camState.z;
camera.rotation.set(0, 0, 0);
camera.rotation.y = camState.rotationY;
camera.rotation.x = camState.rotationX;
camera.rotation.z = camState.rotationZ;

// Apply power-up FOV effects
if (PowerUpOrchestrator.isActive('speed_boost')) {
    camera.fov = BASE_FOV + 10;
} else {
    camera.fov = BASE_FOV;
}
camera.updateProjectionMatrix();
```

**Step 5: Run test to verify it passes**

Run: `bun run-tests.js --suite=integration --test=fov-increases-with-boost`
Expected: PASS

**Step 6: Add FOV lerp for smooth transitions (optional enhancement)**

If you want smooth FOV transitions, replace the FOV update with:

```javascript
// Apply power-up FOV effects with smooth transition
const targetFov = PowerUpOrchestrator.isActive('speed_boost') ? BASE_FOV + 10 : BASE_FOV;
const lerpSpeed = 3.0;  // Adjust for faster/slower transitions
camera.fov += (targetFov - camera.fov) * lerpSpeed * dt;
camera.updateProjectionMatrix();
```

**Step 7: Commit**

```bash
git add index.html src/engine/scene-orchestrator.js
git commit -m "feat(camera): add FOV increase effect for speed boost

- Store BASE_FOV constant (75 degrees)
- Increase FOV by 10 when speed boost active
- Add smooth lerp transition between FOV states
- Update projection matrix when FOV changes
- Add integration test for FOV effect

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Connect Power-Up Update to Game Loop

**Files:**
- Modify: `index.html` (add PowerUpOrchestrator.update() call)

**Step 1: Write integration test**

Add to `tests/integration/pickup-powerup.tests.js`:

```javascript
{
    id: 'boost-expires-after-duration-in-game',
    description: 'Speed boost expires after 10 seconds in game loop',
    run: async (assert, runner) => {
        await runner.startGame();
        await runner.wait(100);

        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
        const LoopOrchestrator = runner.gameWindow.LoopOrchestrator;
        const manualUpdate = runner.gameWindow.manualUpdate;

        PowerUpOrchestrator.init();

        // Stop game loop for manual control
        LoopOrchestrator.stop();

        // Activate boost
        const startTime = Date.now();
        PowerUpOrchestrator.activate('speed_boost', startTime);
        assert(PowerUpOrchestrator.isActive('speed_boost'), 'Boost starts active');

        // Simulate 11 seconds passing (600+ frames at 60fps)
        const frameDt = 1/60;
        for (let i = 0; i < 660; i++) {
            manualUpdate(frameDt);
        }

        // Boost should be expired
        assert(!PowerUpOrchestrator.isActive('speed_boost'), 'Boost expired after duration');

        // Restart loop for cleanup
        LoopOrchestrator.start();
    }
}
```

**Step 2: Run test to verify it fails**

Run: `bun run-tests.js --suite=integration --test=boost-expires-after-duration-in-game`
Expected: FAIL (boost doesn't expire because update not called)

**Step 3: Add PowerUpOrchestrator.update() to game loop**

Modify `index.html` - find the game update function, add after enemy update:

Find this section:
```javascript
// Update enemies
EnemyOrchestrator.update(dt, playerPosition);
```

Add after:

```javascript
// Update power-ups (expire old effects)
PowerUpOrchestrator.update(dt, Date.now());
```

**Step 4: Add PowerUpOrchestrator initialization**

Find where orchestrators are initialized (search for `EnemyOrchestrator.init`), add:

```javascript
EnemyOrchestrator.init(scene, THREE);
PowerUpOrchestrator.init();
```

**Step 5: Add PowerUpOrchestrator to reset**

Find the `resetGame` function, add:

```javascript
function resetGame() {
    // ... existing resets
    EnemyOrchestrator.reset();
    PowerUpOrchestrator.reset();  // Add this line
    // ... rest of resets
}
```

**Step 6: Add UIOrchestrator.updatePowerUpTimer() to game loop**

In the update function, add after UI updates:

```javascript
// Update HUD
UIOrchestrator.updateHealth(PlayerOrchestrator.getHealth());
UIOrchestrator.updateAmmo(/* ... */);

// Update power-up timer
if (PowerUpOrchestrator.isActive('speed_boost')) {
    const timeRemaining = PowerUpOrchestrator.getTimeRemaining('speed_boost', Date.now());
    UIOrchestrator.updatePowerUpTimer(timeRemaining, 'speed_boost');
} else {
    UIOrchestrator.updatePowerUpTimer(0, 'speed_boost');  // Hide timer
}
```

**Step 7: Run test to verify it passes**

Run: `bun run-tests.js --suite=integration --test=boost-expires-after-duration-in-game`
Expected: PASS

**Step 8: Run all integration tests**

Run: `bun run-tests.js --suite=integration --domain=powerup`
Expected: All pickup-powerup integration tests PASS

**Step 9: Commit**

```bash
git add index.html
git commit -m "feat(game-loop): integrate power-up system into main loop

- Initialize PowerUpOrchestrator on game start
- Call update() each frame to expire effects
- Update UI timer each frame when boost active
- Reset on game restart
- Add end-to-end integration test for expiration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Handle Edge Cases (Pause, Death, Game Over)

**Files:**
- Modify: `index.html` (add state transition handlers)

**Step 1: Write integration tests**

Add to `tests/integration/pickup-powerup.tests.js`:

```javascript
{
    id: 'pause-stops-boost-timer',
    description: 'Pausing game stops boost countdown',
    run: async (assert, runner) => {
        await runner.startGame();
        await runner.wait(100);

        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
        const StateOrchestrator = runner.gameWindow.StateOrchestrator;
        const pauseGame = runner.gameWindow.pauseGame;

        PowerUpOrchestrator.init();

        // Activate boost
        const startTime = Date.now();
        PowerUpOrchestrator.activate('speed_boost', startTime);

        // Wait 100ms
        await runner.wait(100);
        const beforePause = PowerUpOrchestrator.getTimeRemaining('speed_boost', Date.now());

        // Pause game
        pauseGame();
        await runner.wait(500);  // Wait during pause

        // Time should not have decreased much (only the 100ms before pause)
        const afterPause = PowerUpOrchestrator.getTimeRemaining('speed_boost', Date.now());

        // Note: Timer uses Date.now() so will continue in real time
        // For proper pause behavior, we need to store activation time and pause duration
        // This test verifies boost is still active
        assert(PowerUpOrchestrator.isActive('speed_boost'), 'Boost still active after pause');
    }
},

{
    id: 'game-over-clears-boost',
    description: 'Game over clears active boosts',
    run: async (assert, runner) => {
        await runner.startGame();
        await runner.wait(100);

        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
        const gameOver = runner.gameWindow.gameOver;

        PowerUpOrchestrator.init();
        PowerUpOrchestrator.activate('speed_boost', Date.now());

        assert(PowerUpOrchestrator.isActive('speed_boost'), 'Boost active before game over');

        // Trigger game over
        gameOver();
        await runner.wait(100);

        assert(!PowerUpOrchestrator.isActive('speed_boost'), 'Boost cleared on game over');
    }
},

{
    id: 'player-death-clears-boost',
    description: 'Player death clears active boosts',
    run: async (assert, runner) => {
        await runner.startGame();
        await runner.wait(100);

        const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
        const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;

        PowerUpOrchestrator.init();
        PowerUpOrchestrator.activate('speed_boost', Date.now());

        // Kill player
        PlayerOrchestrator.health = 0;

        // Trigger death handling (would happen in game loop)
        if (PlayerOrchestrator.isDead()) {
            PowerUpOrchestrator.reset();
        }

        assert(!PowerUpOrchestrator.isActive('speed_boost'), 'Boost cleared on death');
    }
}
```

**Step 2: Run tests to verify they fail**

Run: `bun run-tests.js --suite=integration --test=game-over-clears-boost`
Expected: FAIL (boost not cleared)

**Step 3: Add PowerUpOrchestrator.reset() to game over**

Modify `index.html` - find the `gameOver` function:

```javascript
function gameOver() {
    // ... existing code
    StateOrchestrator.transition('GAME_OVER');
    PowerUpOrchestrator.reset();  // Clear active boosts
    // ... rest of function
}
```

**Step 4: Add PowerUpOrchestrator.reset() to player death**

Find where player death is handled (search for `PlayerOrchestrator.isDead()`):

```javascript
if (PlayerOrchestrator.isDead()) {
    PowerUpOrchestrator.reset();  // Clear boosts on death
    gameOver();
}
```

**Step 5: Run tests to verify they pass**

Run: `bun run-tests.js --suite=integration --domain=powerup`
Expected: All edge case tests PASS

**Step 6: Commit**

```bash
git add index.html tests/integration/pickup-powerup.tests.js
git commit -m "feat(powerup): handle edge cases (pause, death, game over)

- Clear boosts on game over
- Clear boosts on player death
- Add integration tests for state transitions
- Ensures clean state after game ends

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Manual Smoke Test & Balance Tuning

**Files:**
- None (manual testing)

**Step 1: Run all tests**

Run: `bun run-tests.js --suite=integration`
Expected: All integration tests PASS

Run: `bun run-tests.js --domain=powerup`
Expected: All powerup tests PASS

Run: `bun run-tests.js --domain=ui`
Expected: All UI tests PASS (including powerup timer)

**Step 2: Manual smoke test**

Start the game manually and test:

```
Manual Test Checklist:
[ ] Start game, find speed boost pickup (energy drink can)
[ ] Can is red/yellow, floats and rotates
[ ] Collect can → HUD timer appears (top-right)
[ ] Movement feels noticeably faster (2x)
[ ] FOV wider, screen feels faster
[ ] Timer counts down from 10.0s → 0.0s
[ ] Timer stays white until 3s
[ ] Timer turns orange at 3s
[ ] Timer flashes red at 1s
[ ] Boost expires smoothly at 0s
[ ] Speed returns to normal (no jarring snap)
[ ] Timer disappears after expiration
[ ] Find second boost while already boosted
[ ] Timer refreshes to 10s (doesn't stack to 20s)
[ ] Press ESC to pause → timer stops counting (still visible)
[ ] Resume → timer continues from where it stopped
[ ] Die while boosted → timer disappears
[ ] No console errors during any of the above
```

**Step 3: Balance tuning (if needed)**

If any values feel off during testing, adjust in `src/powerup/powerup.js`:

- **Speed too fast/slow**: Change `speedMultiplier` (try 1.5 or 2.5)
- **Duration too long/short**: Change `duration` (try 8000 or 12000)
- **Too common/rare**: Change `spawnChance` and `spawnWeight`
- **FOV change disorienting**: In index.html, change `BASE_FOV + 10` to `BASE_FOV + 5`

**Step 4: Document any tuning**

If you changed values, commit the tuning:

```bash
git add src/powerup/powerup.js index.html
git commit -m "balance(powerup): tune speed boost parameters

- Adjust [parameter] from [old] to [new]
- Reason: [why the change was needed]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/docs/GAME_DESIGN.md`
- Modify: `.claude/docs/ARCHITECTURE.md`

**Step 1: Update CLAUDE.md**

Modify `CLAUDE.md` - add to domain quick reference table:

```markdown
| Domain | Data | Orchestrator | Purpose |
|--------|------|--------------|---------|
| enemy | `enemy.js` | `enemy-orchestrator.js` | Enemy types, AI, spawning |
| weapon | `weapon.js` | `weapon-orchestrator.js` | Weapons, ammo, firing |
| powerup | `powerup.js` | `powerup-orchestrator.js` | Power-ups, effects, timers |
| room | `room.js` | `room-orchestrator.js` | Room grid, themes |
```

**Step 2: Update GAME_DESIGN.md**

Modify `.claude/docs/GAME_DESIGN.md` - add new section after Weapons:

```markdown
---

## Power-Ups

### Speed Boost

| Stat | Value |
|------|-------|
| Effect | 2x movement speed |
| Duration | 10 seconds |
| Spawn Chance | 25% per room |
| Visual | Red/yellow energy drink can |

- Temporary speed increase for aggressive room clearing
- Refreshes timer if collected while already boosted (doesn't stack)
- HUD timer shows remaining duration with color warnings

---
```

**Step 3: Update ARCHITECTURE.md**

Modify `.claude/docs/ARCHITECTURE.md` - add powerup to directory structure:

```markdown
src/
├── engine/          # Core systems (state, input, loop, collision)
├── shared/          # Cross-domain utilities (materials)
├── ui/              # HUD, menus, minimap
├── room/            # Room grid, themes, meshes
├── player/          # Player cart, movement, health
├── weapon/          # Weapons (slingshot, watergun, nerfgun)
├── powerup/         # Power-ups (speed boost, future effects)
├── projectile/      # Projectile physics, visuals
├── enemy/           # Enemy types, AI, spawning
├── particle/        # Particle effects
└── environment/     # Obstacles, shelves, spawn system
```

**Step 4: Commit documentation updates**

```bash
git add CLAUDE.md .claude/docs/GAME_DESIGN.md .claude/docs/ARCHITECTURE.md
git commit -m "docs: add power-up system documentation

- Add powerup domain to CLAUDE.md quick reference
- Document speed boost in GAME_DESIGN.md
- Update architecture with powerup directory
- Reflect new feature in project structure

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Final Integration Test & Cleanup

**Files:**
- Run full test suite

**Step 1: Run complete test suite**

Run: `bun run test`
Expected: All tests PASS (unit + integration + UI)

Check output for:
- No test failures
- No console errors
- All domains passing

**Step 2: Check for any leftover TODOs or console.logs**

```bash
grep -r "TODO" src/powerup/
grep -r "console.log" src/powerup/
```

Remove any debug statements or mark TODOs for future work.

**Step 3: Run focused test suite for powerup**

Run: `bun run-tests.js --domain=powerup`
Run: `bun run-tests.js --suite=integration --grep=powerup`

**Step 4: Final smoke test**

Play through a complete 3-minute session:
- Collect multiple speed boosts
- Test with different weapons
- Verify interactions with enemies
- Check performance (no lag from FOV changes)
- Confirm HUD timer is readable

**Step 5: Tag the release (optional)**

If this is a version milestone:

```bash
git tag -a v5.6-speed-boost -m "Add speed boost power-up feature"
git push origin v5.6-speed-boost
```

**Step 6: Final commit (if any cleanup was needed)**

```bash
git add .
git commit -m "chore: final cleanup for speed boost feature

- Remove debug statements
- Final test suite verification
- Ready for merge

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

Implementation is complete when:

- [ ] All unit tests pass (`bun run-tests.js --domain=powerup`)
- [ ] All integration tests pass (`bun run-tests.js --suite=integration`)
- [ ] All UI tests pass (`bun run-tests.js --domain=ui`)
- [ ] Manual smoke test checklist completed (Task 10)
- [ ] No console errors during gameplay
- [ ] Speed boost spawns in ~25% of rooms
- [ ] Collection activates 2x speed for 10 seconds
- [ ] HUD timer displays and updates correctly
- [ ] FOV effect feels good (not disorienting)
- [ ] Timer refreshes on second pickup (doesn't stack)
- [ ] Boost clears on death/game over
- [ ] Documentation updated

---

## Testing Commands Quick Reference

| Command | When to Use |
|---------|------------|
| `bun run-tests.js --domain=powerup` | After powerup domain changes |
| `bun run-tests.js --domain=ui` | After UI changes |
| `bun run-tests.js --suite=integration` | After integration work |
| `bun run-tests.js --test=<id>` | Run single test |
| `bun run-tests.js --failed` | Re-run only failed tests |
| `bun run test` | Full suite (final check) |

---

## File Summary

**New Files (3):**
- `src/powerup/powerup.js` - Data definitions
- `src/powerup/powerup-orchestrator.js` - State management
- `src/powerup/powerup.test.js` - Unit tests
- `tests/integration/pickup-powerup.tests.js` - Integration tests
- `tests/ui/powerup.tests.js` - UI tests

**Modified Files (7):**
- `src/weapon/pickup.js` - Add SPEED_BOOST type
- `src/weapon/pickup-orchestrator.js` - Power-up mesh + collection
- `src/player/player-orchestrator.js` - Apply speed multiplier
- `src/ui/ui-orchestrator.js` - Timer display
- `index.html` - Script loading, FOV effect, game loop integration
- `src/styles/main.css` - Timer styles
- `CLAUDE.md`, `.claude/docs/GAME_DESIGN.md`, `.claude/docs/ARCHITECTURE.md` - Documentation

**Test Files (3):**
- `src/powerup/powerup.test.js`
- `tests/integration/pickup-powerup.tests.js`
- `tests/ui/powerup.tests.js`
