# Mall Hell - Automated Playtest System

An AI-powered playtesting agent that simulates different player skill levels, collects gameplay metrics, and provides actionable feedback for game improvement.

## Quick Start

```bash
# Run default playtest (Novice, Average, Skilled profiles)
bun run playtest

# Run all profiles
bun run playtest:all

# Watch the game being played (not headless)
bun run playtest:watch
```

## Features

### Player Profiles

The system simulates 6 different player types:

| Profile | Description | Behavior |
|---------|-------------|----------|
| **NOVICE** | First-time player | Slow reactions (400-800ms), rarely charges shots, poor accuracy |
| **AVERAGE** | Casual gamer | Moderate reactions (200-400ms), sometimes charges, basic dodging |
| **SKILLED** | Experienced player | Quick reactions (100-250ms), uses charged shots strategically |
| **EXPERT** | Competitive player | Fast reactions (50-150ms), optimal charge usage, strategic targeting |
| **CHAOTIC** | Stress tester | Random inputs to test edge cases and input handling |
| **AFK** | Idle player | Minimal input to test timeout and idle behaviors |

### Metrics Collected

**Performance**
- FPS samples (average, min, max, stability)
- Entity counts over time
- Memory snapshots (when available)

**Combat**
- Shots fired, accuracy percentage
- Charge power usage patterns
- Enemies killed, obstacles hit
- Damage dealt per weapon

**Survival**
- Total damage taken
- Death count and causes
- Time spent at low health
- Damage rate analysis

**Movement**
- Total distance traveled
- Lateral movement (dodging)
- Wall bump frequency
- Average speed

**Engagement**
- Score progression
- Game completion percentage
- Pause frequency
- Session duration

### Feedback Analysis

The analyzer evaluates gameplay against baselines and generates:

1. **Category Scores** (1-10): Performance, Difficulty, Engagement, Combat, Survival, Movement
2. **Issues**: Critical, Warning, Minor - with specific messages and suggestions
3. **Positives**: What's working well
4. **Recommendations**: Prioritized list of improvements

## Command Line Options

```bash
bun playtest/playtest-runner.js [options]

Options:
  --profile=NAME    Test specific profile(s), comma-separated
                    Example: --profile=NOVICE,EXPERT
  --all             Test all 6 profiles
  --runs=N          Number of runs per profile (default: 1)
  --show            Show browser window (not headless)
  --verbose, -v     Verbose output during playtest
  --help, -h        Show help message
```

## Output Files

Results are saved to `.playtest-output/`:

| File | Description |
|------|-------------|
| `latest.json` | Most recent full report |
| `latest.txt` | Most recent text summary |
| `playtest-<timestamp>.json` | Timestamped JSON report |
| `playtest-<timestamp>.txt` | Timestamped text summary |

## Example Output

```
=== PLAYTEST SUMMARY ===

--- Average (Casual player with some gaming experience) ---

Run 1:
  Score: 2450 (1225/min)
  Completion: 45.2%
  End: died
  Duration: 120.3s
  Combat:
    - Shots: 48
    - Accuracy: 42.5%
    - Kills: 6
  Survival:
    - Damage: 120
    - Deaths: 1
  Rating: 7.2/10
  Warnings:
    * Player died early (45% completion)
    * Low charge usage (35%) - players not using charge mechanic
  Positives:
    + Good hit accuracy (42%) - combat feels balanced
    + Good scoring rate (1225/min) keeps gameplay rewarding

=== TOP RECOMMENDATIONS ===
1. Make charged shots more rewarding or add visual feedback for charging (mentioned 3x)
2. Consider reducing enemy damage, spawn rates, or adding health pickups (mentioned 2x)
```

## Architecture

```
playtest/
├── playtest-runner.js    # Main orchestrator (runs in Bun/Node)
├── player-agent.js       # AI agent that plays the game
├── player-profiles.js    # Skill level definitions
├── metrics-collector.js  # Data collection during gameplay
├── feedback-analyzer.js  # Post-game analysis engine
└── README.md            # This file
```

## Integration with Game

The playtest system uses the existing test infrastructure:
- Puppeteer for browser automation
- `window.__gameInternals` for state access
- Synthetic DOM events for input simulation

## Extending

### Add a New Profile

Add to `player-profiles.js`:

```javascript
MY_PROFILE: {
    name: 'My Profile',
    description: 'Custom player behavior',
    reactionTime: { min: 150, max: 300 },
    movement: {
        dodgeChance: 0.5,
        dodgeDuration: { min: 200, max: 500 },
        constantForward: true,
        turnFrequency: 0.2
    },
    shooting: {
        fireRate: 0.6,
        chargeTime: { min: 300, max: 700 },
        aimAccuracy: 0.6,
        panicFire: false
    },
    decisions: {
        targetPriority: 'enemies',
        healthAwareness: 0.7,
        pickupAwareness: 0.7
    }
}
```

### Add New Metrics

Add collection logic in `metrics-collector.js`:

```javascript
recordCustomEvent(data) {
    this.customMetrics.push({
        time: Date.now() - this.sessionStart,
        ...data
    });
    this.logEvent('custom_event', data);
}
```

### Add New Analysis Rules

Add to `feedback-analyzer.js` in the appropriate category method:

```javascript
if (metrics.customMetric > threshold) {
    score -= 2;
    feedback.issues.push({
        severity: 'warning',
        category: 'custom',
        message: 'Description of the issue',
        suggestion: 'How to fix it'
    });
}
```

## Research Background

This system is inspired by research on automated game playtesting:

- **TITAN Framework** - LLM-based reflection and diagnosis for bug reports
- **aplib** - Agent-based testing with goal structures
- **iReflect** - RAG-enhanced GPT-4 feedback for playtesting
- **KLPEG** - Knowledge Graph-based test analysis

See: [Leveraging LLM Agents for Automated Video Game Testing](https://arxiv.org/html/2509.22170v1)
