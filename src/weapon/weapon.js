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
            range: 120,              // targeting range in units (enemies spawn at 150)
            aimAssist: true,

            projectile: {
                type: 'stone',
                speed: { min: 60, max: 180 },
                damage: 1,
                count: 1
            },

            charge: {
                rate: 1.2,           // Tension per second
                minTension: 0.2,     // Quick tap minimum
                maxTension: 1.0      // Full charge
            }
        },

        NERFGUN: {
            id: 'nerfgun',
            name: 'Nerf Blaster',
            fireMode: 'single',      // Tap to fire
            cooldown: 500,           // Slower but powerful
            range: 140,              // Longest range
            aimAssist: true,

            projectile: {
                type: 'dart',
                speed: { min: 100, max: 100 },  // Constant speed
                damage: 2.0,
                count: 1
            }
        },

        WATERGUN: {
            id: 'watergun',
            name: 'Water Gun',
            fireMode: 'single',
            cooldown: 350,
            range: 90,
            aimAssist: true,

            projectile: {
                type: 'water',
                speed: { min: 45, max: 45 },
                damage: 1.0,
                count: 1,
                gravity: 18,
                splashRadius: 5,
                splashDamage: 0.5
            }
        },

        LASERGUN: {
            id: 'lasergun',
            name: 'Laser Gun',
            fireMode: 'auto',        // Hold to fire continuously
            cooldown: 50,            // Fast fire rate
            range: 100,
            aimAssist: true,

            projectile: {
                type: 'laser',
                speed: { min: 120, max: 120 },
                damage: 0.5,
                count: 1,
                spread: 0.05         // Spread for auto-fire
            }
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
