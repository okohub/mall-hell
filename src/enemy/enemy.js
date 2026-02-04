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
            speed: 0.30,  // Slower for better gameplay
            damage: 25,
            behavior: 'chase',
            scoreHit: 150,
            scoreDestroy: 400,
            driftInterval: 1.2,           // Erratic movement
            driftSpeed: 4,
            collisionRadius: 2.5,
            walkSpeed: 3.5,               // Walking animation speed
            healthCarryChance: 0.2,       // 20% chance to carry health heart
            size: { w: 2.2, h: 1.5, d: 2.8 }
        },

        DINOSAUR: {
            id: 'dinosaur',
            name: 'Dino Boss',
            health: 10,                    // 2.5x skeleton health
            speed: 0.25,                   // Slower but imposing
            damage: 40,                    // High damage
            behavior: 'chase',             // Aggressive pursuit
            scoreHit: 250,                 // Higher hit reward
            scoreDestroy: 1500,            // Big boss reward
            driftInterval: 2.0,            // Slower direction changes
            driftSpeed: 3,                 // Less erratic
            collisionRadius: 5.5,          // Larger collision for big dino
            walkSpeed: 2.5,                // Slower stomp animation
            isBoss: true,                  // Boss flag for special handling
            size: { w: 3.5, h: 2.5, d: 4.5 }  // Much larger
        },

        TOY: {
            id: 'toy',
            name: 'Toy',
            health: 1,
            speed: 0.28,
            damage: 0,
            behavior: 'flee',
            scoreHit: 0,
            scoreDestroy: 0,
            driftInterval: 2.0,
            driftSpeed: 1.5,
            collisionRadius: 1.1,
            walkSpeed: 4.2,
            isToy: true,
            toyPoints: 250,
            size: { w: 1.0, h: 0.75, d: 1.1 }
        }
    },

    // Default enemy type
    defaultType: 'SKELETON',

    // Behavior definitions (what behaviors exist)
    behaviors: ['chase', 'patrol', 'stationary', 'ranged', 'wander', 'flee'],

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
        SEARCH_LAST_SEEN_CHANCE: 0.4, // Chance to move towards last seen position
        FLEE_MIN_DISTANCE: 10,       // Start fleeing when player is this close
        FLEE_STOP_DISTANCE: 16,      // Stop fleeing (return to wander) past this distance
        FLEE_SPEED_MULT: 1.4         // Speed multiplier when fleeing
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
        DESPAWN_DISTANCE: 200,       // Distance to despawn (mall spans ~150 units)
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
