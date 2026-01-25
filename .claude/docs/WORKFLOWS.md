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
    // ... visual config
}
```

### Step 2: Create mesh in `src/enemy/enemy-mesh.js`
```javascript
createGhostMesh(THREE, config) {
    // Build the 3D model
}
```

### Step 3: Update dispatch in `EnemyVisual.createEnemy()`
```javascript
if (config.id === 'ghost') return this.createGhostMesh(THREE, config);
```

### Step 4: Update spawn logic in `EnemySystem.getSpawnType()`
```javascript
getSpawnType(score) {
    // Your spawn condition
    if (someCondition) return 'GHOST';
    return 'SKELETON';
}
```

### Step 5: Add tests
- Unit tests in `src/enemy/enemy.test.js`
- UI tests in `tests/ui/enemy.tests.js`

---

## Adding a New Weapon

### Step 1: Create weapon module `src/weapon/<weapon>.js`
Implement the weapon interface:
```javascript
const MyWeapon = {
    config: { id: 'myweapon', name: '...', ammo: 50, ... },
    state: { ... },
    theme: { ... },
    createMesh(THREE, materials) { ... },
    onFireStart(time) { ... },
    onFireRelease(time) { ... },
    update(dt, time) { ... },
    animateFPS(dt) { ... }
};
```

### Step 2: Register in `index.html`
```javascript
WeaponManager.register(MyWeapon);
```

### Step 3: Add pickup in `src/weapon/pickup.js`

### Step 4: Add tests in `src/weapon/weapon.test.js`

---

## Fixing a Bug

### Step 1: Reproduce
- Read `.test-output/latest.json` for recent failures
- Identify the failing test or behavior

### Step 2: Locate
- Identify which domain owns the bug
- Read relevant `-system.js` file

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

### Step 3: Add logic in `src/ui/ui-system.js`
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

### Step 1: Update version numbers
- `index.html` - VERSION display
- `package.json` - version field
- `CLAUDE.md` - Version line

### Step 2: Update version history
- `README.md`
- `.claude/docs/GAME_DESIGN.md`

### Step 3: Run full test suite
```bash
bun run test
```

### Step 4: Manual smoke test (30 seconds)
1. Open index.html
2. Click Start
3. Shoot, hit enemy, check score
4. ESC to pause, resume
5. No console errors

### Step 5: Commit
```bash
git add -A
git commit -m "Release vX.Y: <summary>"
```
