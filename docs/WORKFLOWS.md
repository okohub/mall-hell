# Workflows

## Adding a New Enemy Type

**Example:** Adding a 'GHOST' enemy

### Step 1: Define type in `src/enemy/enemy.js`
```javascript
GHOST: {
    id: 'ghost',
    name: 'Ghost Shopper',
    health: 2,
    speed: 0.45,
    damage: 15,
    scoreHit: 200,
    scoreDestroy: 600,
    // ... size and behavior config
}
```

### Step 2: Create folder + files in `src/enemy/ghost/`
```
src/enemy/ghost/
  ghost.js
  ghost-mesh.js
  ghost-animation.js
```

### Step 3: Implement the type API (registers to registry)
```javascript
var EnemyTypeRegistry = globalThis.EnemyTypeRegistry ||= {};

const Ghost = {
    id: 'ghost',
    createMesh(THREE, config) { return GhostMesh.createEnemy(THREE, config); },
    animateWalk(mesh, walkTimer) { return GhostAnimation.animateWalk(mesh, walkTimer, config.walkSpeed); },
    applyHitFlash(mesh, intensity) { GhostMesh.applyHitFlash(mesh, intensity); },
    updateHealthBar(bar, percent) { GhostMesh.updateHealthBar(bar, percent); }
};

EnemyTypeRegistry.GHOST = Ghost;
```

### Step 4: Implement mesh/animation helpers
```javascript
// ghost-mesh.js
const GhostMesh = {
  createEnemy(THREE, config) { /* build full enemy group + health bar */ },
  createMesh(THREE, config) { /* build visual only */ },
  applyHitFlash(enemyMesh, intensity) { /* emissive pulse */ },
  updateHealthBar(healthBar, percent) { /* resize/gradient */ }
};
```

```javascript
// ghost-animation.js
const GhostAnimation = {
  animateWalk(enemyMesh, walkTimer, walkSpeed) { /* bob/sway */ }
};
```

### Step 5: Add scripts to `index.html` + `tests/unit-tests.html`
Load order **mesh → animation → type**:
```html
<script src="./src/enemy/ghost/ghost-mesh.js"></script>
<script src="./src/enemy/ghost/ghost-animation.js"></script>
<script src="./src/enemy/ghost/ghost.js"></script>
```

### Step 6: Update spawn logic (if needed)
Use `EnemySpawner.getSpawnType()` or `EnemyOrchestrator.getSpawnType()` to add your spawn rule.

### Step 7: Add tests
- Unit tests in `src/enemy/enemy.test.js` (registry + hooks).
- UI tests in `tests/ui/enemy.tests.js` (visual/behavior expectations).

---

## Adding a New Weapon

**Note**: Weapons use a per-type folder pattern with a single registry. See existing weapons (slingshot, nerfgun) as reference.

### Step 1: Add config in `src/weapon/weapon.js`
```javascript
MYWEAPON: {
    id: 'myweapon',
    name: 'My Weapon',
    fireMode: 'single',  // 'single', 'auto', 'charge', 'burst'
    cooldown: 300,
    range: 100,
    aimAssist: true,
    projectile: {
        type: 'myprojectile',
        speed: { min: 80, max: 80 },
        damage: 1.5,
        count: 1
    },
    charge: null  // Or { rate, minTension, maxTension }
}
```

### Step 2: Create mesh file `src/weapon/myweapon/myweapon-mesh.js`
```javascript
const MyWeaponMesh = {
    createFPSMesh(THREE, materials, theme) {
        // Create FPS viewmodel mesh
        // Return { weapon, hands, ...refs }
    },
    createPickupMesh(THREE, theme) {
        // Create world pickup mesh
    }
};
```

### Step 3: Create animation file `src/weapon/myweapon/myweapon-animation.js`
```javascript
const MyWeaponAnimation = {
    animateFPS(refs, state, dt, config) {
        // Animate based on state (charging, firing, etc.)
    },
    updateTransform(weapon, turnRate) {
        // Handle weapon sway/lean
    }
};
```

