// ============================================
// SLINGSHOT - Self-Contained Weapon Module
// ============================================
// Complete slingshot weapon: config, theme, mesh, animation, state
// Implements the weapon interface for WeaponOrchestrator

const Slingshot = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'slingshot',
    name: 'Slingshot',

    // ==========================================
    // CONFIGURATION (References central config)
    // ==========================================

    get config() {
        // Reference Weapon.types.SLINGSHOT for shared config
        // Add weapon-specific runtime properties
        const baseConfig = Weapon.types.SLINGSHOT;
        return {
            ...baseConfig,
            ammo: {
                max: 25,
                current: 25,
                consumePerShot: 1
            }
        };
    },

    // ==========================================
    // THEME (Colors)
    // ==========================================

    theme: {
        slingshot: {
            wood: 0x8B4513,
            woodDark: 0x5D3A1A,
            leather: 0x4a3728,
            leatherDark: 0x3d2d22,
            band: 0x654321,
            metal: 0x888888,
            stone: 0x888888
        },
        hands: {
            skin: 0xe8beac
        }
    },

    // ==========================================
    // STATE
    // ==========================================

    state: {
        isCharging: false,
        chargeAmount: 0,
        lastFireTime: 0,
        ammo: 25,
        fireAnimProgress: 0
    },

    // ==========================================
    // LIFECYCLE
    // ==========================================

    onEquip() {
        this.resetState();
    },

    onUnequip() {
        this.resetState();
    },

    resetState() {
        this.state.isCharging = false;
        this.state.chargeAmount = 0;
        this.state.lastFireTime = 0;
        this.state.fireAnimProgress = 0;
        this.state.ammo = this.config.ammo.max;
    },

    // ==========================================
    // INPUT HANDLERS
    // ==========================================

    /**
     * Called when fire button is pressed
     */
    onFireStart(time) {
        if (this.state.isCharging) return;
        if (!this.canFire(time)) return;

        this.state.isCharging = true;
        this.state.chargeAmount = this.config.charge.minTension;
    },

    /**
     * Called when fire button is released
     * @returns {Object|null} Fire result if successful
     */
    onFireRelease(time) {
        if (!this.state.isCharging) return null;
        return this.fire(time);
    },

    /**
     * Update weapon state each frame
     */
    update(dt, time) {
        // Update charge while charging
        if (this.state.isCharging) {
            if (this.state.chargeAmount < this.config.charge.maxTension) {
                this.state.chargeAmount += this.config.charge.rate * dt;
                if (this.state.chargeAmount > this.config.charge.maxTension) {
                    this.state.chargeAmount = this.config.charge.maxTension;
                }
            }
        }
    },

    /**
     * Cancel current action
     */
    cancelAction() {
        this.state.isCharging = false;
        this.state.chargeAmount = 0;
    },

    // ==========================================
    // FIRING
    // ==========================================

    /**
     * Check if weapon can fire
     */
    canFire(time) {
        if (this.state.ammo <= 0) return false;
        return (time - this.state.lastFireTime) >= this.config.cooldown;
    },

    /**
     * Fire the weapon
     * @returns {Object|null} Fire result
     */
    fire(time) {
        if (!this.canFire(time)) return null;

        const tension = this.state.chargeAmount;
        if (tension < this.config.charge.minTension) {
            this.cancelAction();
            return null;
        }

        // Calculate speed based on tension
        const speed = this.config.projectile.speed.min +
            (this.config.projectile.speed.max - this.config.projectile.speed.min) * tension;

        // Calculate damage: base + (tension * scaling) = 2 + (tension * 2)
        // Quick (0.2): 2, Half (0.5): 3, Full (1.0): 4
        const damage = this.config.projectile.damage +
            Math.round(tension * this.config.projectile.damageScaling);

        // Consume ammo
        this.state.ammo -= this.config.ammo.consumePerShot;
        if (this.state.ammo < 0) this.state.ammo = 0;

        // Update state
        this.state.lastFireTime = time;
        this.state.isCharging = false;
        this.state.chargeAmount = 0;

        return {
            speed: speed,
            power: tension,
            damage: damage,
            projectileType: this.config.projectile.type,
            count: this.config.projectile.count
        };
    },

    /**
     * Add ammo
     */
    addAmmo(amount) {
        this.state.ammo = Math.min(this.state.ammo + amount, this.config.ammo.max);
    },

    // ==========================================
    // UI HELPERS
    // ==========================================

    getTension() {
        return this.state.chargeAmount;
    },

    getAmmoDisplay() {
        if (this.state.ammo <= 0) {
            return 'EMPTY';
        }
        return `STONES: ${this.state.ammo}/${this.config.ammo.max}`;
    },

    isReloading(time) {
        return this.state.ammo <= 0;
    },

    // ==========================================
    // MESH CREATION (Delegates to SlingshotMesh)
    // ==========================================

    /**
     * Create FPS weapon mesh (slingshot with hands)
     * @param {THREE} THREE - Three.js library
     * @param {Object} materials - Optional materials library
     * @returns {Object} Weapon mesh and animation references
     */
    createFPSMesh(THREE, materials) {
        return SlingshotMesh.createFPSMesh(THREE, materials, this.theme);
    },

    /**
     * Create pickup mesh for floor pickup
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group} Pickup mesh
     */
    createPickupMesh(THREE) {
        return SlingshotMesh.createPickupMesh(THREE, this.theme);
    },

    // ==========================================
    // ANIMATION (Delegates to SlingshotAnimation)
    // ==========================================

    /**
     * Animate FPS weapon based on state
     * @param {Object} refs - References from createFPSMesh
     * @param {number} dt - Delta time
     */
    animateFPS(refs, dt) {
        // Decay fire animation progress
        if (this.state.fireAnimProgress > 0) {
            this.state.fireAnimProgress -= dt * 8;
            if (this.state.fireAnimProgress < 0) this.state.fireAnimProgress = 0;
        }

        // Delegate to animation module
        SlingshotAnimation.animateFPS(refs, this.state, dt);
    },

    /**
     * Trigger fire animation
     */
    triggerFireAnim() {
        this.state.fireAnimProgress = 1.0;
    },

    /**
     * Check if fire animation is playing
     */
    isFireAnimPlaying() {
        return this.state.fireAnimProgress > 0;
    },

    /**
     * Update FPS weapon transform (lean/sway)
     */
    updateTransform(weapon, turnRate) {
        SlingshotAnimation.updateTransform(weapon, turnRate);
    }
};
