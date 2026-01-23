# Mall Hell

A fast, chaotic first-person browser game where you're a mischievous kid in a shopping cart, armed with a slingshot, causing mayhem in a supermarket aisle.

**[Play Now](https://okohub.github.io/mall-hell/)** (if GitHub Pages enabled)

## How to Play

1. Open `index.html` in your browser
2. Select your preferred control scheme and camera mode
3. Click "START CHAOS"
4. Shoot enemies and obstacles to score points
5. Reach the checkout to win!

## Controls

### Classic Mode (Mouse + Keyboard)
| Input | Action |
|-------|--------|
| **A / D** or **Arrow Keys** | Dodge left/right |
| **Mouse** | Aim |
| **Click** | Fire |
| **ESC** | Pause |

### Arcade Mode (Full Keyboard)
| Input | Action |
|-------|--------|
| **A / D** | Dodge left/right |
| **Arrow Keys** | Move crosshair |
| **Space** | Fire |
| **ESC** | Pause |

## Camera Modes

- **First Person** - Hybrid FPS view with visible slingshot
- **Third Person** - Over-the-shoulder view showing cart and character

## Scoring

| Action | Points |
|--------|--------|
| Hit enemy cart | +100 |
| Destroy enemy cart | +300 |
| Hit obstacle | +150 |

## Features

- Two camera modes (FPS / Third-person)
- Two control schemes (Classic / Arcade)
- Acceleration-based dodge with cart leaning
- Auto-aim assist near crosshair
- Procedurally generated 3D environment
- No external assets - everything generated with code

## Tech Stack

- HTML5 / CSS3 / JavaScript
- Three.js (r128) for 3D rendering
- Single file, no build tools required
- Runs entirely in browser

## Development

```bash
# Run tests
node run-tests.js

# Or just open in browser
open index.html
```

## Version History

- **v1.6** - Third-person/FPS camera modes, improved collision detection, visual overhaul
- **v1.5** - Control scheme selector, arcade mode
- **v1.4** - Simplified arcade controls
- **v1.3** - Twin-stick controls

## License

MIT
