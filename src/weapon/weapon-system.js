// ============================================
// WEAPON SYSTEM - Orchestrator
// ============================================
// Manages weapon state, charging, firing, and aiming
// Uses Weapon data definitions (assumes Weapon is loaded globally)

const WeaponSystem = {
    // Current state
    currentWeaponId: 'SLINGSHOT',
    chargeState: 0,
    isCharging: false,
    lastFireTime: 0,

    // Aiming state
    aimProfile: 'STANDARD',
    lockedTarget: null,
    crosshairX: 0,
    crosshairY: 0,
    aimAssistActive: false,

    // References (set during init)
    weaponData: null,

    /**
     * Initialize the weapon system
     * @param {Object} weaponData - Reference to Weapon data object
     */
    init(weaponData) {
        this.weaponData = weaponData || (typeof Weapon !== 'undefined' ? Weapon : null);
        this.currentWeaponId = 'SLINGSHOT';
        this.aimProfile = 'STANDARD';
        this.crosshairX = window.innerWidth / 2;
        this.crosshairY = window.innerHeight / 2;
        this.reset();
    },

    /**
     * Reset all weapon state
     */
    reset() {
        this.chargeState = 0;
        this.isCharging = false;
        this.lastFireTime = 0;
        this.lockedTarget = null;
        this.aimAssistActive = false;
        this.crosshairX = window.innerWidth / 2;
        this.crosshairY = window.innerHeight / 2;
    },

    // ==========================================
    // WEAPON METHODS
    // ==========================================

    /**
     * Get current weapon configuration
     */
    getWeaponConfig() {
        if (!this.weaponData) return null;
        return this.weaponData.get(this.currentWeaponId);
    },

    /**
     * Switch to a different weapon
     */
    switchWeapon(weaponId) {
        if (!this.weaponData || !this.weaponData.get(weaponId)) return false;
        this.currentWeaponId = weaponId;
        this.reset();
        return true;
    },

    /**
     * Check if weapon can fire
     */
    canFire(time) {
        const weapon = this.getWeaponConfig();
        if (!weapon) return false;
        return (time - this.lastFireTime) >= weapon.cooldown;
    },

    /**
     * Start charging the weapon
     */
    startCharge() {
        if (this.isCharging) return false;
        const weapon = this.getWeaponConfig();
        if (!weapon || weapon.fireMode !== 'charge') return false;

        this.isCharging = true;
        this.chargeState = weapon.minTension;
        return true;
    },

    /**
     * Update charge state (call each frame while charging)
     */
    updateCharge(dt) {
        if (!this.isCharging) return;
        const weapon = this.getWeaponConfig();
        if (!weapon) return;

        if (this.chargeState < weapon.maxTension) {
            this.chargeState += weapon.chargeRate * dt;
            if (this.chargeState > weapon.maxTension) {
                this.chargeState = weapon.maxTension;
            }
        }
    },

    /**
     * Release charge and get tension value
     */
    releaseCharge() {
        if (!this.isCharging) return null;

        const tension = this.chargeState;
        this.isCharging = false;
        this.chargeState = 0;
        return tension;
    },

    /**
     * Cancel charging without firing
     */
    cancelCharge() {
        this.isCharging = false;
        this.chargeState = 0;
    },

    /**
     * Calculate projectile speed based on tension
     */
    calculateSpeed(tension) {
        const weapon = this.getWeaponConfig();
        if (!weapon) return 0;
        const speed = weapon.projectileSpeed;
        return speed.min + (speed.max - speed.min) * tension;
    },

    /**
     * Fire the weapon
     * @returns {Object|null} Fire result with speed, power, damage or null if can't fire
     */
    fire(time) {
        if (!this.canFire(time)) return null;

        const weapon = this.getWeaponConfig();
        if (!weapon) return null;

        this.lastFireTime = time;

        if (weapon.fireMode === 'charge') {
            const tension = this.releaseCharge();
            if (tension === null || tension < weapon.minTension) return null;
            return {
                speed: this.calculateSpeed(tension),
                power: tension,
                damage: weapon.damage,
                projectileType: weapon.projectile
            };
        }

        // Single fire mode
        return {
            speed: weapon.projectileSpeed.max,
            power: 1.0,
            damage: weapon.damage,
            projectileType: weapon.projectile
        };
    },

    /**
     * Get current tension value
     */
    getTension() {
        return this.chargeState;
    },

    /**
     * Get max tension for current weapon
     */
    getMaxTension() {
        const weapon = this.getWeaponConfig();
        return weapon ? weapon.maxTension : 1.0;
    },

    /**
     * Check if aim assist is enabled for current weapon
     */
    getAimAssistEnabled() {
        const weapon = this.getWeaponConfig();
        return weapon ? weapon.aimAssist : false;
    },

    /**
     * Get projectile configuration for current weapon
     * @returns {Object} Projectile config with size, color, glow settings
     */
    getProjectileConfig() {
        const weapon = this.getWeaponConfig();
        if (!weapon) {
            // Default projectile config
            return {
                size: 0.2,
                color: 0xf39c12,
                glowColor: 0xf39c12,
                glow: true,
                emissiveIntensity: { min: 0.2, max: 0.6 }
            };
        }
        // Get from Projectile definitions if available
        if (typeof Projectile !== 'undefined' && Projectile.types && Projectile.types[weapon.projectile?.toUpperCase()]) {
            return Projectile.types[weapon.projectile.toUpperCase()].visual;
        }
        // Default stone projectile config
        return {
            size: 0.2,
            color: 0xf39c12,
            glowColor: 0xf39c12,
            glow: true,
            emissiveIntensity: { min: 0.2, max: 0.6 }
        };
    },

    // ==========================================
    // AIMING METHODS
    // ==========================================

    /**
     * Set aim profile
     */
    setAimProfile(profileId) {
        if (!this.weaponData) return false;
        const profile = this.weaponData.getAimProfile(profileId);
        if (profile) {
            this.aimProfile = profileId;
            return true;
        }
        return false;
    },

    /**
     * Get current aim profile config
     */
    getAimProfileConfig() {
        if (!this.weaponData) return null;
        return this.weaponData.getAimProfile(this.aimProfile);
    },

    /**
     * Check if aiming is enabled
     */
    isAimingEnabled() {
        const profile = this.getAimProfileConfig();
        return profile ? profile.enabled : false;
    },

    /**
     * Update crosshair position
     */
    updateCrosshair(x, y) {
        this.crosshairX = x;
        this.crosshairY = y;
    },

    /**
     * Get crosshair position
     */
    getCrosshairPosition() {
        return { x: this.crosshairX, y: this.crosshairY };
    },

    /**
     * Score a potential target (enemy)
     */
    scoreEnemy(enemy, cameraPos, playerPos) {
        const config = this.getAimProfileConfig();
        if (!config || !config.enabled) return -Infinity;

        const zDist = cameraPos.z - enemy.position.z;
        const xDist = Math.abs(enemy.position.x - playerPos.x);
        const isAhead = zDist > 0 && zDist < config.maxRange;
        const inPath = xDist < config.inPathThreshold;

        const scoring = config.scoring.enemy;
        if (isAhead && inPath) {
            return scoring.inPathBonus - zDist * scoring.distancePenalty - xDist * scoring.lateralPenalty;
        } else if (isAhead) {
            return scoring.baseScore - zDist * 2 - xDist * 5;
        }
        return scoring.fallbackScore - Math.sqrt(
            Math.pow(enemy.position.x - cameraPos.x, 2) +
            Math.pow(enemy.position.z - cameraPos.z, 2)
        );
    },

    /**
     * Score a potential target (obstacle)
     */
    scoreObstacle(obstacle, cameraPos, playerPos) {
        const config = this.getAimProfileConfig();
        if (!config || !config.enabled) return -Infinity;

        const zDist = cameraPos.z - obstacle.position.z;
        const xDist = Math.abs(obstacle.position.x - playerPos.x);
        const isAhead = zDist > 0 && zDist < 80;
        const inPath = xDist < config.obstacleInPathThreshold;

        const scoring = config.scoring.obstacle;
        if (isAhead && inPath) {
            return scoring.inPathBonus - zDist * scoring.distancePenalty - xDist * scoring.lateralPenalty;
        } else if (isAhead) {
            return scoring.baseScore - zDist * 2 - xDist * 5;
        }
        return -Infinity; // Don't target obstacles behind
    },

    /**
     * Lock onto a target
     */
    setLock(target) {
        this.lockedTarget = target;
        this.aimAssistActive = target !== null;
    },

    /**
     * Clear target lock
     */
    clearLock() {
        this.lockedTarget = null;
        this.aimAssistActive = false;
    },

    /**
     * Get locked target
     */
    getLockedTarget() {
        return this.lockedTarget;
    },

    /**
     * Check if aim assist is currently active
     */
    isAimAssistActive() {
        return this.aimAssistActive;
    }
};
