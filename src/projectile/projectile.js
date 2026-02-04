// ============================================
// PROJECTILE - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what projectiles ARE, not how they behave

const Projectile = {
    // System-wide constants
    system: {
        MAX_PROJECTILES: 50,
        DESPAWN_DISTANCE: 200,
        DEFAULT_LIFETIME: 5000,       // ms before auto-despawn

        // Bounds for out-of-bounds check
        BOUNDS_X: 50,                 // Max X distance from center
        BOUNDS_Y_MIN: -5,             // Min Y position
        BOUNDS_Y_MAX: 20,             // Max Y position

        // Spawn position offsets
        SPAWN_FORWARD_OFFSET: 0.5,    // How far in front of camera
        SPAWN_DOWN_OFFSET: 0.3,       // How far below camera

        // Raycast far distance
        FAR_POINT_DISTANCE: 100,      // Distance for aim calculation

        // Update mesh array defaults
        UPDATE_MAX_DISTANCE: 150,
        UPDATE_MIN_Y: 0,
        UPDATE_MAX_Y: 15
    },

    // Visual scaling constants
    visual: {
        SIZE_SCALE_BASE: 0.8,         // Base size multiplier
        SIZE_SCALE_POWER: 0.4,        // Additional size per power
        GLOW_OPACITY_BASE: 0.2,       // Base glow opacity
        GLOW_OPACITY_POWER: 0.3       // Additional opacity per power
    },

    // Projectile type definitions
    types: {
        stone: {
            id: 'stone',
            geometry: 'sphere',
            size: 0.2,
            color: 0xf39c12,
            glow: true,
            glowColor: 0xf39c12,
            emissiveIntensity: { min: 0.2, max: 0.6 },
            gravity: 0,           // No gravity for arcade feel
            lifetime: 5000,       // ms before auto-despawn
            piercing: false       // Stops on first hit
        },

        water: {
            id: 'water',
            geometry: 'sphere',
            size: 0.5,            // Larger water balloon
            color: 0x3498db,      // Blue
            glow: true,
            glowColor: 0x5dade2,
            emissiveIntensity: { min: 0.5, max: 0.8 },
            gravity: 18,          // Strong arc - water balloon physics
            lifetime: 3000,
            piercing: false,
            splash: true,         // Has splash damage
            splashRadius: 5,
            splashDamage: 0.5,
            slow: {               // Slow effect on hit
                enabled: true,
                duration: 2.0,    // 2 seconds
                speedMultiplier: 0.5  // 50% speed
            }
        },

        laser: {
            id: 'laser',
            geometry: 'cylinder',  // Elongated bolt shape
            size: 0.12,
            length: 0.6,          // Long energy bolt
            color: 0xe74c3c,      // Red
            glow: true,
            glowColor: 0xff6b6b,
            emissiveIntensity: { min: 0.8, max: 1.2 },  // Bright glow
            gravity: 0,           // No drop - straight line
            lifetime: 2000,
            piercing: false,
            trail: true,
            trailColor: 0xff6b6b
        },

        dart: {
            id: 'dart',
            geometry: 'cylinder',  // Elongated dart shape
            size: 0.18,            // Visible foam dart
            length: 0.5,           // Longer than wide
            color: 0xe67e22,       // Orange foam dart
            glow: true,            // Add subtle glow for visibility
            glowColor: 0xf39c12,
            emissiveIntensity: { min: 0.2, max: 0.4 },
            gravity: 1,            // Noticeable drop
            lifetime: 4000,
            piercing: false,
            spin: true             // Dart spins in flight
        },

        dinonizer: {
            id: 'dinonizer',
            geometry: 'cylinder',  // Syringe silhouette
            size: 0.16,
            length: 0.9,
            color: 0xf2f6ff,       // Syringe barrel (cool white)
            glow: true,
            glowColor: 0xff7b6a,   // Warm fluid tint
            emissiveIntensity: { min: 0.5, max: 1.1 },
            gravity: 0,
            lifetime: 1600,
            piercing: false,
            transformToToy: true   // Special effect on hit
        }
    },

    // Helper to get projectile config
    get(typeId) {
        return this.types[typeId] || this.types.stone;
    },

    // Create projectile instance data
    createInstance(typeId, position, direction, speed, damage) {
        const config = this.get(typeId);
        return {
            type: typeId,
            config: config,
            position: { ...position },
            direction: { ...direction },
            speed: speed,
            damage: damage,
            lifetime: config.lifetime,
            createdAt: Date.now(),
            active: true
        };
    }
};
