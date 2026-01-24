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
            size: 0.1,
            color: 0x3498db,      // Blue water droplet
            glow: true,
            glowColor: 0x5dade2,
            emissiveIntensity: { min: 0.3, max: 0.7 },
            gravity: 0.5,         // Slight arc for water
            lifetime: 2000,       // Shorter lifetime
            piercing: false,
            trail: true,          // Leave water trail
            trailColor: 0x85c1e9
        },

        dart: {
            id: 'dart',
            geometry: 'cylinder',  // Elongated dart shape
            size: 0.15,
            length: 0.4,          // Longer than wide
            color: 0xe74c3c,      // Orange/red foam dart
            glow: false,
            emissiveIntensity: { min: 0, max: 0.1 },
            gravity: 0.2,         // Slight drop
            lifetime: 4000,
            piercing: false,
            spin: true            // Dart spins in flight
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
