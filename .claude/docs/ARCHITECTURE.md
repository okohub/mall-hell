# Architecture

## Domain-Driven Design

Each domain is self-contained with this file pattern:

| File | Purpose |
|------|---------|
| `<domain>.js` | Pure data, constants, configs |
| `<domain>-theme.js` | Colors, materials, visuals |
| `<domain>-mesh.js` | Three.js mesh creation |
| `<domain>-system.js` | State management, logic |
| `<domain>.test.js` | Unit tests |

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

## Key Principles

1. **Zero cross-file dependencies** - Each file is self-contained
2. **No imports/exports** - Files use global scope (browser-compatible)
3. **Dependency injection** - THREE.js passed as parameter
4. **Separation of concerns** - Data, theme, mesh, logic are separate

## Script Loading Order

In `index.html`, load in this order:
1. Three.js (CDN)
2. `src/shared/materials-theme.js`
3. `src/ui/ui.js` → `ui-system.js`
4. `src/engine/*` (engine.js first, then *-system.js)
5. Domain files (data → theme → mesh → system)

## Key Systems

### WeaponManager
```javascript
WeaponManager.init(scene);
WeaponManager.register(Slingshot);
WeaponManager.equip('slingshot', THREE, MaterialsTheme, camera);
WeaponManager.onFireStart(Date.now());
WeaponManager.onFireRelease(Date.now());
```

### EnemySystem
```javascript
// Get enemy type based on score (for dynamic spawning)
const type = EnemySystem.getSpawnType(currentScore);
const enemy = EnemySystem.createMesh(THREE, type, x, z);
```

### SpawnSystem (Lazy Loading)
```javascript
// Plan all rooms (data only, no meshes)
SpawnSystem.planAllRooms(rooms, config, getEnemyType, score);

// Materialize when player approaches
SpawnSystem.materializeNearbyRooms(room, grid, roomSystem, callbacks);
```

### UISystem
```javascript
UISystem.updateScore(score, animate);
UISystem.updateMinimap({ currentRoom, enemies, gridSystem, roomConfig });
UISystem.showBossWarning('DINO BOSS!');
```

### StateSystem
```javascript
StateSystem.init('MENU');
StateSystem.transition('PLAYING');
StateSystem.getState(); // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
```
