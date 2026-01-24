// ============================================
// WEAPON - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what weapons ARE, not how they behave

const Weapon = {
    // Weapon type definitions
    types: {
        SLINGSHOT: {
            id: 'slingshot',
            name: 'Slingshot',
            fireMode: 'charge',      // 'single', 'auto', 'charge', 'burst'
            cooldown: 300,           // ms between shots
            chargeRate: 1.2,         // tension gained per second
            minTension: 0.2,         // minimum tension (quick tap)
            maxTension: 1.0,         // maximum tension (fully charged)
            projectile: 'stone',     // projectile type to fire
            projectileSpeed: {
                min: 60,             // speed at min tension
                max: 180             // speed at max tension
            },
            damage: 1,
            range: 120,              // targeting range in units (enemies spawn at 150)
            aimAssist: true
        }
    },

    // Aiming profile definitions
    aimProfiles: {
        STANDARD: {
            enabled: true,
            stickyTargeting: true,
            priority: ['enemy', 'obstacle'],
            maxRange: 150,
            inPathThreshold: 4,
            obstacleInPathThreshold: 3,
            scoring: {
                enemy: {
                    inPathBonus: 1000,
                    distancePenalty: 5,
                    lateralPenalty: 20,
                    baseScore: 500,
                    fallbackScore: 100
                },
                obstacle: {
                    inPathBonus: 800,
                    distancePenalty: 4,
                    lateralPenalty: 15,
                    baseScore: 300
                }
            }
        },
        NONE: {
            enabled: false,
            stickyTargeting: false,
            priority: [],
            maxRange: 0
        }
    },

    // Helper to get weapon config
    get(typeId) {
        return this.types[typeId] || null;
    },

    // Helper to get aim profile
    getAimProfile(profileId) {
        return this.aimProfiles[profileId] || this.aimProfiles.STANDARD;
    }
};