### Step 4: Create behavioral module `src/weapon/myweapon/myweapon.js`
```javascript
var WeaponTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.WeaponTypeRegistry = globalThis.WeaponTypeRegistry || {})
    : {};

const MyWeapon = {
    id: 'myweapon',
    name: 'My Weapon',

    // Config getter (references Weapon.types.MYWEAPON)
    get config() {
        return {
            ...Weapon.types.MYWEAPON,
            ammo: { max: 30, current: 30, consumePerShot: 1 }
        };
    },

    theme: { /* colors */ },
    state: { /* runtime state */ },

    // Lifecycle
    onEquip() { ... },
    onUnequip() { ... },
    resetState() { ... },

    // Input handlers
    onFireStart(time) { ... },
    onFireRelease(time) { ... },
    update(dt, time) { ... },

    // Firing logic
    canFire(time) { ... },
    fire(time) { ... },

    // Mesh delegation
    createFPSMesh(THREE, materials) {
        return MyWeaponMesh.createFPSMesh(THREE, materials, this.theme);
    },
    createPickupMesh(THREE) {
        return MyWeaponMesh.createPickupMesh(THREE, this.theme);
    },

    // Animation delegation
    animateFPS(refs, dt) {
        MyWeaponAnimation.animateFPS(refs, this.state, dt, this.config);
    },
    updateTransform(weapon, turnRate) {
        MyWeaponAnimation.updateTransform(weapon, turnRate);
    }
};

WeaponTypeRegistry.myweapon = MyWeapon;
```

### Step 5: Add script tags in `index.html`
```html
<!-- MyWeapon -->
<script src="./src/weapon/myweapon/myweapon-mesh.js"></script>
<script src="./src/weapon/myweapon/myweapon-animation.js"></script>
<script src="./src/weapon/myweapon/myweapon.js"></script>
```
**Order matters**: mesh → animation → behavior

### Step 6: Register in game initialization
```javascript
WeaponOrchestrator.registerAllFromRegistry();
```

### Step 7: Add pickup in `src/pickup/pickup.js`
```javascript
MYWEAPON_AMMO: {
    weaponId: 'myweapon',
    ammoAmount: 15,
    spawnWeight: 0.3
}
```

### Step 8: Add tests in `src/weapon/weapon.test.js`
- Test config structure
- Test firing mechanics
- Test state management

---

## Fixing a Bug

### Step 1: Reproduce
- Read `.test-output/latest.json` for recent failures
- Identify the failing test or behavior

### Step 2: Locate
- Identify which domain owns the bug
- Read relevant `-orchestrator.js` file

### Step 3: Fix
- Make minimal change to fix the issue
- Don't refactor unrelated code

### Step 4: Verify
- Run domain tests: `bun run-tests.js --domain=<name>`
- Run specific test: `bun run-tests.js --test=<id>`

### Step 5: Confirm
- Check `.test-output/latest.json` shows pass

---

## Adding UI Element

### Step 1: Add HTML in `index.html`
```html
<div id="my-element">...</div>
```

### Step 2: Add styles in `src/styles/main.css`

### Step 3: Add logic in `src/ui/ui-orchestrator.js`
```javascript
updateMyElement(value) {
    const el = document.getElementById('my-element');
    if (el) el.textContent = value;
}
```

### Step 4: Call from game loop in `index.html`

### Step 5: Add UI tests in `tests/ui/`

---

## Releasing a Version

### Step 1: Update ALL version locations (5 files!)
| File | Location | Example |
|------|----------|---------|
| `index.html` | Line ~94, `.version` div | `VERSION 5.1` |
| `package.json` | Line 3, `version` field | `"5.1.0"` |
| `CLAUDE.md` | Line 3, header | `**Version 5.1**` |
| `README.md` | Version History section | `- **v5.1** - ...` |
| `docs/GAME_DESIGN.md` | Overview table | `| **Version** | 5.1 |` |

### Step 2: Run full test suite
```bash
bun run test
```
Note: `tests/ui/menu.tests.js` has a version format test that checks the main screen.

### Step 3: Manual smoke test (30 seconds)
1. Open index.html
2. Verify version shows on main menu
3. Click Start, shoot enemy, check score
4. ESC to pause, resume
5. No console errors

### Step 4: Commit and push
```bash
git add -A
git commit -m "Release vX.Y: <summary>"
git push
```
