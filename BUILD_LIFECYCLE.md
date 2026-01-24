# Mall Hell - Build and Release Lifecycle

## Overview

This document defines the complete build and release lifecycle for Mall Hell. All contributors must follow these procedures to ensure quality and stability.

---

## 1. Build Stages

### Stage 1: Development

**Purpose:** Active feature development and bug fixes

**Environment:** Local browser (Chrome DevTools open)

**Entry Criteria:**
- Working copy of `index.html`
- CLAUDE.md reviewed for requirements

**Exit Criteria:**
- Code compiles (no syntax errors)
- Feature/fix implemented
- Self-tested in browser
- No console errors

**Duration:** Variable (hours to days)

---

### Stage 2: Testing

**Purpose:** Systematic validation against acceptance criteria

**Environment:** Multiple browsers (Chrome, Firefox, Safari)

**Entry Criteria:**
- Development stage completed
- All pre-commit checks passed

**Exit Criteria:**
- Quick Smoke Test passed (30 seconds)
- Full Playthrough Test passed (3-5 minutes)
- All relevant AC items verified
- No console errors or warnings

**Duration:** 15-30 minutes per change

---

### Stage 3: Staging

**Purpose:** Extended validation and performance testing

**Environment:** Fresh browser session, incognito mode

**Entry Criteria:**
- Testing stage completed
- No known issues

**Exit Criteria:**
- Stress Test passed (5 minutes)
- Memory usage stable over 5 minutes
- FPS maintains ~60 (never below 30)
- All AC12 (Performance) criteria met
- AC13 (Restart/Reset) fully verified
- AC14 (Edge Cases) fully verified

**Duration:** 30-60 minutes

---

### Stage 4: Release

**Purpose:** Final validation and distribution

**Environment:** Clean download, multiple machines if available

**Entry Criteria:**
- Staging stage completed
- Release checklist completed
- Version number updated in code

**Exit Criteria:**
- File distributed/deployed
- Release notes documented
- Previous version archived

**Duration:** 15 minutes

---

## 2. Quality Gates

### Gate 1: Development -> Testing

| Check | Requirement |
|-------|-------------|
| Syntax | File opens without JavaScript errors |
| Console | No errors logged on page load |
| Basic Function | Game reaches MENU state |
| Change Scope | Only intended changes made |

### Gate 2: Testing -> Staging

| Check | Requirement |
|-------|-------------|
| AC1: Build & Load | All items verified |
| AC2: Game States | All transitions work |
| AC10: UI/HUD | All elements display correctly |
| Browser Compat | Works in Chrome, Firefox, Safari |
| Smoke Test | Passed in all target browsers |

### Gate 3: Staging -> Release

| Check | Requirement |
|-------|-------------|
| AC3-AC9 | All gameplay criteria verified |
| AC11: Environment | All visual elements correct |
| AC12: Performance | 60 FPS, no memory leaks |
| AC13: Restart | Clean reset verified |
| AC14: Edge Cases | All edge cases handled |
| Full Playthrough | Completed without issues |
| Stress Test | 5 minutes stable |

---

## 3. Pre-Commit Checks

Before making ANY code change, verify:

### Automated Tests (REQUIRED)

```bash
# Run domain-specific tests if you changed a domain
bun run-tests.js --domain=<domain>   # e.g., --domain=weapon

# Run UI tests if you changed UI or gameplay
bun run test:ui

# Run all tests only when explicitly requested
bun run test
```

### Mandatory Checks

```
[ ] 1. Domain tests pass: bun run-tests.js --domain=<affected>
[ ] 2. UI tests pass (if applicable): bun run test:ui
[ ] 3. File opens in browser without errors
[ ] 4. Console shows no errors on load
[ ] 5. Game starts when Start button clicked
[ ] 6. Projectiles fire on SPACE release
[ ] 7. ESC pauses the game
[ ] 8. Score increases on hits
```

### Verification Commands (Browser Console)

```javascript
// Check for errors
console.error.length === 0

// Verify game state system loaded
typeof GameState !== 'undefined'

// Verify domain systems loaded
typeof WeaponSystem !== 'undefined'
typeof EnemySystem !== 'undefined'

// Verify Three.js loaded
typeof THREE !== 'undefined'

// Check FPS (during gameplay)
// Should show ~60
```

### Pre-Commit Checklist

