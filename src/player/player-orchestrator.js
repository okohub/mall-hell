// ============================================
// PLAYER SYSTEM - Orchestrator
// ============================================
// Manages player state, movement, health, and collision
// Uses Player data definitions (assumes Player is loaded globally)

const PlayerOrchestrator = {
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
            IDLE_DRIFT: 0.5,
            TURN_SMOOTH: 8,
            FRICTION_MULTIPLIER: 0.5,
            COLLISION_SPEED_REDUCTION: 0.3
        };
    },

    /**
     * Get visual constants from player data
     */
    getVisualConfig() {
        return this.playerData ? this.playerData.visual : {
            LEAN_ANGLE: 0.15,
            LEAN_SMOOTH: 8,
            CAMERA_ROLL_FACTOR: 0.1,
            CAMERA_HEIGHT: 2.2,
            CAMERA_ROTATION_X: -0.12,
            COLLISION_RADIUS: 1.2,
            WALL_BUMP_DECAY: 0.85,
            CAMERA_BUMP_OFFSET: 0.3,
            CAMERA_BUMP_SHAKE: 0.1,
            CAMERA_BUMP_ROTATION: 0.05
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
        this.currentTurnRate += (targetTurnRate * config.TURN_SPEED - this.currentTurnRate) * config.TURN_SMOOTH * dt;
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
                this.speed = Math.min(config.IDLE_DRIFT, this.speed + config.FRICTION * config.FRICTION_MULTIPLIER * dt);
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
            this.speed *= config.COLLISION_SPEED_REDUCTION;
        }

        // Apply position changes based on collision
        if (!collision.blockedX) this.position.x = newPos.x;
        if (!collision.blockedZ) this.position.z = newPos.z;
    },

    /**
     * Update wall bump decay
     */
    updateWallBump() {
        const visual = this.getVisualConfig();
        this.wallBumpIntensity *= visual.WALL_BUMP_DECAY;
        if (this.wallBumpIntensity < 0.01) this.wallBumpIntensity = 0;
    },

    /**
     * Update cart leaning based on turn rate
     * @param {number} dt - Delta time in seconds
     */
    updateLean(dt) {
        const config = this.getVisualConfig();
        const targetLeanAngle = -this.currentTurnRate * config.LEAN_ANGLE;
        this.currentLeanAngle += (targetLeanAngle - this.currentLeanAngle) * config.LEAN_SMOOTH * dt;
    },

    /**
     * Full movement update (combines all movement operations)
     * @param {Object} keys - Input state {forward, backward, turnLeft, turnRight}
     * @param {number} dt - Delta time in seconds
     * @param {Function} collisionCheck - Function(newX, newZ, oldX, oldZ) returning collision result
     * @param {Function} onCollision - Optional callback when collision occurs (position, direction, intensity)
     */
    updateMovement(keys, dt, collisionCheck, onCollision) {
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

        // Trigger collision callback if blocked and pressing into wall (for spark effects)
        const velocity = this.getVelocity();
        const pressingIntoWall = collision.blocked && (
            (collision.blockedX && Math.abs(velocity.x) > 0.1) ||
            (collision.blockedZ && Math.abs(velocity.z) > 0.1)
        );

        if (pressingIntoWall && onCollision) {
            const config = this.getMovementConfig();
            const intensity = Math.min(1, (Math.abs(velocity.x) + Math.abs(velocity.z)) / config.MAX_SPEED);

            // Calculate collision point (at the edge of player in direction of movement)
            // Add slight randomness for continuous grinding effect
            const randOffset = () => (Math.random() - 0.5) * 0.3;
            const collisionPos = {
                x: this.position.x + (collision.blockedX ? Math.sign(velocity.x) * 1.5 : 0) + randOffset(),
                y: 0.8 + Math.random() * 0.8, // Random height on cart
                z: this.position.z + (collision.blockedZ ? Math.sign(velocity.z) * 1.5 : 0) + randOffset()
            };
            const collisionDir = {
                x: collision.blockedX ? -Math.sign(velocity.x) : 0,
                z: collision.blockedZ ? -Math.sign(velocity.z) : 0
            };
            onCollision(collisionPos, collisionDir, intensity);
        }

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
        const bumpOffsetX = this.wallBumpDirection.x * this.wallBumpIntensity * config.CAMERA_BUMP_OFFSET;
        const bumpOffsetZ = this.wallBumpDirection.z * this.wallBumpIntensity * config.CAMERA_BUMP_OFFSET;
        const bumpShake = this.wallBumpIntensity * (Math.random() - 0.5) * config.CAMERA_BUMP_SHAKE;

        return {
            x: this.position.x + bumpOffsetX,
            y: config.CAMERA_HEIGHT + bumpShake,
            z: this.position.z + bumpOffsetZ,
            rotationX: config.CAMERA_ROTATION_X + this.wallBumpIntensity * config.CAMERA_BUMP_ROTATION,
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
    },

    /**
     * Full update including movement, visuals, and camera
     * @param {Object} options - Update options
     * @param {Object} options.keys - Input state from InputSystem
     * @param {number} options.dt - Delta time
     * @param {Function} options.collisionCheck - Collision check function
     * @param {Object} options.cart - Player cart mesh (optional)
     * @param {Object} options.camera - Camera object (optional)
     * @returns {Object} Updated state for syncing with local variables
     */
    fullUpdate(options) {
        const { keys, dt, collisionCheck, onCollision, cart, camera } = options;

        // Update movement
        this.updateMovement(keys, dt, collisionCheck, onCollision);

        // Update cart mesh
        if (cart) {
            cart.position.x = this.position.x;
            cart.position.z = this.position.z;
            cart.rotation.y = this.rotation;
            cart.rotation.z = this.currentLeanAngle;
        }

        // Update camera
        if (camera) {
            const camState = this.getCameraState();
            camera.position.x = camState.x;
            camera.position.y = camState.y;
            camera.position.z = camState.z;
            camera.rotation.set(0, 0, 0);
            camera.rotation.y = camState.rotationY;
            camera.rotation.x = camState.rotationX;
            camera.rotation.z = camState.rotationZ;
        }

        // Return state for syncing with local variables if needed
        return {
            position: { x: this.position.x, z: this.position.z },
            rotation: this.rotation,
            speed: this.speed,
            currentTurnRate: this.currentTurnRate,
            currentLeanAngle: this.currentLeanAngle,
            wallBumpIntensity: this.wallBumpIntensity,
            wallBumpDirection: { ...this.wallBumpDirection }
        };
    }
};
