# Enemy Domain Refactor Plan

**Goal**: Split enemy domain using same pattern as weapon refactor

## Current State

**Files**:
- `enemy.js` (136 lines) - ✅ Configs for SKELETON, DINOSAUR
- `enemy-theme.js` (45 lines) - ✅ Colors
- `enemy-orchestrator.js` (711 lines) - ✅ Orchestrates all enemies
- **`enemy-mesh.js` (1,793 lines)** - ❌ TOO LARGE - needs splitting
- `enemy.test.js` (1,025 lines) - Tests

**enemy-mesh.js structure**:
- Lines 1-47: Shared utilities (`createHealthBar`, `updateHealthBar`, `applyHitFlash`)
- Lines 48-883: **Skeleton mesh creation** (~835 lines of mesh building)
- Lines 884-955: **Skeleton animation** (`animateSkeletonEyes`, `animateSkeletonWalk`)
- Lines 1007-1044: **Dispatcher** (`createEnemy` - routes to skeleton/dinosaur)
- Lines 1045-1719: **Dinosaur mesh creation** (~674 lines)
- Lines 1720-1792: **Dinosaur animation** (`animateDinosaurWalk`)

## Target Structure (Same as Weapons)

```
enemy.js                    - Configs (unchanged)
enemy-theme.js              - Colors (unchanged)
enemy-orchestrator.js       - Orchestrator (minimal changes)
enemy-mesh.js               - Thin dispatcher (~100 lines)

skeleton.js                 - Behavioral module (~150 lines)
skeleton-mesh.js            - Pure mesh creation (~900 lines)
skeleton-animation.js       - Pure animation (~130 lines)

dinosaur.js                 - Behavioral module (~150 lines)
dinosaur-mesh.js            - Pure mesh creation (~750 lines)
dinosaur-animation.js       - Pure animation (~130 lines)
```

## Step-by-Step Execution

### Phase 1: Extract Skeleton

#### 1.1: Create `skeleton-mesh.js`
Extract lines 48-883 from enemy-mesh.js:
- Include private helper functions: `_createShoppingCart`, `_createFullSkeleton`, `_createSkull`, `_createTorso`, etc.
- Main function: `createSkeletonMesh(THREE, config)`
- Returns: mesh group with userData references

**Pattern**:
```javascript
const SkeletonMesh = {
    createMesh(THREE, config) {
        // Extracted mesh creation code
        // Returns group with userData: {cart, skeleton, skull, leftEye, rightEye, leftLeg, rightLeg, ...}
    },

    // Private helpers (underscore prefix)
    _createShoppingCart(THREE, v) { ... },
    _createFullSkeleton(THREE, v) { ... },
    _createSkull(THREE, v) { ... },
    _createTorso(THREE, v) { ... },
    _createLimbs(THREE, v) { ... }
};
```

#### 1.2: Create `skeleton-animation.js`
Extract lines 884-955 from enemy-mesh.js:
- `animateEyes(enemyMesh, targetPos, dt)`
- `animateWalk(enemyMesh, walkTimer, dt, config)`

**Pattern**:
```javascript
const SkeletonAnimation = {
    animateEyes(enemyMesh, targetPos) {
        // Eye tracking logic
    },

    animateWalk(enemyMesh, walkTimer, walkSpeed) {
        // Walking animation (legs, arms, body bob)
    }
};
```

#### 1.3: Create `skeleton.js`
New behavioral module (like Slingshot, NerfGun):
```javascript
const Skeleton = {
    id: 'skeleton',
    name: 'Skeleton Driver',

    get config() {
        return Enemy.types.SKELETON;
    },

    // Mesh delegation
    createMesh(THREE) {
        return SkeletonMesh.createMesh(THREE, this.config);
    },

    // Animation delegation
    animateEyes(enemy, playerPos) {
        SkeletonAnimation.animateEyes(enemy.userData.cart, playerPos);
    },

    animateWalk(enemy, walkTimer, dt) {
        const walkSpeed = this.config.walkSpeed || 3.5;
        SkeletonAnimation.animateWalk(enemy.userData.cart, walkTimer, walkSpeed);
    }
};
```

### Phase 2: Extract Dinosaur

#### 2.1: Create `dinosaur-mesh.js`
Extract lines 1045-1719 from enemy-mesh.js:
- Include private helpers: `_createDinosaurBody`, `_createDinosaurHead`, `_createDinosaurLegs`, `_createDinosaurArms`, `_createDinosaurTail`
- Main function: `createDinosaurMesh(THREE, config)`

