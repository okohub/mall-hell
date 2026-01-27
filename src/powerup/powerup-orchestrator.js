// ============================================
// POWERUP SYSTEM - Orchestrator
// ============================================
// Manages active power-up effects, timers, and queries

const PowerUpOrchestrator = {
    // ==========================================
    // STATE
    // ==========================================

    activeEffects: [],  // Array of { type, config, activatedAt, expiresAt }
    pausedEffects: [],  // Stored remaining times during pause

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the power-up system
     */
    init() {
        this.activeEffects = [];
    },

    /**
     * Reset the system (on game restart)
     */
    reset() {
        this.activeEffects = [];
        this.pausedEffects = [];
    },

    // ==========================================
    // ACTIVATION & DEACTIVATION
    // ==========================================

    /**
     * Activate a power-up effect
     * @param {string} powerupType - Power-up type ID (e.g., 'speed_boost')
     * @param {number} currentTime - Current timestamp
     */
    activate(powerupType, currentTime) {
        const config = PowerUp.get(powerupType);
        if (!config) {
            console.warn(`Unknown power-up type: ${powerupType}`);
            return;
        }

        // Check if already active - if so, refresh timer
        const existing = this.activeEffects.find(e => e.type === powerupType);
        if (existing) {
            existing.activatedAt = currentTime;
            existing.expiresAt = currentTime + config.duration;
            return;
        }

        // Add new effect
        this.activeEffects.push({
            type: powerupType,
            config: config,
            activatedAt: currentTime,
            expiresAt: currentTime + config.duration
        });
    },

    /**
     * Deactivate a specific power-up
     * @param {string} powerupType - Power-up type ID
     */
    deactivate(powerupType) {
        this.activeEffects = this.activeEffects.filter(e => e.type !== powerupType);
    },

    /**
     * Pause all active power-ups (save remaining time)
     * @param {number} currentTime - Current timestamp when pausing
     */
    pause(currentTime) {
        // Store remaining time for each active effect
        this.pausedEffects = this.activeEffects.map(effect => ({
            type: effect.type,
            config: effect.config,
            remainingTime: Math.max(0, effect.expiresAt - currentTime)
        }));
    },

    /**
     * Resume all paused power-ups (restore timers)
     * @param {number} currentTime - Current timestamp when resuming
     */
    resume(currentTime) {
        // Restore active effects with new expiry times
        this.activeEffects = this.pausedEffects.map(paused => ({
            type: paused.type,
            config: paused.config,
            activatedAt: currentTime,
            expiresAt: currentTime + paused.remainingTime
        }));
        this.pausedEffects = [];
    },

    // ==========================================
    // QUERIES
    // ==========================================

    /**
     * Check if a power-up is currently active
     * @param {string} powerupType - Power-up type ID
     * @returns {boolean} True if active
     */
    isActive(powerupType) {
        return this.activeEffects.some(e => e.type === powerupType);
    },

    /**
     * Get remaining time for a power-up
     * @param {string} powerupType - Power-up type ID
     * @param {number} currentTime - Current timestamp
     * @returns {number} Milliseconds remaining (0 if not active)
     */
    getTimeRemaining(powerupType, currentTime) {
        const effect = this.activeEffects.find(e => e.type === powerupType);
        if (!effect) return 0;
        return Math.max(0, effect.expiresAt - currentTime);
    },

    /**
     * Get current speed multiplier from active effects
     * @returns {number} Speed multiplier (1.0 = normal, 2.0 = double speed)
     */
    getSpeedMultiplier() {
        const effect = this.activeEffects.find(e => e.type === 'speed_boost');
        return effect ? effect.config.speedMultiplier : 1.0;
    },

    /**
     * Get all active effects
     * @returns {Array} Array of active effect objects
     */
    getActiveEffects() {
        return [...this.activeEffects];
    },

    // ==========================================
    // UPDATE
    // ==========================================

    /**
     * Update power-up system (expire old effects)
     * @param {number} dt - Delta time in seconds (not used, but kept for consistency)
     * @param {number} currentTime - Current timestamp
     */
    update(dt, currentTime) {
        // Remove expired effects
        this.activeEffects = this.activeEffects.filter(effect => {
            return currentTime < effect.expiresAt;
        });
    }
};
