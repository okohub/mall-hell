// ============================================
// OBSTACLE - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what obstacles ARE, not how they behave

const Obstacle = {
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
            collisionRadius: 1,
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
