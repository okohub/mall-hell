// ============================================
// OBSTACLE - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what obstacles ARE, not how they behave

const Obstacle = {
    // System-wide constants
    system: {
        MAX_OBSTACLES: 15,
        SPAWN_CHANCE: 0.02,           // Per frame spawn chance
        SPAWN_DISTANCE: 150,          // Distance ahead to spawn
        DESPAWN_DISTANCE: 60,         // Distance to despawn
        CENTER_DISPLAY_CHANCE: 0.7,   // Chance to spawn center display
    },

    // Falling animation constants
    falling: {
        ACCELERATION: 5,              // Fall speed acceleration
        SPEED_MULTIPLIER: 0.5,        // Fall position multiplier
        MAX_ANGLE: Math.PI / 2        // Max fall angle (90 degrees)
    },

    // Collision constants
    collision: {
        DEFAULT_WIDTH: 2,             // Default obstacle width
        HIT_RADIUS_FACTOR: 0.6,       // Multiply width for hit radius
        PLAYER_BUFFER: 1.5            // Additional buffer for player collision
    },

    // Obstacle type definitions
    types: {
        STACK: {
            id: 'stack',
            name: 'Product Stack',
            shape: 'pyramid',
            scoreHit: 150,
            collisionRadius: 1.5,
            fallSpeed: 3,
            health: 1,              // Hits to destroy
            size: { w: 1.5, h: 2, d: 1.5 },
            visual: {
                baseColor: null,    // Uses theme colors
                boxCount: 6
            }
        },
        BARREL: {
            id: 'barrel',
            name: 'Barrel',
            shape: 'cylinder',
            scoreHit: 150,
            collisionRadius: 0.7,  // Closer to visual radius (0.6)
            fallSpeed: 4,
            health: 1,
            size: { r: 0.6, h: 1.5 },
            visual: {
                bodyColor: 0x3498db,
                bandColor: 0x888888
            }
        },
        DISPLAY: {
            id: 'display',
            name: 'Display Stand',
            shape: 'box',
            scoreHit: 150,
            collisionRadius: 1.2,
            fallSpeed: 2.5,
            health: 1,
            size: { w: 1.2, h: 2.5, d: 0.8 },
            visual: {
                frameColor: 0x666666,
                signColor: 0xff0000,
                signText: 'SALE!'
            }
        }
    },

    // Helper to get obstacle config
    get(typeId) {
        return this.types[typeId] || null;
    },

    // Get all type IDs
    getTypeIds() {
        return Object.keys(this.types);
    },

    // Get random type
    getRandomType() {
        const ids = this.getTypeIds();
        return ids[Math.floor(Math.random() * ids.length)];
    },

    // Create obstacle instance data
    createInstance(typeId, position) {
        const config = this.get(typeId);
        if (!config) return null;

        return {
            type: typeId,
            config: config,
            position: { ...position },
            rotation: { x: 0, y: 0, z: 0 },
            health: config.health,
            active: true,
            falling: false,
            fallProgress: 0
        };
    }
};