#### 2.2: Create `dinosaur-animation.js`
Extract lines 1720-1792 from enemy-mesh.js:
- `animateWalk(enemyMesh, walkTimer, walkSpeed)`

#### 2.3: Create `dinosaur.js`
Same pattern as skeleton.js

### Phase 3: Refactor enemy-mesh.js

Keep only:
- Shared utilities: `createHealthBar`, `updateHealthBar`, `applyHitFlash`
- Dispatcher:
```javascript
const EnemyVisual = {
    createHealthBar(THREE, width = 2) { ... },
    updateHealthBar(healthBar, percent) { ... },
    applyHitFlash(enemyMesh, intensity) { ... },

    // Dispatcher
    createEnemy(THREE, config) {
        const group = new THREE.Group();

        let visual;
        if (config.id === 'dinosaur') {
            visual = DinosaurMesh.createMesh(THREE, config);
        } else {
            visual = SkeletonMesh.createMesh(THREE, config);
        }

        group.add(visual);
        group.userData.cart = visual;

        // Add health bar
        const healthBar = this.createHealthBar(THREE, 2);
        healthBar.position.y = config.visual.size.h + 1;
        group.add(healthBar);
        group.userData.healthBar = healthBar;

        return group;
    },

    // Animation dispatchers
    animateEyes(enemyMesh, targetPos) {
        if (enemyMesh.userData.skeleton) {
            SkeletonAnimation.animateEyes(enemyMesh, targetPos);
        }
    },

    animateSkeletonWalk(enemyMesh, walkTimer, walkSpeed) {
        SkeletonAnimation.animateWalk(enemyMesh, walkTimer, walkSpeed);
    },

    animateDinosaurWalk(enemyMesh, walkTimer, walkSpeed) {
        DinosaurAnimation.animateWalk(enemyMesh, walkTimer, walkSpeed);
    }
};
```

### Phase 4: Update enemy-orchestrator.js

Replace:
```javascript
// OLD
EnemyVisual.animateSkeletonWalk(enemy.userData.cart, enemy.userData.walkTimer, walkSpeed);
EnemyVisual.animateDinosaurWalk(enemy.userData.cart, enemy.userData.walkTimer, walkSpeed);

// NEW
if (enemy.userData.config.id === 'dinosaur') {
    DinosaurAnimation.animateWalk(enemy.userData.cart, enemy.userData.walkTimer, walkSpeed);
} else {
    SkeletonAnimation.animateWalk(enemy.userData.cart, enemy.userData.walkTimer, walkSpeed);
}
```

### Phase 5: Update index.html

Add script tags in correct order (before enemy-orchestrator.js):
```html
<!-- Skeleton -->
<script src="./src/enemy/skeleton-mesh.js"></script>
<script src="./src/enemy/skeleton-animation.js"></script>
<script src="./src/enemy/skeleton.js"></script>

<!-- Dinosaur -->
<script src="./src/enemy/dinosaur-mesh.js"></script>
<script src="./src/enemy/dinosaur-animation.js"></script>
<script src="./src/enemy/dinosaur.js"></script>

<!-- Enemy mesh dispatcher -->
<script src="./src/enemy/enemy-mesh.js"></script>

<!-- Enemy orchestrator -->
<script src="./src/enemy/enemy-orchestrator.js"></script>
```

### Phase 6: Test

```bash
bun run-tests.js --domain=enemy
```

Expected: All enemy tests should pass (currently 61 tests)

## Key Differences from Weapons

**Enemies DON'T have**:
- Per-instance state management (orchestrator handles all state)
- Input handlers (onFireStart, onFireRelease)
- Firing logic (no fire() method)

**Enemies DO have**:
- Shared mesh creation (shopping cart used by skeleton)
- Animation coordination (eyes track player, walking)
- AI behavior (handled by orchestrator, not individual modules)

## Success Criteria

- [ ] enemy-mesh.js reduced from 1,793 → ~100 lines (94% reduction)
- [ ] 6 new files created (skeleton × 3, dinosaur × 3)
- [ ] All enemy tests passing (61 tests)
- [ ] No changes to enemy.js or enemy-theme.js
- [ ] enemy-orchestrator.js only minor updates
- [ ] index.html script tags added

## Reference

See weapon refactor for pattern:
- `src/weapon/slingshot.js` - behavioral module example
- `src/weapon/slingshot-mesh.js` - mesh module example
- `src/weapon/slingshot-animation.js` - animation module example