```
[ ] Code change is isolated and minimal
[ ] No unrelated changes included
[ ] Domain pattern followed (data → theme → mesh → system)
[ ] Constants added to <domain>.js, not hardcoded
[ ] UI changes use UI module, not direct DOM manipulation
[ ] No console.log statements left in (except errors)
[ ] Tested in at least one browser
[ ] All mandatory checks passed
```

---

## 4. Feature Development Flow

### Step 1: Planning

1. Review CLAUDE.md for relevant requirements
2. Identify which domain(s) will be affected
3. Read existing domain files to understand patterns
4. Determine scope of changes
5. Identify potential risks

### Step 2: Implementation

Follow the domain-driven architecture:

1. **Add constants** to `src/<domain>/<domain>.js`
2. **Add visual styling** to `src/<domain>/<domain>-theme.js`
3. **Add mesh creation** to `src/<domain>/<domain>-mesh.js`
4. **Add logic/state** to `src/<domain>/<domain>-system.js`
5. **Add tests** to `src/<domain>/<domain>.test.js`
6. **Update index.html** only for orchestration (if needed)

**Key rules:**
- Use `Materials` library for shared materials
- Use `UI` module for all UI operations
- Pass THREE.js as parameter to mesh functions
- Keep state in system files, not index.html

### Step 3: Self-Testing

```bash
# Run domain tests first
bun run-tests.js --domain=<affected-domain>

# Run UI tests if UI changed
bun run test:ui

# Check latest results
cat .test-output/latest.json | jq '.summary'
```

### Step 4: Validation

Execute the following test sequence:

```
1. Quick Smoke Test
   - Open fresh browser tab
   - Load index.html
   - Click Start
   - Play for 30 seconds
   - Pause and Resume
   - Verify new feature works

2. Regression Check
   - Complete a full playthrough
   - Verify all existing features still work
   - Check score system
   - Verify game over screen
   - Test restart functionality
```

### Step 5: Documentation

1. Note what was changed
2. Update domain file comments if needed
3. If feature changes CLAUDE.md requirements, update it
4. If new domain created, add to CLAUDE.md file structure

---

## 5. Bug Fix Flow

### Step 1: Reproduction

1. Document exact steps to reproduce bug
2. Identify which AC item is violated
3. Note browser and conditions

```
Bug Report Template:
- Description: [What's wrong]
- Steps to Reproduce: [1, 2, 3...]
- Expected Behavior: [What should happen]
- Actual Behavior: [What happens]
- AC Violated: [AC#]
- Browser: [Chrome/Firefox/Safari]
```

### Step 2: Diagnosis

1. Open browser DevTools
2. Check console for errors
3. Use breakpoints to trace issue
4. Identify root cause

### Step 3: Fix Implementation

1. Create backup of current `index.html`
2. Implement minimal fix
3. Avoid changing unrelated code
4. Add defensive checks if appropriate

### Step 4: Verification

1. Verify bug is fixed
2. Verify fix doesn't break other features
3. Run pre-commit checks
4. Test in multiple browsers if browser-specific

### Step 5: Regression Testing

```
[ ] Bug no longer reproduces
[ ] Quick Smoke Test passes
[ ] Related features still work
[ ] No new console errors
[ ] Score system unaffected
[ ] Game state transitions work
[ ] Restart works correctly
```

---

## 6. Release Checklist

### Pre-Release Verification

```
CRITICAL - ALL MUST PASS
==========================

[ ] AC1: Build & Load
    [ ] Single index.html file
    [ ] No external dependencies (except Three.js CDN)
    [ ] Opens in Chrome without errors
    [ ] Opens in Firefox without errors
    [ ] Opens in Safari without errors
    [ ] No console errors on load
    [ ] No console warnings (game-related)
    [ ] Three.js renders within 2 seconds

[ ] AC2: Game State Management
    [ ] MENU -> PLAYING (Start button)
    [ ] PLAYING -> PAUSED (ESC)
    [ ] PAUSED -> PLAYING (ESC or Resume)
    [ ] PAUSED -> MENU (Quit)
    [ ] PLAYING -> GAME_OVER (reach checkout)
    [ ] GAME_OVER -> PLAYING (Play Again)

[ ] AC3-AC9: Core Gameplay
    [ ] Controls responsive
    [ ] Projectiles work correctly
    [ ] Enemies behave correctly
    [ ] Obstacles behave correctly
    [ ] Collisions detected
    [ ] Scoring works

[ ] AC10-AC11: UI & Environment
    [ ] All UI elements display
    [ ] All environment renders

[ ] AC12: Performance
    [ ] 60 FPS maintained
    [ ] No drops below 30 FPS
    [ ] Memory stable over 5 minutes

[ ] AC13: Restart/Reset
    [ ] Clean restart verified

[ ] AC14: Edge Cases
    [ ] Rapid clicking handled
    [ ] Pause/resume smooth
    [ ] Window resize handled
```

