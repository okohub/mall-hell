// ============================================
// ENEMY - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what enemies ARE, not how they behave

const Enemy = {
    // Enemy type definitions
    types: {
        CART: {
            id: 'cart',
            name: 'Shopping Cart',
            health: 3,
            speed: 0.4,              // Multiplier of base speed
            damage: 20,              // Damage dealt to player
            behavior: 'chase',       // AI behavior type
            scoreHit: 100,           // Points for hitting
            scoreDestroy: 300,       // Points for destroying
            driftInterval: 1.5,      // Seconds between drift changes
            driftSpeed: 3,           // Max drift speed
            collisionRadius: 2,      // For hit detection
            visual: {
                bodyColor: 0xe94560,
                wireColor: 0xc0392b,
                eyeColor: 0xffff00,
                glowColor: 0xff0000,
                size: { w: 2, h: 1.5, d: 2.5 }
            }
        }
        // Future enemy types can be added here:
        // SECURITY_CART: { ... },
        // DRONE: { ... },
        // TURRET: { ... }
    },

    // Behavior definitions (what behaviors exist)
    behaviors: ['chase', 'patrol', 'stationary', 'ranged'],

    // Helper to get enemy config
    get(typeId) {
        return this.types[typeId] || null;
    },

    // Create enemy instance data
    createInstance(typeId, position) {
        const config = this.get(typeId);
        if (!config) return null;

        return {
            type: typeId,
            config: config,
            health: config.health,
            maxHealth: config.health,
            position: { ...position },
            active: true,
            driftSpeed: (Math.random() - 0.5) * config.driftSpeed,
            driftTimer: 0,
            hitFlash: 0,
            patrolTimer: 0
        };
    },

    // Check if enemy is alive
    isAlive(instance) {
        return instance && instance.active && instance.health > 0;
    },

    // Get health percentage
    getHealthPercent(instance) {
        if (!instance) return 0;
        return instance.health / instance.maxHealth;
    }
};
