# Score Levels Redesign

**Date:** 2026-01-27
**Version:** 5.5+

## Overview

Redesign score rating system to reflect actual gameplay ranges (3000-35000) and new thematic direction: player is descending into Mall Hell as a demon-slaying hero, not causing chaos.

## Theme Shift

**Old:** Kid causing mischief/chaos in mall
**New:** Kid entering Mall Hell (like Dante) to fight chaos and demons

Rating names should blend:
- Descent into hell (depth/progression)
- Growing fearsome reputation (demons fearing you)

## Problems with Current System

1. **Thresholds too compressed:** Players level up too quickly
2. **Top tier too low:** Cap at 10,000+ but skilled players reach 20,000-35,000
3. **Uneven distribution:** Some gaps feel right, others don't
4. **Theme mismatch:** "Chaos/mischief" theme doesn't match hell-descent narrative

## Player Score Ranges

- **Beginner players:** 3000-8000
- **Skilled players:** 20,000-35,000
- **Below 3000:** Tutorial/warmup tier

## New Tier Structure

**8 tiers with accelerating gaps:**

| Score Range | Tier Name | Theme/Meaning |
|-------------|-----------|---------------|
| 0 - 1,500 | **Window Shopper** | Just walked in, barely trying |
| 1,501 - 3,000 | **Lost in IKEA** | Still wandering, not serious yet |
| 3,001 - 6,000 | **Mall Diver** | Entering the depths, real game begins |
| 6,001 - 10,000 | **Cart Warrior** | Fighting back the chaos |
| 10,001 - 15,000 | **Demon Buster** | Making demons fear you |
| 15,001 - 21,000 | **Abyss Hunter** | Deep in hell, thriving |
| 21,001 - 28,000 | **Hell's Nightmare** | The demons fear YOU now |
| 28,001+ | **MALL REDEEMER** | Legendary demon slayer status |

## Progression Philosophy

**Below 3000:** "No brain" tiers - humorous, not real achievements
**3000-15000:** Core progression - beginner to competent
**15000-28000:** Skilled player territory - becoming legendary
**28000+:** Elite tier - open-ended for mastery

## Implementation Notes

**Files to update:**
- `src/ui/ui.js` - Update `scoreRatings` array
- `.claude/docs/GAME_DESIGN.md` - Update scoring table
- Any tests that verify score ratings

**Data structure:**
```javascript
scoreRatings: [
    { threshold: 28000, rating: 'MALL REDEEMER' },
    { threshold: 21000, rating: "Hell's Nightmare" },
    { threshold: 15000, rating: 'Abyss Hunter' },
    { threshold: 10000, rating: 'Demon Buster' },
    { threshold: 6000, rating: 'Cart Warrior' },
    { threshold: 3000, rating: 'Mall Diver' },
    { threshold: 1500, rating: 'Lost in IKEA' },
    { threshold: 0, rating: 'Window Shopper' }
]
```

## Success Criteria

- [ ] Score progression feels rewarding across 3-minute session
- [ ] Beginners see 2-3 tier increases per game
- [ ] Skilled players have meaningful tiers to chase (21k, 28k+)
- [ ] Rating names reflect hell-descent theme
- [ ] Top tier remains aspirational but achievable
