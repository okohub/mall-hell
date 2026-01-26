// ============================================
// LASER GUN - Self-Contained Weapon Module
// ============================================
// Auto-fire energy weapon: hold to shoot rapid laser bolts
// Implements the weapon interface for WeaponOrchestrator

const LaserGun = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'lasergun',
    name: 'Laser Blaster',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    get config() {
        const baseConfig = Weapon.types.LASERGUN;
        return {
            ...baseConfig,
            ammo: {
                max: 60,
                current: 60,
                consumePerShot: 1
            }
        };
    },

    // ==========================================
    // THEME (Colors - Sci-Fi Red/Teal)
    // ==========================================

    theme: {
        body: 0x2c3e50,           // Dark metallic body
        bodyLight: 0x34495e,
        accent: 0x1abc9c,         // Teal accents
        emitter: 0xe74c3c,        // Red emitter
        emitterGlow: 0xff6b6b,    // Bright red glow
        energyCell: 0x3498db,     // Blue energy cell
        grip: 0x1a1a1a
    },

    // ==========================================
    // STATE
    // ==========================================

    state: {
        isCharging: false,  // Used as "isFiring" for auto weapons
        chargeAmount: 0,
        lastFireTime: 0,
        ammo: 60,
        fireAnimProgress: 0,
        isFiring: false,
        glowPulse: 0
    },

    // ==========================================
    // LIFECYCLE
    // ==========================================

    onEquip() {
        this.resetState();
    },

    onUnequip() {
        this.state.isFiring = false;
        this.state.isCharging = false;
    },

    resetState() {
        this.state.isCharging = false;
        this.state.isFiring = false;
        this.state.chargeAmount = 0;
        this.state.lastFireTime = 0;
        this.state.fireAnimProgress = 0;
        this.state.glowPulse = 0;
        this.state.ammo = this.config.ammo.max;
    },

    // ==========================================
    // INPUT HANDLERS
    // ==========================================

    onFireStart(time) {
        if (this.state.ammo <= 0) return;
        this.state.isFiring = true;
        this.state.isCharging = true;
    },

    onFireRelease(time) {
        this.state.isFiring = false;
        this.state.isCharging = false;
        return null;
    },

    update(dt, time) {
        // Auto-fire while holding
        if (this.state.isFiring && this.state.ammo > 0) {
            if (this.canFire(time)) {
                return this.fire(time);
            }
        }

        // Update glow pulse animation
        this.state.glowPulse += dt * 8;
        if (this.state.glowPulse > Math.PI * 2) this.state.glowPulse = 0;

        return null;
    },

    cancelAction() {
        this.state.isFiring = false;
        this.state.isCharging = false;
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

        if (this.state.ammo <= 0) {
            this.state.isFiring = false;
            this.state.isCharging = false;
        }

        const spreadX = (Math.random() - 0.5) * this.config.projectile.spread;
        const spreadY = (Math.random() - 0.5) * this.config.projectile.spread;

        return {
            speed: this.config.projectile.speed.max,
            power: 1.0,
            damage: this.config.projectile.damage,
            projectileType: this.config.projectile.type,
            count: this.config.projectile.count,
            spread: { x: spreadX, y: spreadY }
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
        return `ENERGY: ${this.state.ammo}/${this.config.ammo.max}`;
    },

    isReloading(time) {
        return this.state.ammo <= 0;
    },

    // ==========================================
    // MESH CREATION
    // ==========================================

    createFPSMesh(THREE, materials) {
        return LaserGunMesh.createFPSMesh(THREE, materials, this.theme);
    },

    createPickupMesh(THREE) {
        return LaserGunMesh.createPickupMesh(THREE, this.theme);
    },

    // ==========================================
    // ANIMATION
    // ==========================================

    animateFPS(refs, dt) {
        // Fire animation decay (state management stays here)
        if (this.state.fireAnimProgress > 0) {
            this.state.fireAnimProgress -= dt * 15;
            if (this.state.fireAnimProgress < 0) this.state.fireAnimProgress = 0;
        }
        // Delegate to animation module
        LaserGunAnimation.animateFPS(refs, this.state, dt, this.config);
    },

    triggerFireAnim() {
        this.state.fireAnimProgress = 1.0;
    },

    isFireAnimPlaying() {
        return this.state.fireAnimProgress > 0;
    },

    updateTransform(weapon, turnRate) {
        LaserGunAnimation.updateTransform(weapon, turnRate);
    }
};
