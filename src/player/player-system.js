// ============================================
// PLAYER SYSTEM - Orchestrator
// ============================================
// Manages player state, movement, health, and collision
// Uses Player data definitions (assumes Player is loaded globally)

const PlayerSystem = {
    // Position and movement state
    position: { x: 0, z: 0 },
    rotation: 0,
    speed: 0,
    currentTurnRate: 0,
    currentLeanAngle: 0,

    // Health state
    health: 100,
    lastDamageTime: 0,
    isInvulnerable: false,

    // Wall bump effect
    wallBumpIntensity: 0,
    wallBumpDirection: { x: 0, z: 0 },

    // References
    playerData: null,

    /**
     * Initialize the player system
     * @param {Object} playerData - Reference to Player data object
     */
    init(playerData) {
        this.playerData = playerData || (typeof Player !== 'undefined' ? Player : null);
        this.reset();
    },

    /**
     * Reset all player state to starting values
     */
    reset() {
        if (this.playerData) {
            const start = this.playerData.startPosition;
            this.position = { x: start.x, z: start.z };
            this.rotation = start.rotation;
            this.health = this.playerData.health.MAX;
        } else {
            this.position = { x: 45, z: 75 };
            this.rotation = 0;
            this.health = 100;
        }
        this.speed = 0;
        this.currentTurnRate = 0;
        this.currentLeanAngle = 0;
        this.lastDamageTime = 0;
        this.isInvulnerable = false;
        this.wallBumpIntensity = 0;
        this.wallBumpDirection = { x: 0, z: 0 };
    },

    // ==========================================
    // MOVEMENT METHODS
    // ==========================================

    /**
     * Get movement constants from player data
     */
    getMovementConfig() {
        return this.playerData ? this.playerData.movement : {
            SPEED: 8,
            TURN_SPEED: 2.5,
            REVERSE_SPEED: 4,
            ACCELERATION: 15,
            DECELERATION: 20,
            MAX_SPEED: 10,
            FRICTION: 8,
            IDLE_DRIFT: 0.5
        };
    },

    /**
     * Get visual constants from player data
     */
    getVisualConfig() {
        return this.playerData ? this.playerData.visual : {
            LEAN_ANGLE: 0.15,
            CAMERA_ROLL_FACTOR: 0.1,
            CAMERA_HEIGHT: 2.2,
            COLLISION_RADIUS: 1.2
        };
    },

    /**
     * Update turning based on input
     * @param {boolean} turnLeft - Is turn left pressed
     * @param {boolean} turnRight - Is turn right pressed
     * @param {number} dt - Delta time in seconds
     */
    updateTurning(turnLeft, turnRight, dt) {
        const config = this.getMovementConfig();
        const targetTurnRate = (turnLeft ? 1 : 0) - (turnRight ? 1 : 0);
        this.currentTurnRate += (targetTurnRate * config.TURN_SPEED - this.currentTurnRate) * 8 * dt;
        this.rotation += this.currentTurnRate * dt;
    },

    /**
     * Update speed based on input
     * @param {boolean} forward - Is forward pressed
     * @param {boolean} backward - Is backward pressed
     * @param {number} dt - Delta time in seconds
     */
    updateSpeed(forward, backward, dt) {
        const config = this.getMovementConfig();

        if (forward) {
            this.speed += config.ACCELERATION * dt;
        } else if (backward) {
            this.speed -= config.ACCELERATION * dt;
        } else {
            // Apply friction when no input, but maintain small idle drift
            if (this.speed > config.IDLE_DRIFT) {
                this.speed = Math.max(config.IDLE_DRIFT, this.speed - config.FRICTION * dt);
            } else if (this.speed < config.IDLE_DRIFT) {
                // Accelerate towards idle drift speed
                this.speed = Math.min(config.IDLE_DRIFT, this.speed + config.FRICTION * 0.5 * dt);
            }
        }

        // Clamp speed
        this.speed = Math.max(-config.REVERSE_SPEED, Math.min(config.MAX_SPEED, this.speed));
    },

    /**
     * Calculate velocity from rotation and speed
     * @returns {Object} Velocity {x, z}
     */
    getVelocity() {
        return {
            x: -Math.sin(this.rotation) * this.speed,
            z: -Math.cos(this.rotation) * this.speed
        };
    },

    /**
     * Calculate new position based on current velocity
     * @param {number} dt - Delta time in seconds
     * @returns {Object} New position {x, z}
     */
    calculateNewPosition(dt) {
        const velocity = this.getVelocity();
        return {
            x: this.position.x + velocity.x * dt,
            z: this.position.z + velocity.z * dt
        };
    },

    /**
     * Apply collision result and update position
     * @param {Object} newPos - Proposed new position {x, z}
     * @param {Object} collision - Collision result {blocked, blockedX, blockedZ}
     */
    applyMovement(newPos, collision) {
        const config = this.getMovementConfig();
        const velocity = this.getVelocity();

        // Trigger wall bump effect on collision
        if (collision.blocked && this.speed > 1) {
            this.wallBumpIntensity = Math.min(1, this.speed / config.MAX_SPEED);
            this.wallBumpDirection = {
                x: collision.blockedX ? -Math.sign(velocity.x) : 0,
                z: collision.blockedZ ? -Math.sign(velocity.z) : 0
            };
            // Reduce speed on impact
            this.speed *= 0.3;
        }

        // Apply position changes based on collision
        if (!collision.blockedX) this.position.x = newPos.x;
        if (!collision.blockedZ) this.position.z = newPos.z;
    },

    /**
     * Update wall bump decay
     */
    updateWallBump() {
        this.wallBumpIntensity *= 0.85;
        if (this.wallBumpIntensity < 0.01) this.wallBumpIntensity = 0;
    },

    /**
     * Update cart leaning based on turn rate
     * @param {number} dt - Delta time in seconds
     */
    updateLean(dt) {
        const config = this.getVisualConfig();
        const targetLeanAngle = -this.currentTurnRate * config.LEAN_ANGLE;
        this.currentLeanAngle += (targetLeanAngle - this.currentLeanAngle) * 8 * dt;
    },

    /**
     * Full movement update (combines all movement operations)
     * @param {Object} keys - Input state {forward, backward, turnLeft, turnRight}
     * @param {number} dt - Delta time in seconds
     * @param {Function} collisionCheck - Function(newX, newZ, oldX, oldZ) returning collision result
     */
    updateMovement(keys, dt, collisionCheck) {
        // Update turning
        this.updateTurning(keys.turnLeft, keys.turnRight, dt);

        // Update speed
        this.updateSpeed(keys.forward, keys.backward, dt);

        // Calculate new position
        const newPos = this.calculateNewPosition(dt);

        // Check collision
        const collision = collisionCheck ?
            collisionCheck(newPos.x, newPos.z, this.position.x, this.position.z) :
            { blocked: false, blockedX: false, blockedZ: false };

        // Apply movement
        this.applyMovement(newPos, collision);

        // Update visual effects
        this.updateWallBump();
        this.updateLean(dt);
    },

    /**
     * Get camera position and rotation for FPS view
     * @returns {Object} Camera state {x, y, z, rotationX, rotationY, rotationZ}
     */
    getCameraState() {
        const config = this.getVisualConfig();
        const bumpOffsetX = this.wallBumpDirection.x * this.wallBumpIntensity * 0.3;
        const bumpOffsetZ = this.wallBumpDirection.z * this.wallBumpIntensity * 0.3;
        const bumpShake = this.wallBumpIntensity * (Math.random() - 0.5) * 0.1;

        return {
            x: this.position.x + bumpOffsetX,
            y: config.CAMERA_HEIGHT + bumpShake,
            z: this.position.z + bumpOffsetZ,
            rotationX: -0.12 + this.wallBumpIntensity * 0.05,
            rotationY: this.rotation,
            rotationZ: this.currentLeanAngle * config.CAMERA_ROLL_FACTOR * 0.5 + bumpShake * 2
        };
    },

    // ==========================================
    // HEALTH METHODS
    // ==========================================

    /**
     * Get health config from player data
     */
    getHealthConfig() {
        return this.playerData ? this.playerData.health : {
            MAX: 100,
            ENEMY_DAMAGE: 20,
            OBSTACLE_DAMAGE: 10,
            INVULNERABILITY_DURATION: 1000
        };
    },

    /**
     * Get current health
     */
    getHealth() {
        return this.health;
    },

    /**
     * Get max health
     */
    getMaxHealth() {
        return this.getHealthConfig().MAX;
    },

    /**
     * Get health as percentage (0-100)
     */
    getHealthPercent() {
        return (this.health / this.getMaxHealth()) * 100;
    },

    /**
     * Check if player is at low health
     * @param {number} threshold - Health threshold (default 30)
     */
    isLowHealth(threshold = 30) {
        return this.health <= threshold;
    },

    /**
     * Check if player is dead
     */
    isDead() {
        return this.health <= 0;
    },

    /**
     * Damage the player
     * @param {number} amount - Damage amount
     * @returns {boolean} True if damage was applied
     */
    damage(amount) {
        if (this.isInvulnerable) return false;

        this.health = Math.max(0, this.health - amount);

        // Start invulnerability
        this.isInvulnerable = true;
        this.lastDamageTime = Date.now();

        return true;
    },

    /**
     * Damage from enemy collision
     * @returns {boolean} True if damage was applied
     */
    damageFromEnemy() {
        return this.damage(this.getHealthConfig().ENEMY_DAMAGE);
    },

    /**
     * Damage from obstacle collision
     * @returns {boolean} True if damage was applied
     */
    damageFromObstacle() {
        return this.damage(this.getHealthConfig().OBSTACLE_DAMAGE);
    },

    /**
     * Heal the player
     * @param {number} amount - Heal amount
     */
    heal(amount) {
        const config = this.getHealthConfig();
        this.health = Math.min(config.MAX, this.health + amount);
    },

    /**
     * Update invulnerability state
     */
    updateInvulnerability() {
        if (this.isInvulnerable) {
            const config = this.getHealthConfig();
            if (Date.now() - this.lastDamageTime >= config.INVULNERABILITY_DURATION) {
                this.isInvulnerable = false;
            }
        }
    },

    /**
     * Check if player is currently invulnerable
     */
    getIsInvulnerable() {
        return this.isInvulnerable;
    },

    // ==========================================
    // POSITION/STATE GETTERS
    // ==========================================

    /**
     * Get current position
     */
    getPosition() {
        return { x: this.position.x, z: this.position.z };
    },

    /**
     * Get current rotation
     */
    getRotation() {
        return this.rotation;
    },

    /**
     * Get current speed
     */
    getSpeed() {
        return this.speed;
    },

    /**
     * Get current lean angle
     */
    getLeanAngle() {
        return this.currentLeanAngle;
    },

    /**
     * Set position directly (for initialization or teleport)
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    setPosition(x, z) {
        this.position.x = x;
        this.position.z = z;
    },

    /**
     * Set rotation directly
     * @param {number} rotation - Rotation in radians
     */
    setRotation(rotation) {
        this.rotation = rotation;
    }
};
