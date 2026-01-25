/**
 * Player Profiles - Different skill levels and play styles for automated playtesting
 *
 * Each profile defines behavior parameters that simulate how real players would play.
 */

const PlayerProfiles = {
    // Novice player - slow reactions, misses a lot, doesn't use charged shots
    NOVICE: {
        name: 'Novice',
        description: 'First-time player, learning controls',

        // Reaction times (ms)
        reactionTime: { min: 400, max: 800 },

        // Movement patterns
        movement: {
            dodgeChance: 0.1,          // 10% chance to dodge when enemy visible
            dodgeDuration: { min: 100, max: 300 },
            constantForward: true,      // Holds forward most of the time
            turnFrequency: 0.05         // Rarely turns
        },

        // Shooting behavior
        shooting: {
            fireRate: 0.3,              // Fires 30% of possible opportunities
            chargeTime: { min: 50, max: 200 },  // Quick taps, rarely charges
            aimAccuracy: 0.3,           // 30% chance to aim at target
            panicFire: true             // Fires rapidly when health low
        },

        // Decision making
        decisions: {
            targetPriority: 'nearest',   // Shoots at whatever is closest
            healthAwareness: 0.2,        // Rarely notices health
            pickupAwareness: 0.3         // Often misses pickups
        }
    },

    // Average player - moderate skill, learning the game
    AVERAGE: {
        name: 'Average',
        description: 'Casual player with some gaming experience',

        reactionTime: { min: 200, max: 400 },

        movement: {
            dodgeChance: 0.4,
            dodgeDuration: { min: 200, max: 500 },
            constantForward: true,
            turnFrequency: 0.15
        },

        shooting: {
            fireRate: 0.5,
            chargeTime: { min: 200, max: 600 },
            aimAccuracy: 0.5,
            panicFire: true
        },

        decisions: {
            targetPriority: 'enemies',   // Prioritizes enemies over obstacles
            healthAwareness: 0.5,
            pickupAwareness: 0.6
        }
    },

    // Skilled player - good reactions, uses charged shots
    SKILLED: {
        name: 'Skilled',
        description: 'Experienced player who understands mechanics',

        reactionTime: { min: 100, max: 250 },

        movement: {
            dodgeChance: 0.7,
            dodgeDuration: { min: 300, max: 700 },
            constantForward: true,
            turnFrequency: 0.25
        },

        shooting: {
            fireRate: 0.7,
            chargeTime: { min: 400, max: 800 },  // Uses charged shots
            aimAccuracy: 0.7,
            panicFire: false
        },

        decisions: {
            targetPriority: 'optimal',   // Chooses high-value targets
            healthAwareness: 0.8,
            pickupAwareness: 0.85
        }
    },

    // Expert player - optimal play, full charges, strategic
    EXPERT: {
        name: 'Expert',
        description: 'Highly skilled player maximizing score',

        reactionTime: { min: 50, max: 150 },

        movement: {
            dodgeChance: 0.9,
            dodgeDuration: { min: 400, max: 800 },
            constantForward: true,
            turnFrequency: 0.35
        },

        shooting: {
            fireRate: 0.85,
            chargeTime: { min: 600, max: 900 },  // Near-max charges
            aimAccuracy: 0.85,
            panicFire: false
        },

        decisions: {
            targetPriority: 'score',     // Maximizes points per shot
            healthAwareness: 0.95,
            pickupAwareness: 0.95
        }
    },

    // Chaotic player - random actions, stress tests the game
    CHAOTIC: {
        name: 'Chaotic',
        description: 'Random actions to stress test input handling',

        reactionTime: { min: 0, max: 100 },

        movement: {
            dodgeChance: 0.5,
            dodgeDuration: { min: 50, max: 1000 },
            constantForward: false,      // Random forward/stop
            turnFrequency: 0.8           // Constantly turning
        },

        shooting: {
            fireRate: 0.9,
            chargeTime: { min: 0, max: 1000 },  // Random charge times
            aimAccuracy: 0.2,
            panicFire: true
        },

        decisions: {
            targetPriority: 'random',
            healthAwareness: 0.1,
            pickupAwareness: 0.5
        }
    },

    // AFK player - minimal input (tests idle behavior)
    AFK: {
        name: 'AFK',
        description: 'Player who stepped away from keyboard',

        reactionTime: { min: 5000, max: 10000 },

        movement: {
            dodgeChance: 0.02,
            dodgeDuration: { min: 100, max: 200 },
            constantForward: false,
            turnFrequency: 0.01
        },

        shooting: {
            fireRate: 0.05,
            chargeTime: { min: 50, max: 100 },
            aimAccuracy: 0.1,
            panicFire: false
        },

        decisions: {
            targetPriority: 'none',
            healthAwareness: 0,
            pickupAwareness: 0
        }
    }
};

// Utility to get random value in range
PlayerProfiles.randomInRange = function(range) {
    return range.min + Math.random() * (range.max - range.min);
};

// Utility to check probability
PlayerProfiles.checkProbability = function(chance) {
    return Math.random() < chance;
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerProfiles;
}
