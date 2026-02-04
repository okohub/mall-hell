# Architecture

## Domain Organization (Module Pattern)

**Architectural Style**: Transaction Script + Module Pattern with domain-inspired organization.

This is **not pure Domain-Driven Design** (no entities, aggregates, or value objects), but uses domain concepts for code organization. This pragmatic approach balances simplicity with maintainability for a game with straightforward mechanics.

### Standard Domain Pattern

Most domains follow this file pattern:

| File | Purpose |
|------|---------|
| `<domain>.js` | Pure data, constants, configs (single source of truth) |
| `<domain>-theme.js` | Colors, materials, visuals |
| `<domain>-mesh.js` | Three.js mesh creation (stateless) |
| `<domain>-orchestrator.js` | State management, logic |
| `<domain>.test.js` | Unit tests |

### Weapon Domain Pattern (Registry + Per-Type API)

Weapons follow a registry-first, per-type folder pattern (matching projectiles). Each weapon type exposes a **single public API file** that delegates to mesh and animation modules, and registers itself into a global registry.

| File | Purpose | Notes |
|------|---------|-------|
| `weapon.js` | Central weapon configs | Single source of truth |
| `weapon-orchestrator.js` | Orchestration + registration | Adds `registerAllFromRegistry()` |
| `weapon/<type>/<type>.js` | **Public API** for the type | Registers to registry, delegates to mesh/animation |
| `weapon/<type>/<type>-mesh.js` | Stateless mesh creation | `createFPSMesh`, `createPickupMesh` |
| `weapon/<type>/<type>-animation.js` | Stateless animation | `animateFPS`, `updateTransform` |
| `pickup.js`, `pickup-orchestrator.js` | Weapon pickups | Unchanged |
| `weapon.test.js` | Unit tests | Registry hooks enforced |

**Registry**
`globalThis.WeaponTypeRegistry` is the single registry used for weapon registration.

**Key rules**:
1. The type file is the only public API for a weapon.
2. Mesh and animation live in separate files.
3. Registry entries must define `createFPSMesh`, `createPickupMesh`, and `animateFPS`.
4. `WeaponOrchestrator.registerAllFromRegistry()` should be used to register weapons.

**Script load order (non-modules)**:
Mesh → Animation → Type for each weapon, then `weapon-orchestrator.js`.

### Projectile Domain Pattern (Registry + Per-Type API)

Projectiles use a registry-first pattern with per-type folders. Each projectile type exposes a **single API file** that delegates to its mesh and animation modules.

| File | Purpose | Notes |
|------|---------|-------|
| `projectile.js` | System constants + registry access | Uses `globalThis.ProjectileTypeRegistry` |
| `projectile-orchestrator.js` | Spawning + update loop | **Fail-fast** if hooks missing |
| `projectile/<type>/<type>.js` | **Public API** for the type | Registers to registry, delegates to mesh/animation |
| `projectile/<type>/<type>-mesh.js` | Stateless mesh creation | `createMesh(THREE, context)` |
| `projectile/<type>/<type>-animation.js` | Stateless animation | `animate(mesh, dt)` |
| `projectile.test.js` | Unit tests | Asserts hooks exist + fail-fast |

**Key rules**:
1. The type file is the only public API for a projectile.
2. Mesh and animation live in separate files.
3. Registry entries must define `createMesh` and `animate`.
4. Orchestrator throws if hooks are missing.

**Script load order (non-modules)**:
Mesh → Animation → Type for each projectile, then `projectile.js` → `projectile-orchestrator.js`.

### Enemy Domain Pattern (Registry + Per-Type API)

Enemies now follow the same registry-first pattern with per-type folders. Each enemy type exposes a **single API file** that delegates to mesh and animation modules and registers into a global registry.

| File | Purpose | Notes |
|------|---------|-------|
| `enemy.js` | Central enemy configs | Single source of truth |
| `enemy-orchestrator.js` | Spawning + updates | Uses registry hooks |
| `enemy/<type>/<type>.js` | **Public API** for the type | Registers to registry, delegates to mesh/animation |
| `enemy/<type>/<type>-mesh.js` | Stateless mesh creation | `createEnemy` / `createMesh` |
| `enemy/<type>/<type>-animation.js` | Stateless animation | `animateWalk` / `animateEyes` |
| `enemy.test.js` | Unit tests | Registry hooks enforced |

**Registry**
`globalThis.EnemyTypeRegistry` is the single registry used by `enemy-orchestrator.js`.

**Key rules**:
1. The type file is the only public API for an enemy.
2. Mesh and animation live in separate files.
3. Registry entries must define `createMesh`, `animateWalk`, and `applyHitFlash`.
4. `animateEyes` is optional (skeleton only).

**Script load order (non-modules)**:
Mesh → Animation → Type for each enemy, then `enemy-orchestrator.js`.

