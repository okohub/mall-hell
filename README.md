# Mall Hell

A fast, chaotic first-person browser game where you're a mischievous kid in a shopping cart, armed with a slingshot, causing mayhem in a supermarket aisle.

**[Play Now](https://okohub.github.io/mall-hell/)** (if GitHub Pages enabled)

## How to Play

1. Open `index.html` in your browser
2. Click "START CHAOS"
3. Hold SPACE to charge your slingshot, release to fire
4. Dodge enemies and obstacles with A/D keys
5. Clear all enemies from the mall before time runs out!

## Controls

| Input | Action |
|-------|--------|
| **W / ↑** | Drive forward |
| **S / ↓** | Reverse |
| **A / ←** | Turn left (also aim) |
| **D / →** | Turn right (also aim) |
| **SPACE (hold)** | Charge slingshot |
| **SPACE (release)** | Fire projectile |
| **ESC** | Pause |

## Slingshot Mechanics

The slingshot uses a **tension system** - hold SPACE to charge up power:
- Quick tap = weak shot (minimum speed)
- Hold longer = more power (maximum speed)
- Visual indicator shows charge level around crosshair
- **Fixed crosshair** - aim by dodging left/right with A/D keys

## Scoring

| Action | Points |
|--------|--------|
| Hit enemy cart | +100 |
| Destroy enemy cart | +300 |
| Hit obstacle | +150 |

### Score Ratings

| Score | Rating |
|-------|--------|
| 0-800 | Mild Mischief |
| 801-2000 | Rowdy Kid |
| 2001-4000 | Troublemaker |
| 4001-7000 | Chaos Master |
| 7001-10000 | Total Mayhem! |
| 10001+ | LEGENDARY CHAOS! |

## Features

- First-person view with visible slingshot weapon
- Tension-based shooting mechanic (hold to charge)
- Fixed crosshair aiming - dodge to aim, projectiles handle hit detection
- Acceleration-based dodge with cart leaning
- Player health system with damage and invulnerability
- Procedurally generated 3D supermarket environment
- Enemy carts with health bars and AI behavior
- Three obstacle types: stacks, barrels, and displays
- Particle effects on destruction
- No external assets - everything generated with code

## Tech Stack

- HTML5 / CSS3 / JavaScript
- Three.js (r128) for 3D rendering
- Domain-driven architecture with modular code
- Runs entirely in browser

## Development

```bash
# Install dependencies
bun install

# Run all tests (unit + UI in parallel)
bun run test

# Run unit tests only
bun run test:unit

# Run UI tests only
bun run test:ui

# Run unit tests in quiet mode
bun run test:quick

# Run specific test group
bun run-tests.js --group=weapon

# Run specific test
bun run-tests.js --test=<test-id>

# Start local server
bun run serve

# Or just open in browser
open index.html
```

## Project Structure

```
mall-hell/
├── index.html              # Main game file
├── src/
│   ├── weapon/             # Weapon domain (data, visual, system, tests)
│   ├── projectile/         # Projectile domain
│   ├── enemy/              # Enemy domain
│   └── environment/        # Environment domain (obstacles, shelves)
├── tests/
│   ├── unit-tests.html     # Unit test runner
│   └── ui-tests.html       # UI/integration tests
└── .baselines/             # Visual regression baselines
```

## Version History

- **v5.0** - Live minimap with enemy counts, lazy room loading, unified status panel, improved performance
- **v4.5** - NO AMMO display, distinctive ammo crate visuals, center display collision fix
- **v4.4** - Slingshot limited ammo, water splash damage, laser beam visuals, runtime pickup spawning
- **v4.3** - Weapon redesign: Laser Blaster (rapid-fire energy), Water Blaster (arcing splash damage), balanced weapon roles
- **v4.2.1** - Analytics integration: provider-agnostic tracking system with detailed game events
- **v4.2** - Multi-weapon system, weapon/ammo pickups, continuous enemy spawning, projectile wall collision
- **v4.1** - Fixed crosshair aiming (removed auto-aim), simplified controls, improved shooting experience
- **v4.0** - Smart enemy AI (home-return behavior), config-driven architecture, improved collision system
- **v3.3** - Skeleton enemy with creepy backwards-facing joker skull, fixed movement AI
- **v3.2** - Domain-driven architecture, separated test commands
- **v3.1** - Menu redesign, aim-assist improvements, enhanced test suite
- **v3.0** - Slingshot tension/power mechanic, FPS-only camera with visible weapon
- **v1.9** - Bug fixes, code quality tests
- **v1.6** - Third-person/FPS camera modes, improved collision detection
- **v1.5** - Control scheme selector, arcade mode
- **v1.4** - Simplified arcade controls

## License

All rights reserved.
