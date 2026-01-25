# Testing Guide

## Quick Reference

| Command | Use When |
|---------|----------|
| `bun run-tests.js --failed` | Re-run only failed tests |
| `bun run-tests.js --domain=<name>` | Changed a specific domain |
| `bun run-tests.js --group=<name>` | Test specific feature group |
| `bun run-tests.js --test=<id>` | Test single test by ID |
| `bun run-tests.js --fail-fast` | Stop on first failure |
| `bun run test` | Full suite (only when user asks) |

## Workflow Rules

### Before Running Tests
1. Read `.test-output/latest.json` first
2. Check what failed in the last run
3. Only run tests if you made code changes

### Run Only Related Tests
- Changed enemy code? → `--domain=enemy`
- Changed specific feature? → `--test=<test-id>`
- Re-run failures? → `--failed`

### One Test Run Per Change
- Make your fix
- Run specific test(s) ONCE
- Read the output file
- DO NOT re-run unless you made another change

## Test Output

Results saved to `.test-output/`:
- `latest.json` - Most recent results
- `latest.txt` - Console output
- `run-<timestamp>.json` - History

## Writing Tests

### Unit Tests
- Location: `src/<domain>/<domain>.test.js`
- Register in: `tests/unit-tests.html`

### UI Tests
- Location: `tests/ui/<domain>.tests.js`
- Register in: `tests/ui-tests.html`

### Critical Patterns

**Use managers/systems, not specific implementations:**
```javascript
// GOOD - weapon agnostic
WeaponManager.currentWeapon.state.lastFireTime = 0;

// BAD - couples to specific weapon
Slingshot.state.lastFireTime = 0;
```

**Same principle for all domains:**
- Use `EntitySystem`, not specific entity arrays
- Use `StateSystem`, not direct state manipulation
- Use `EnemySystem.getSpawnType()`, not hardcoded types
