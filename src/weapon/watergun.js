// ============================================
// WATER GUN - Self-Contained Weapon Module
// ============================================
// Pump-action water blaster: fires arcing water balloons with splash damage
// Implements the weapon interface for WeaponOrchestrator

const WaterGun = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'watergun',
    name: 'Water Blaster',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    get config() {
        const baseConfig = Weapon.types.WATERGUN;
        return {
            ...baseConfig,
            ammo: {
                max: 30,
                current: 30,
                consumePerShot: 1
            }
        };
    },

    // ==========================================
    // THEME (Colors - Bright Toy Water Gun)
    // ==========================================

    theme: {
        body: 0x3498db,           // Bright blue
        bodyLight: 0x5dade2,
        tank: 0x85c1e9,           // Translucent tank
        tankWater: 0x2980b9,      // Water inside
        pump: 0xf39c12,           // Orange pump
        pumpAccent: 0xe67e22,
        nozzle: 0x7f8c8d,
        trigger: 0x2c3e50
    },

    // ==========================================
    // STATE
    // ==========================================

    state: {
        isCharging: false,
        chargeAmount: 0,
        lastFireTime: 0,
        ammo: 30,
        fireAnimProgress: 0,
        pumpAnim: 0
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
        this.state.pumpAnim = 0;
        this.state.ammo = this.config.ammo.max;
    },

    // ==========================================
    // INPUT HANDLERS
    // ==========================================

    /**
     * Fire on button press (single shot)
     */
    onFireStart(time) {
        if (this.state.ammo <= 0) return null;
        if (!this.canFire(time)) return null;
        return this.fire(time);
    },

    /**
     * Nothing on release
     */
    onFireRelease(time) {
        return null;
    },

    /**
     * Update - just animations
     */
    update(dt, time) {
        // Update pump animation
        if (this.state.pumpAnim > 0) {
            this.state.pumpAnim -= dt * 4;
            if (this.state.pumpAnim < 0) this.state.pumpAnim = 0;
        }
        return null;
    },

    cancelAction() {
        // Nothing to cancel for single-shot
    },

    // ==========================================
    // FIRING
    // ==========================================

    canFire(time) {
        if (this.state.ammo <= 0) return false;
        return (time - this.state.lastFireTime) >= this.config.cooldown;
    },

    fire(time) {
        if (!this.canFire(time)) return null;

        this.state.ammo -= this.config.ammo.consumePerShot;
        if (this.state.ammo < 0) this.state.ammo = 0;

        this.state.lastFireTime = time;
        this.state.pumpAnim = 1.0;
        this.state.fireAnimProgress = 1.0;

        return {
            speed: this.config.projectile.speed.max,
            power: 1.0,
            damage: this.config.projectile.damage,
            projectileType: this.config.projectile.type,
            count: this.config.projectile.count,
            gravity: this.config.projectile.gravity,
            splashRadius: this.config.projectile.splashRadius,
            splashDamage: this.config.projectile.splashDamage
        };
    },

    addAmmo(amount) {
        this.state.ammo = Math.min(this.state.ammo + amount, this.config.ammo.max);
    },

    // ==========================================
    // UI HELPERS
    // ==========================================

    getTension() {
        return this.state.ammo / this.config.ammo.max;
    },

    getAmmoDisplay() {
        if (this.state.ammo <= 0) {
            return 'EMPTY';
        }
        return `WATER: ${this.state.ammo}/${this.config.ammo.max}`;
    },

    isReloading(time) {
        return this.state.ammo <= 0;
    },

    // ==========================================
    // MESH CREATION
    // ==========================================

    createFPSMesh(THREE, materials) {
        return WaterGunMesh.createFPSMesh(THREE, materials, this.theme);
    },

    createPickupMesh(THREE) {
        return WaterGunMesh.createPickupMesh(THREE, this.theme);
    },

    // ==========================================
    // ANIMATION
    // ==========================================

    animateFPS(refs, dt) {
        // Fire animation decay (state management stays here)
        if (this.state.fireAnimProgress > 0) {
            this.state.fireAnimProgress -= dt * 5;
            if (this.state.fireAnimProgress < 0) this.state.fireAnimProgress = 0;
        }
        // Delegate to animation module
        WaterGunAnimation.animateFPS(refs, this.state, dt, this.config);
    },

    triggerFireAnim() {
        this.state.pumpAnim = 1.0;
        this.state.fireAnimProgress = 1.0;
    },

    isFireAnimPlaying() {
        return this.state.pumpAnim > 0;
    },

    updateTransform(weapon, turnRate) {
        WaterGunAnimation.updateTransform(weapon, turnRate);
    }
};
