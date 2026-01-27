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

            spawnOffset: {
                forward: 0.5,        // How far in front of camera
                down: 0.4,           // How far below camera (slingshot held low)
                right: 0             // Lateral offset (0 = center)
            },

            projectile: {
                type: 'stone',
                speed: { min: 60, max: 180 },
                damage: 1,           // Base damage (scales with charge: 1/2/4)
                damageScaling: 3,    // Additional damage per full charge
                count: 1
            },

            charge: {
                rate: 0.5,           // Tension per second (2s to full charge)
                minTension: 0.05,    // Quick tap minimum (1 dmg)
                maxTension: 1.0      // Full charge
            }
        },

        NERFGUN: {
            id: 'nerfgun',
            name: 'Nerf Blaster',
            fireMode: 'single',      // Tap to fire
            cooldown: 350,           // Faster pistol feel (was 500ms)
            range: 140,              // Longest range
            aimAssist: true,

            spawnOffset: {
                forward: 1.0,        // Pistol held forward
                down: 0.3,           // Standard height
                right: 0
            },

            projectile: {
                type: 'dart',
                speed: { min: 120, max: 120 },  // Constant speed
                damage: 3,           // Flat 3 damage (reliable pistol)
                count: 1
            }
        },

        WATERGUN: {
            id: 'watergun',
            name: 'Water Gun',
            fireMode: 'single',
            cooldown: 500,           // Slower grenade launcher feel (was 350ms)
            range: 90,
            aimAssist: true,

            spawnOffset: {
                forward: 1.2,        // Pump action, held forward
                down: 0.35,          // Slightly lower
                right: 0
            },

            projectile: {
                type: 'water',
                speed: { min: 45, max: 45 },
                damage: 2,           // Direct hit damage (was 1.0)
                count: 1,
                gravity: 20,         // Increased arc (was 18)
                splashRadius: 8,     // Larger AOE (was 5)
                splashDamage: 3.0    // Stronger splash (was 2.0)
            }
        },

        LASERGUN: {
            id: 'lasergun',
            name: 'Laser Gun',
            fireMode: 'auto',        // Hold to fire continuously
            cooldown: 50,            // Fast fire rate
            range: 100,
            aimAssist: true,

            spawnOffset: {
                forward: 1.8,        // Long barrel, spawn from muzzle
                down: 0.2,           // Held at eye level
                right: 0
            },

            projectile: {
                type: 'laser',
                speed: { min: 80, max: 80 },  // Reduced speed (was 120)
                damage: 1,           // Low damage per shot (was 0.5)
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
