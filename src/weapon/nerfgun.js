// ============================================
// NERF GUN - Self-Contained Weapon Module
// ============================================
// Single-shot foam dart launcher
// Implements the weapon interface for WeaponOrchestrator

const NerfGun = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'nerfgun',
    name: 'Nerf Blaster',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    get config() {
        const baseConfig = Weapon.types.NERFGUN;
        return {
            ...baseConfig,
            ammo: {
                max: 12,
                current: 12,
                consumePerShot: 1
            }
        };
    },

    // ==========================================
    // THEME (Colors)
    // ==========================================

    theme: {
        body: 0xe74c3c,       // Orange-red body
        bodyLight: 0xf39c12,
        accent: 0xf1c40f,     // Yellow accents
        barrel: 0x7f8c8d,
        trigger: 0x2c3e50,
        dart: 0xe67e22
    },

    // ==========================================
    // STATE
    // ==========================================

    state: {
        isCharging: false,
        chargeAmount: 0,
        lastFireTime: 0,
        ammo: 12,
        fireAnimProgress: 0,
        slideAnim: 0
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
        this.state.slideAnim = 0;
        // Restore ammo on equip
        this.state.ammo = this.config.ammo.max;
    },

    // ==========================================
    // INPUT HANDLERS
    // ==========================================

    /**
     * Called when fire button is pressed
     */
    onFireStart(time) {
        // Single-shot fires on press
        if (this.state.ammo > 0 && this.canFire(time)) {
            return this.fire(time);
        }
        return null;
    },

    /**
     * Called when fire button is released
     */
    onFireRelease(time) {
        // Single-shot doesn't do anything on release
        return null;
    },

    /**
     * Update weapon state each frame
     */
    update(dt, time) {
        // Update slide animation
        if (this.state.slideAnim > 0) {
            this.state.slideAnim -= dt * 6;
            if (this.state.slideAnim < 0) this.state.slideAnim = 0;
        }

        // Update fire animation
        if (this.state.fireAnimProgress > 0) {
            this.state.fireAnimProgress -= dt * 8;
            if (this.state.fireAnimProgress < 0) this.state.fireAnimProgress = 0;
        }
    },

    /**
     * Cancel current action
     */
    cancelAction() {
        // Nothing to cancel for single-shot
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

        // Consume ammo
        this.state.ammo -= this.config.ammo.consumePerShot;
        if (this.state.ammo < 0) this.state.ammo = 0;

        // Update state
        this.state.lastFireTime = time;
        this.state.fireAnimProgress = 1.0;
        this.state.slideAnim = 1.0;

        return {
            speed: this.config.projectile.speed.max,
            power: 1.0,
            damage: this.config.projectile.damage,
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
        // Show ammo percentage for UI
        return this.state.ammo / this.config.ammo.max;
    },

    getAmmoDisplay() {
        if (this.state.ammo <= 0) {
            return 'EMPTY';
        }
        return `DARTS: ${this.state.ammo}/${this.config.ammo.max}`;
    },

    isReloading(time) {
        return this.state.ammo <= 0 || !this.canFire(time);
    },

    // ==========================================
    // MESH CREATION
    // ==========================================

    createFPSMesh(THREE, materials) {
        return NerfGunMesh.createFPSMesh(THREE, materials, this.theme);
    },

    createPickupMesh(THREE) {
        return NerfGunMesh.createPickupMesh(THREE, this.theme);
    },

    // ==========================================
    // ANIMATION
    // ==========================================

    animateFPS(refs, dt) {
        NerfGunAnimation.animateFPS(refs, this.state, dt);
    },

    triggerFireAnim() {
        this.state.fireAnimProgress = 1.0;
        this.state.slideAnim = 1.0;
    },

    isFireAnimPlaying() {
        return this.state.fireAnimProgress > 0;
    },

    updateTransform(weapon, turnRate) {
        NerfGunAnimation.updateTransform(weapon, turnRate);
    }
};
