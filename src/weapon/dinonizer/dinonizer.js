// ============================================
// DINONIZER - Special Weapon Module
// ============================================
// Precision beam that turns enemies into collectible dino toys

var WeaponTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.WeaponTypeRegistry = globalThis.WeaponTypeRegistry || {})
    : {};

const Dinonizer = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'dinonizer',
    name: 'Dinonizer',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    get config() {
        const baseConfig = Weapon.types.DINONIZER;
        return {
            ...baseConfig,
            ammo: {
                max: 10,
                current: 10,
                consumePerShot: 1
            }
        };
    },

    // ==========================================
    // THEME
    // ==========================================

    theme: {
        body: 0x4d3b1f,
        accent: 0xffc857,
        core: 0xffd166,
        coreGlow: 0xfff1a8,
        grip: 0x2b1d0f
    },

    // ==========================================
    // STATE
    // ==========================================

    state: {
        lastFireTime: 0,
        ammo: 10,
        fireAnimProgress: 0
    },

    // ==========================================
    // LIFECYCLE
    // ==========================================

    onEquip() {
        this.resetState();
    },

    onUnequip() {
        // No-op
    },

    resetState() {
        this.state.lastFireTime = 0;
        this.state.fireAnimProgress = 0;
        this.state.ammo = this.config.ammo.max;
    },

    // ==========================================
    // INPUT HANDLERS
    // ==========================================

    onFireStart(time) {
        if (this.state.ammo <= 0) return null;
        if (!this.canFire(time)) return null;
        return this.fire(time);
    },

    onFireRelease() {
        return null;
    },

    update(dt, time) {
        if (this.state.fireAnimProgress > 0) {
            this.state.fireAnimProgress -= dt * 12;
            if (this.state.fireAnimProgress < 0) this.state.fireAnimProgress = 0;
        }
        return null;
    },

    cancelAction() {
        // No-op for single-shot
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
        this.state.fireAnimProgress = 1.0;

        return {
            speed: this.config.projectile.speed.max,
            power: 1.0,
            damage: this.config.projectile.damage,
            projectileType: this.config.projectile.type,
            count: this.config.projectile.count
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
            return 'DEPLETED';
        }
        return `DINO: ${this.state.ammo}/${this.config.ammo.max}`;
    },

    isReloading() {
        return this.state.ammo <= 0;
    },

    // ==========================================
    // MESH CREATION
    // ==========================================

    createFPSMesh(THREE, materials) {
        return DinonizerMesh.createFPSMesh(THREE, materials, this.theme);
    },

    createPickupMesh(THREE) {
        return DinonizerMesh.createPickupMesh(THREE, this.theme);
    },

    // ==========================================
    // ANIMATION
    // ==========================================

    animateFPS(refs, dt) {
        DinonizerAnimation.animateFPS(refs, this.state, dt, this.config);
    },

    updateTransform(weapon, turnRate) {
        DinonizerAnimation.updateTransform(weapon, turnRate);
    }
};

WeaponTypeRegistry.dinonizer = Dinonizer;
