# Game Design

## Overview

| Attribute | Value |
|-----------|-------|
| **Title** | Mall Hell |
| **Version** | 5.9 |
| **Genre** | Arcade Score-Chaser / Hell Crawler |
| **Session** | 3 minutes |
| **Objective** | Clear Mall Hell of all enemies before time expires |

## Core Loop

```
EXPLORE → HUNT → KILL → SCORE → REPEAT
    ↑                              ↓
    └──────── CLEAR ROOMS ←────────┘
```

## Controls

| Input | Action |
|-------|--------|
| W / ↑ | Drive forward |
| S / ↓ | Reverse |
| A / ← | Turn left (aim) |
| D / → | Turn right (aim) |
| SPACE (hold) | Charge weapon |
| SPACE (release) | Fire |
| ESC | Pause |

---

## Enemies

### Skeleton (Base)

| Stat | Value |
|------|-------|
| Health | 4 hits |
| Speed | 0.30 |
| Damage | 25 HP |
| Score (hit) | +150 |
| Score (destroy) | +400 |

- 2-3 per room at game start
- Never respawn when killed

### Dinosaur (Boss)

| Stat | Value |
|------|-------|
| Health | 10 hits |
| Speed | 0.25 |
| Damage | 40 HP |
| Score (hit) | +250 |
| Score (destroy) | +1500 |

- First spawn at 5000 points
- Additional every 5000 points
- Shows "DINO BOSS!" warning

---

## Weapons

| Weapon | Ammo | Damage | Charge Time | Special |
|--------|------|--------|-------------|---------|
| Slingshot | 25 | 1 base, +3 per charge<br>Quick: 1, Half: 2, Full: 4 | 2.0s to full charge<br>minTension: 0.05 | Skill-based workhorse, rewards patience |
| Nerf Gun | 12 | 3 flat | N/A | Reliable sidearm, 20% faster projectiles (120 speed) |
| Water Gun | 30 | 2 direct, 3 splash | N/A | Crowd control, 50% stronger AOE |
| Laser Gun | 75 | 1 per shot | N/A | Power weapon, melts 18 skeletons per magazine |

---

## Power-Ups

### Speed Boost

| Stat | Value |
|------|-------|
| Effect | 2x movement speed |
| Duration | 10 seconds |
| Spawn Chance | 25% per room |
| Visual | Red/yellow energy drink can |

- Temporary speed increase for aggressive room clearing
- Refreshes timer if collected while already boosted (doesn't stack)
- HUD timer shows remaining duration with color warnings

---

## Player

| Stat | Value |
|------|-------|
| Max Health | 100 HP |
| Move Speed | 25 units/sec |
| Dodge Speed | 8 units/sec |
| Invulnerability | 1 sec after hit |

---

## Scoring

| Score Range | Rating |
|-------------|--------|
| 0 - 1,500 | Window Shopper |
| 1,501 - 3,000 | Lost in IKEA |
| 3,001 - 6,000 | Mall Diver |
| 6,001 - 10,000 | Cart Warrior |
| 10,001 - 15,000 | Demon Buster |
| 15,001 - 21,000 | Abyss Hunter |
| 21,001 - 28,000 | Hell's Nightmare |
| 28,001+ | MALL REDEEMER |

**Theme:** You're descending into Mall Hell as a demon-slaying hero. Ratings blend your descent depth with growing fearsome reputation.

---

## HUD Elements

| Element | Position | Purpose |
|---------|----------|---------|
| Score | Top-left | Chaos score |
| Timer | Top-center | Time remaining |
| Status Panel | Top-right | Enemy progress + minimap |
| Health | Bottom-left | Current HP |
| Ammo | Bottom-center | Weapon + ammo count |
| Crosshair | Center | Aiming reticle |

### Minimap Legend

| Visual | Meaning |
|--------|---------|
| Yellow border | Current room |
| Red + number | Enemies in room |
| Orange pulse | Dinosaur in room |
| Subtle green | Cleared room |

---

## Spawn System

### Lazy Room Loading
- All rooms planned at game start (data only)
- Meshes created when player approaches room
- Eliminates game start lag

### Per Room
- Enemies: 2-3 skeletons
- Obstacles: 3-5
- Pickups: 0-1 weapon/ammo

### No Respawning
- Killed enemies stay dead
- "Clear the Mall" design philosophy
- Rooms can be completed

---

## Design Decisions

### Why No Respawning?
Random spawning creates frustration. Permanent progress feels rewarding and lets players strategize.

### Why Score-Based Dinosaurs?
Prevents late-game boredom. Aggressive play is rewarded with harder enemies.
