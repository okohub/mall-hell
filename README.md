# Mall Hell

A fast, chaotic first-person browser game where you're a mischievous kid in a shopping cart, armed with a slingshot, causing mayhem in a supermarket aisle.

**[Play Now](https://okohub.github.io/mall-hell/)** (if GitHub Pages enabled)

## How to Play

1. Open `index.html` in your browser
2. Click "START CHAOS"
3. Hold SPACE to charge your slingshot, release to fire
4. Dodge enemies and obstacles with A/D keys
5. Reach the checkout to win!

## Controls

| Input | Action |
|-------|--------|
| **A / D** | Dodge left/right |
| **Arrow Keys** | Aim crosshair |
| **SPACE (hold)** | Charge slingshot |
| **SPACE (release)** | Fire projectile |
| **ESC** | Pause |

## Slingshot Mechanics

The slingshot uses a **tension system** - hold SPACE to charge up power:
- Quick tap = weak shot (minimum speed)
- Hold longer = more power (maximum speed)
- Visual indicator shows charge level around crosshair
- Aim-assist helps lock onto nearby targets

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
- Aim-assist that locks onto nearby targets
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
- Single file, no build tools required
- Runs entirely in browser

## Development

```bash
# Run all tests
bun run test

# Run specific test
bun run-tests.js --test=<test-id>

# Run test group
bun run-tests.js --group=menu

# Update visual baselines (only after intentional UI changes)
bun run-tests.js --update-baselines

# Or just open in browser
open index.html
```

## Version History

- **v3.1** - Menu redesign, aim-assist improvements, enhanced test suite
- **v3.0** - Slingshot tension/power mechanic, FPS-only camera with visible weapon
- **v1.9** - Bug fixes, code quality tests
- **v1.6** - Third-person/FPS camera modes, improved collision detection
- **v1.5** - Control scheme selector, arcade mode
- **v1.4** - Simplified arcade controls

## License

All rights reserved.