### Final Steps

```
[ ] Version number updated in game
[ ] Full playthrough completed
[ ] Stress test completed
[ ] Backup of release version created
[ ] Release notes prepared
```

### Release Notes Template

```
Mall Hell v[X.X]
Release Date: [YYYY-MM-DD]

Changes:
- [Change 1]
- [Change 2]

Bug Fixes:
- [Fix 1]
- [Fix 2]

Known Issues:
- [Issue 1]

Tested On:
- Chrome [version]
- Firefox [version]
- Safari [version]
```

---

## 7. Rollback Procedure

### When to Rollback

- Critical bug discovered in release
- Performance regression
- Game-breaking issue
- Multiple AC items failing

### Rollback Steps

#### Immediate Response (< 5 minutes)

1. **Stop distribution** of problematic version
2. **Identify** the last known good version
3. **Restore** from backup:
   ```
   # Assuming backups are named with dates
   cp index.html index.html.broken
   cp index.html.backup index.html
   ```

#### Verification (5-10 minutes)

4. **Test** restored version:
   ```
   [ ] File opens without errors
   [ ] Quick Smoke Test passes
   [ ] Original issue not present
   ```

5. **Distribute** restored version if applicable

#### Post-Rollback (30 minutes)

6. **Document** the issue:
   ```
   Rollback Report:
   - Date/Time: [When]
   - Broken Version: [Which]
   - Restored Version: [Which]
   - Issue: [What went wrong]
   - Root Cause: [Why]
   - Prevention: [How to avoid]
   ```

7. **Analyze** the broken version:
   - What change caused the issue?
   - Why wasn't it caught in testing?
   - What test should be added?

8. **Plan** the fix:
   - Fix in development
   - Enhanced testing
   - Re-release when ready

### Backup Strategy

Maintain these backups:

| Backup | Description | Retention |
|--------|-------------|-----------|
| `index.html.backup` | Previous stable version | Always keep |
| `index.html.v[X.X]` | Each release version | Keep all releases |
| `index.html.pre-[feature]` | Before major changes | Until feature stable |

### Rollback Decision Matrix

| Severity | Impact | Action |
|----------|--------|--------|
| Critical | Game won't load | Immediate rollback |
| Critical | Game crashes during play | Immediate rollback |
| High | Major feature broken | Rollback within 1 hour |
| Medium | Minor feature broken | Fix forward if quick |
| Low | Visual glitch | Fix forward |

---

## Quick Reference

### Daily Development Checklist

```
Before coding:
[ ] Review CLAUDE.md requirements
[ ] Identify affected domain(s)
[ ] Read domain files to understand patterns

While coding:
[ ] Follow domain pattern (data → theme → mesh → system)
[ ] Add tests as you go
[ ] Check console for errors

After coding:
[ ] Run domain tests: bun run-tests.js --domain=<name>
[ ] Run UI tests if needed: bun run test:ui
[ ] Quick Smoke Test
[ ] Commit/save changes
```

### Test Sequence Summary

```
1. Domain Tests: bun run-tests.js --domain=<name>
2. UI Tests (if applicable): bun run test:ui
3. Quick Smoke Test (30 sec)
4. Full Playthrough Test (5 min)
5. Stress Test (5 min) - for releases only
```

### Domain Quick Reference

| Domain | Files | Purpose |
|--------|-------|---------|
| engine | game-state, game-loop, input, collision | Core systems |
| shared | materials.js | Shared Three.js materials |
| ui | ui.js | HUD, menus, score display |
| room | room, room-theme, room-mesh, room-system | Level/room management |
| player | player, player-theme, player-mesh, player-system | Player cart |
| weapon | weapon, weapon-theme, weapon-mesh, weapon-system | Slingshot |
| projectile | projectile-* | Slingshot stones |
| enemy | enemy-* | Enemy carts |
| environment | obstacle-*, shelf-*, environment-system | Obstacles, shelves |

### Emergency Contacts

If critical issue found:
1. Stop and document the issue
2. Rollback if in production
3. Do not attempt rushed fixes
4. Follow Bug Fix Flow properly

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Initial | Document created |
| 2.0 | 2026-01-24 | Updated for DDD architecture, added domain quick reference |
