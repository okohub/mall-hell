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

### Weapon Domain Pattern (Refactored)

Weapons use a specialized pattern for better focus and context management:

| File | Purpose | Size Impact |
|------|---------|-------------|
| `weapon.js` | All weapon configs (single source of truth) | Centralized |
| `weapon-orchestrator.js` | Weapon orchestration, lifecycle | Unchanged |
| `<weapon>.js` | Thin behavioral module (delegates to mesh/animation) | **55-63% smaller** |
| `<weapon>-mesh.js` | Stateless mesh creation functions | ~250 lines |
| `<weapon>-animation.js` | Stateless animation functions | ~65 lines |
| `pickup.js`, `pickup-orchestrator.js` | Weapon pickup logic | Unchanged |
| `weapon.test.js` | Unit tests | Unchanged |

**Key difference**: Individual weapons split visual concerns (mesh, animation) from behavioral concerns (firing, state).

**Delegation Pattern**:
```javascript
// Config: Reference central source
get config() {
    return { ...Weapon.types.SLINGSHOT, ammo: { /* runtime */ } };
}

// Mesh: Delegate to stateless module
createFPSMesh(THREE, materials) {
    return SlingshotMesh.createFPSMesh(THREE, materials, this.theme);
}

// Animation: Delegate to stateless module (state management stays in behavior)
animateFPS(refs, dt) {
    // Update state here if needed
    SlingshotAnimation.animateFPS(refs, this.state, dt);
}
```

**Benefits**:
- **Focus**: Each file has one clear purpose (mesh OR animation OR behavior)
- **Context**: Smaller files fit in LLM/editor context windows
- **Reusability**: Mesh/animation modules are pure functions
- **Maintainability**: Change mesh without touching animation or behavior

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

## Script Loading Order

In `index.html`, load in this order:
1. Three.js (CDN)
2. `src/shared/materials-theme.js`
3. `src/ui/ui.js` → `ui-orchestrator.js`
4. `src/engine/*` (engine.js first, then *-orchestrator.js)
5. Domain files (data → theme → mesh → orchestrator)

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
