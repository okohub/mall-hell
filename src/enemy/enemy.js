// ============================================
// ENEMY - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what enemies ARE, not how they behave

const Enemy = {
    // Enemy type definitions
    types: {
        SKELETON: {
            id: 'skeleton',
            name: 'Skeleton Driver',
            health: 4,
            speed: 0.45,
            damage: 25,
            behavior: 'chase',
            scoreHit: 150,
            scoreDestroy: 400,
            driftInterval: 1.2,           // Erratic movement
            driftSpeed: 4,
            collisionRadius: 2.5,
            walkSpeed: 3.5,               // Walking animation speed
            visual: {
                boneColor: 0xf5f5dc,      // Bone white
                eyeColor: 0xff0000,       // Blood red eyes
                smileColor: 0x8b0000,     // Dark red smile
                glowColor: 0xff0000,
                cartColor: 0x1a1a1a,      // Dark cart
                hornColor: 0x8b0000,      // Devil horns
                bodyColor: 0x1a1a1a,      // For compatibility
                wireColor: 0x8b0000,
                size: { w: 2.2, h: 1.5, d: 2.8 }
            }
        }
    },

    // Default enemy type
    defaultType: 'SKELETON',

    // Behavior definitions (what behaviors exist)
    behaviors: ['chase', 'patrol', 'stationary', 'ranged'],

    // Behavior constants (defaults for AI)
    behaviorDefaults: {
        CHASE_MIN_DISTANCE: 3,       // Stop chasing when this close
        LOST_SIGHT_TIMEOUT: 2,       // Seconds before switching to wander
        LOST_SIGHT_SPEED: 0.5,       // Speed multiplier when lost sight
        WANDER_INTERVAL: 2,          // Seconds between wander direction changes
        WANDER_SPEED: 0.15,          // Speed multiplier for wandering
        PATROL_SPEED: 0.2,           // Speed multiplier for patrol behavior
        HOME_RETURN_SPEED: 0.25,     // Speed multiplier when returning home
        HOME_RADIUS: 8,              // How far from home before returning
        SEARCH_LAST_SEEN_CHANCE: 0.4 // Chance to move towards last seen position
    },

    // Visual effect constants
    effects: {
        HIT_FLASH_INITIAL: 1,        // Initial hit flash intensity
        HIT_FLASH_DECAY: 5           // Hit flash decay rate per second
    },

    // System defaults
    system: {
        MAX_ENEMIES: 10,
        SPAWN_CHANCE: 0.015,         // Per frame spawn chance
        SPAWN_DISTANCE: 150,         // Distance ahead to spawn
        DESPAWN_DISTANCE: 60,        // Distance to despawn
        COLLISION_DISTANCE: 3.5      // Player collision distance
    },

    // Helper to get enemy config (defaults to SKELETON)
    get(typeId) {
        return this.types[typeId] || this.types[this.defaultType] || null;
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
            spawnPosition: { ...position },  // Remember where we spawned (home)
            active: true,
            driftSpeed: (Math.random() - 0.5) * config.driftSpeed,
            driftTimer: 0,
            hitFlash: 0,
            patrolTimer: 0,
            walkTimer: Math.random() * Math.PI * 2  // Random start phase for walking
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
