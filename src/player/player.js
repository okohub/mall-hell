// ============================================
// PLAYER - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what player IS, not how it behaves

const Player = {
    // Movement constants
    movement: {
        SPEED: 8,              // Forward speed
        TURN_SPEED: 2.5,       // Radians per second
        REVERSE_SPEED: 4,      // Backward speed
        ACCELERATION: 15,      // Speed gain per second
        DECELERATION: 20,      // Speed loss per second (braking)
        MAX_SPEED: 10,         // Maximum speed
        FRICTION: 8,           // Natural slowdown when not pressing W/S
        IDLE_DRIFT: 0.5        // Small forward drift when idle (cart on slope)
    },

    // Visual constants
    visual: {
        LEAN_ANGLE: 0.15,      // Lean when turning
        CAMERA_ROLL_FACTOR: 0.1,
        CAMERA_HEIGHT: 2.2,
        COLLISION_RADIUS: 1.2  // Player collision radius for wall detection
    },

    // Health constants
    health: {
        MAX: 100,
        ENEMY_DAMAGE: 20,
        OBSTACLE_DAMAGE: 10,
        INVULNERABILITY_DURATION: 1000  // ms
    },

    // Starting position (center of ENTRANCE room in grid)
    startPosition: {
        x: 45,
        z: 75,
        rotation: 0  // Facing -Z direction
    },

    // Helper to get movement constant
    getMovement(key) {
        return this.movement[key] || 0;
    },

    // Helper to get health constant
    getHealth(key) {
        return this.health[key] || 0;
    },

    // Helper to get visual constant
    getVisual(key) {
        return this.visual[key] || 0;
    }
};
