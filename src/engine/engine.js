// ============================================
// ENGINE - Core Constants & Configuration
// ============================================
// Pure data definitions for the game engine.
// No dependencies - this file should load first.

const Engine = {
    // Version
    version: '5.10.0',

    // ==========================================
    // GAME STATES
    // ==========================================
    STATES: {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER'
    },

    // Valid state transitions (from -> [to states])
    STATE_TRANSITIONS: {
        'MENU': ['PLAYING'],
        'PLAYING': ['PAUSED', 'GAME_OVER'],
        'PAUSED': ['PLAYING', 'MENU'],
        'GAME_OVER': ['MENU', 'PLAYING']
    },

    // ==========================================
    // INPUT ACTIONS
    // ==========================================
    ACTIONS: {
        FORWARD: 'forward',
        BACKWARD: 'backward',
        TURN_LEFT: 'turnLeft',
        TURN_RIGHT: 'turnRight',
        FIRE: 'fire',
        PAUSE: 'pause',
        FREEZE: 'freeze'
    },

    // Default key bindings (key code -> action)
    DEFAULT_BINDINGS: {
        'KeyW': 'forward',
        'ArrowUp': 'forward',
        'KeyS': 'backward',
        'ArrowDown': 'backward',
        'KeyA': 'turnLeft',
        'ArrowLeft': 'turnLeft',
        'KeyD': 'turnRight',
        'ArrowRight': 'turnRight',
        'Space': 'fire',
        'Escape': 'pause',
        'KeyP': 'freeze'
    },

    // ==========================================
    // DEFAULT CONFIGURATION
    // ==========================================
    defaults: {
        // Render settings
        render: {
            antialias: true,
            shadowMapEnabled: true,
            shadowMapType: 'PCFSoftShadowMap',
            pixelRatio: 1,
            maxDeltaTime: 0.1  // Cap delta time to prevent physics explosion
        },

        // Camera settings
        camera: {
            fov: 75,
            near: 0.1,
            far: 1000,
            position: { x: 0, y: 3, z: 0 }
        },

        // Scene settings
        scene: {
            backgroundColor: 0x1a1a2e,
            fogColor: 0x1a1a2e,
            fogNear: 50,
            fogFar: 200
        },

        // Entity cleanup thresholds
        cleanup: {
            projectileBehindDistance: 20,
            enemyBehindDistance: 20,
            obstacleBehindDistance: 30
        },

        // Collision detection constants
        collision: {
            // Quick distance check thresholds (squared values for efficiency)
            enemyQuickCheckDist: 100,        // 10 units squared - skip enemies farther than this
            obstacleQuickCheckDist: 64,      // 8 units squared - skip obstacles farther than this

            // Hitbox configuration
            enemyHitboxYOffset: 1.2,         // Y offset for enemy hitbox center
            enemyHitRadius: 2.5,             // Radius for projectile-enemy hits
            obstacleHitYFactor: 0.4,         // Multiply obstacle height for hitbox Y center
            obstacleHitRadiusFactor: 0.8,    // Multiply obstacle width for hit radius

            // Default hit radius (when not specified)
            defaultHitRadius: 2,
            defaultObstacleHeight: 2,
            defaultObstacleWidth: 2,

            // Line of sight
            losRayStepSize: 1,               // Step size for ray march LOS check (smaller = more accurate)
            losDoorTolerance: 3              // Extra width tolerance for door checks
        },

        // Spawn limits
        spawn: {
            maxEnemies: 10,
            maxObstacles: 15,
            maxProjectiles: 50,
            maxParticles: 100
        }
    },

    // ==========================================
    // SCENE GROUPS
    // ==========================================
    // Standard group names for organizing scene objects
    GROUPS: {
        ENVIRONMENT: 'environment',
        ENEMIES: 'enemies',
        OBSTACLES: 'obstacles',
        PROJECTILES: 'projectiles',
        PARTICLES: 'particles',
        UI: 'ui'
    },

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Check if a state is valid
     * @param {string} state - State to check
     * @returns {boolean}
     */
    isValidState(state) {
        return Object.values(this.STATES).includes(state);
    },

    /**
     * Check if a state transition is valid
     * @param {string} from - Current state
     * @param {string} to - Target state
     * @returns {boolean}
     */
    isValidTransition(from, to) {
        const validTargets = this.STATE_TRANSITIONS[from];
        return validTargets ? validTargets.includes(to) : false;
    },

    /**
     * Get all valid transitions from a state
     * @param {string} from - Current state
     * @returns {string[]}
     */
    getValidTransitions(from) {
        return this.STATE_TRANSITIONS[from] || [];
    },

    /**
     * Get action for a key code
     * @param {string} keyCode - Key code (e.g., 'KeyW', 'Space')
     * @returns {string|null} Action name or null
     */
    getActionForKey(keyCode) {
        return this.DEFAULT_BINDINGS[keyCode] || null;
    },

    /**
     * Get all states as an array
     * @returns {string[]}
     */
    getAllStates() {
        return Object.values(this.STATES);
    },

    /**
     * Get all actions as an array
     * @returns {string[]}
     */
    getAllActions() {
        return Object.values(this.ACTIONS);
    }
};