### Roadmap: Apply Pattern to Other Domains
- **Next**: Remaining domains as needed (particles, powerups, etc.)

## Directory Structure

```
src/
├── engine/          # Core systems (state, input, loop, collision)
├── shared/          # Cross-domain utilities (materials)
├── ui/              # HUD, menus, minimap
├── room/            # Room grid, themes, meshes
├── player/          # Player cart, movement, health
├── weapon/          # Weapons (slingshot, watergun, nerfgun)
├── projectile/      # Projectile physics, visuals
├── enemy/           # Enemy types, AI, spawning
├── particle/        # Particle effects
├── powerup/         # Power-ups (speed boost, future effects)
└── environment/     # Obstacles, shelves, spawn system
```

## Architectural Trade-offs

### What We Have
- **Transaction Script + Module Pattern**: Procedural behavior organized in singleton modules
- **Domain-inspired organization**: Clear boundaries, ubiquitous language
- **Stateless helpers**: Mesh/animation modules are pure functions
- **Mutable state**: Direct state mutation, no encapsulation

### What We Don't Have (and why)
- **No Entities**: Weapons are singleton modules, not class instances
  - *Trade-off*: Simpler code, but only one instance per weapon type
  - *Sufficient because*: Single-player game, no need for multiple weapon instances
- **No Value Objects**: Fire results are plain objects `{ damage, speed, type }`
  - *Trade-off*: No immutability guarantees
  - *Sufficient because*: Short-lived data, clear ownership
- **No Aggregates**: State directly mutable, no invariant protection
  - *Trade-off*: No encapsulation, can set `state.ammo = -100`
  - *Sufficient because*: Small codebase, controlled access patterns
- **No Layering**: Domain logic mixed with THREE.js rendering
  - *Trade-off*: Can't swap rendering engines
  - *Sufficient because*: THREE.js is the only rendering target

### Why This Works
This architecture is pragmatic for a browser-based game with:
- Simple domain (4 weapons, straightforward mechanics)
- Single-player (no need for multiple instances)
- Rapid iteration (less ceremony, faster changes)
- Clear ownership (one developer/team)

### When to Refactor to True DDD
Consider true DDD if you need:
- Multiple weapon instances (multiplayer, inventory systems)
- Complex invariants (transaction boundaries, validation)
- Engine independence (Unity, Unreal, custom renderer)
- Large team (need strict boundaries, encapsulation)

## Key Principles

1. **Domain boundaries** - Each domain is self-contained with clear purpose
2. **Global scope** - No imports/exports (browser-compatible, order-dependent loading)
3. **Dependency injection** - THREE.js and materials passed as parameters
4. **Separation of concerns** - Data, visuals, behavior are separate files
5. **Single source of truth** - Config data centralized in `<domain>.js` files
6. **Stateless helpers** - Mesh and animation modules receive all data as parameters
7. **Module singletons** - Domains are singleton modules (not class instances)
8. **Registry-driven types** - Projectile, weapon, and enemy types register into single global registries

## Script Loading Order

In `index.html`, load in this order:
1. Three.js (CDN)
2. `src/shared/materials-theme.js`
3. `src/ui/ui.js` → `ui-orchestrator.js`
4. `src/engine/*` (engine.js first, then *-orchestrator.js)
5. Domain files (data → theme → mesh → orchestrator)
6. **Registry domains**: mesh → animation → type for each projectile/weapon/enemy, then their domain files (`projectile.js` → `projectile-orchestrator.js`, `weapon-orchestrator.js`, `enemy-orchestrator.js`)

## Key Systems

### WeaponOrchestrator
```javascript
WeaponOrchestrator.init(scene);
WeaponOrchestrator.register(Slingshot);
WeaponOrchestrator.equip('slingshot', THREE, MaterialsTheme, camera);
WeaponOrchestrator.onFireStart(Date.now());
WeaponOrchestrator.onFireRelease(Date.now());
```

### EnemyOrchestrator
```javascript
// Get enemy type based on score (for dynamic spawning)
const type = EnemyOrchestrator.getSpawnType(currentScore);
const enemy = EnemyOrchestrator.createMesh(THREE, type, x, z);
```

### SpawnOrchestrator (Lazy Loading)
```javascript
// Plan all rooms (data only, no meshes)
SpawnOrchestrator.planAllRooms(rooms, config, getEnemyType, score);

// Materialize when player approaches
SpawnOrchestrator.materializeNearbyRooms(room, grid, roomOrchestrator, callbacks);
```

### UIOrchestrator
```javascript
UIOrchestrator.updateScore(score, animate);
UIOrchestrator.updateMinimap({ currentRoom, enemies, gridOrchestrator, roomConfig });
UIOrchestrator.showBossWarning('DINO BOSS!');
```

### StateOrchestrator
```javascript
StateOrchestrator.init('MENU');
StateOrchestrator.transition('PLAYING');
StateOrchestrator.getState(); // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
```
