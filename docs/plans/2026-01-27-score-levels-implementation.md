# Score Levels Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update score rating system from 6 tiers (0-10k) to 8 tiers (0-28k+) with hell-descent theme.

**Architecture:** Update UI constants, documentation, and verify existing usage points handle new thresholds correctly.

**Tech Stack:** Vanilla JavaScript, no tests exist for score ratings

---

## Task 1: Update UI Score Ratings

**Files:**
- Modify: `src/ui/ui.js:28-35`

**Step 1: Update scoreRatings array**

Replace the existing `scoreRatings` array with new 8-tier system:

```javascript
// ==========================================
// SCORE RATINGS
// ==========================================
// Score thresholds for rating text (checked in descending order)
scoreRatings: [
    { threshold: 28000, rating: 'MALL REDEEMER' },
    { threshold: 21000, rating: "Hell's Nightmare" },
    { threshold: 15000, rating: 'Abyss Hunter' },
    { threshold: 10000, rating: 'Demon Buster' },
    { threshold: 6000, rating: 'Cart Warrior' },
    { threshold: 3000, rating: 'Mall Diver' },
    { threshold: 1500, rating: 'Lost in IKEA' },
    { threshold: 0, rating: 'Window Shopper' }
],
```

**Step 2: Verify getScoreRating logic still works**

Read the existing `getScoreRating` method at `src/ui/ui.js:54-61` to confirm it correctly handles the new thresholds. The logic should work unchanged since it iterates descending thresholds.

**Step 3: Manual smoke test**

Run the game and check that ratings display correctly:
- Score 0: "Window Shopper"
- Score 1500: "Lost in IKEA"
- Score 3000: "Mall Diver"
- Score 28000+: "MALL REDEEMER"

Open browser console and test directly:
```javascript
UI.getScoreRating(0)     // "Window Shopper"
UI.getScoreRating(1500)  // "Lost in IKEA"
UI.getScoreRating(3000)  // "Mall Diver"
UI.getScoreRating(28000) // "MALL REDEEMER"
```

**Step 4: Commit**

```bash
git add src/ui/ui.js
git commit -m "feat: update score ratings to 8-tier hell-descent system

- Expand from 6 tiers (0-10k) to 8 tiers (0-28k+)
- New theme: Mall Hell descent (Window Shopper → Mall Redeemer)
- Accelerating gaps match actual gameplay (3k-35k range)
- Two warmup tiers below 3k for beginners

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Game Design Documentation

**Files:**
- Modify: `.claude/docs/GAME_DESIGN.md:88-98`

**Step 1: Replace scoring table**

Update the scoring section with new tier structure:

```markdown
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
```

**Step 2: Update game overview if needed**

Check if the overview section at `.claude/docs/GAME_DESIGN.md:3-11` mentions the chaos theme. If it does, update to reflect hell-descent theme:

```markdown
| **Genre** | Arcade Score-Chaser / Hell Crawler |
| **Objective** | Clear Mall Hell of all enemies before time expires |
```

**Step 3: Commit**

```bash
git add .claude/docs/GAME_DESIGN.md
git commit -m "docs: update score ratings to match hell-descent theme

- Replace 6-tier chaos theme with 8-tier hell-descent
- Document theme shift: chaos-maker → demon-slaying hero
- Match thresholds from ui.js implementation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update Root README (if exists)

**Files:**
- Check: `README.md`
- Modify if score ratings are mentioned

**Step 1: Search for score references**

```bash
grep -i "score.*rating\|mild mischief\|legendary chaos" README.md
```

**Step 2: Update if found**

If README mentions old score tiers, update to match new system. Otherwise skip this task.

**Step 3: Commit if changed**

```bash
git add README.md
git commit -m "docs: update README score ratings

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Verify Integration Points

**Files:**
- Read: `src/engine/game-session.js:106`
- Read: `index.html` (search for UI.getScoreRating usage)

**Step 1: Confirm game-session.js usage**

Read `src/engine/game-session.js` around line 106 to verify it calls `UI.getScoreRating(this._score)` and passes result to UIOrchestrator. No changes needed, just verification.

**Step 2: Check index.html usage**

Search index.html for any direct scoreRatings or getScoreRating usage. Verify no hardcoded thresholds exist.

**Step 3: Manual end-to-end test**

Play a full game session:
1. Start game
2. Kill enemies to reach different score thresholds
3. Verify rating updates in UI at: 1.5k, 3k, 6k, 10k, 15k, 21k, 28k
4. End game and verify correct rating shows in game over screen

**Step 4: Document completion**

No commit needed. Confirm all integration points work correctly with new thresholds.

---

## Success Criteria

- [ ] `src/ui/ui.js` has 8 tiers with correct thresholds
- [ ] `.claude/docs/GAME_DESIGN.md` documents new system
- [ ] `UI.getScoreRating()` returns correct ratings for all thresholds
- [ ] Game over screen displays new ratings correctly
- [ ] No console errors during gameplay
- [ ] Manual test shows smooth progression through tiers

## Notes

- **No tests exist** for score ratings - rely on manual testing
- **No breaking changes** - getScoreRating logic unchanged, just data
- **Theme consistency** - ensure all docs reflect hell-descent theme
