// ============================================
// LASER GUN - Self-Contained Weapon Module
// ============================================
// Auto-fire energy weapon: hold to shoot rapid laser bolts
// Implements the weapon interface for WeaponManager

const LaserGun = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'lasergun',
    name: 'Laser Blaster',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    config: {
        fireMode: 'auto',    // Hold to continuously fire
        cooldown: 50,        // 20 shots per second
        range: 100,          // Good range for laser
        aimAssist: true,

        ammo: {
            max: 60,
            current: 60,
            consumePerShot: 1
        },

        projectile: {
            type: 'laser',
            speed: { min: 120, max: 120 },  // Fast, constant speed
            damage: 0.5,                     // Less damage per hit, high DPS
            count: 1,
            spread: 0.05                     // Minimal spread - accurate
        },

        charge: null  // No charge mechanic
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
        const fpsWeapon = new THREE.Group();
        const fpsHands = new THREE.Group();

        // Materials
        const skinMat = materials?.skin || new THREE.MeshStandardMaterial({
            color: 0xffd4c4, roughness: 0.4, metalness: 0.0
        });

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.theme.body,
            roughness: 0.2,
            metalness: 0.8
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: this.theme.accent,
            roughness: 0.3,
            metalness: 0.6,
            emissive: this.theme.accent,
            emissiveIntensity: 0.3
        });

        const emitterMat = new THREE.MeshStandardMaterial({
            color: this.theme.emitter,
            roughness: 0.1,
            metalness: 0.2,
            emissive: this.theme.emitterGlow,
            emissiveIntensity: 0.8
        });

        const cellMat = new THREE.MeshStandardMaterial({
            color: this.theme.energyCell,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            emissive: this.theme.energyCell,
            emissiveIntensity: 0.4
        });

        const gripMat = new THREE.MeshStandardMaterial({
            color: this.theme.grip,
            roughness: 0.9,
            metalness: 0.1
        });

        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, roughness: 0.9, metalness: 0.0
        });

        // === LASER GUN BODY ===
        const laserGun = new THREE.Group();

        // Main body - angular sci-fi shape
        const bodyGeo = new THREE.BoxGeometry(0.06, 0.08, 0.28);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0, 0);
        laserGun.add(body);

        // Top rail
        const railGeo = new THREE.BoxGeometry(0.03, 0.02, 0.2);
        const rail = new THREE.Mesh(railGeo, bodyMat);
        rail.position.set(0, 0.05, -0.02);
        laserGun.add(rail);

        // Side panels (teal accents)
        const panelGeo = new THREE.BoxGeometry(0.005, 0.05, 0.15);
        const leftPanel = new THREE.Mesh(panelGeo, accentMat);
        leftPanel.position.set(-0.035, 0, -0.03);
        laserGun.add(leftPanel);

        const rightPanel = new THREE.Mesh(panelGeo, accentMat);
        rightPanel.position.set(0.035, 0, -0.03);
        laserGun.add(rightPanel);

        // Handle/grip
        const handleGeo = new THREE.BoxGeometry(0.05, 0.14, 0.06);
        const handle = new THREE.Mesh(handleGeo, gripMat);
        handle.position.set(0, -0.08, 0.06);
        handle.rotation.x = 0.25;
        laserGun.add(handle);

        // Energy cell (blue, glowing)
        const cellGeo = new THREE.BoxGeometry(0.04, 0.06, 0.08);
        const cell = new THREE.Mesh(cellGeo, cellMat);
        cell.position.set(0, -0.01, 0.08);
        laserGun.add(cell);
        laserGun.userData.cell = cell;

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.12, 8);
        const barrel = new THREE.Mesh(barrelGeo, bodyMat);
        barrel.position.set(0, 0, -0.18);
        barrel.rotation.x = Math.PI / 2;
        laserGun.add(barrel);

        // Emitter (red, glowing) - the business end
        const emitterGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.04, 8);
        const emitter = new THREE.Mesh(emitterGeo, emitterMat);
        emitter.position.set(0, 0, -0.24);
        emitter.rotation.x = Math.PI / 2;
        laserGun.add(emitter);
        laserGun.userData.emitter = emitter;

        // Emitter glow ring
        const glowRingGeo = new THREE.TorusGeometry(0.018, 0.004, 8, 16);
        const glowRing = new THREE.Mesh(glowRingGeo, emitterMat);
        glowRing.position.set(0, 0, -0.22);
        laserGun.add(glowRing);
        laserGun.userData.glowRing = glowRing;

        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.015, 0.04, 0.015);
        const trigger = new THREE.Mesh(triggerGeo, accentMat);
        trigger.position.set(0, -0.04, 0.03);
        trigger.rotation.x = 0.3;
        laserGun.add(trigger);
        laserGun.userData.trigger = trigger;

        // Position laser gun
        laserGun.position.set(0.1, -0.06, -0.35);
        laserGun.rotation.set(0.05, -0.08, 0);

        // === HANDS ===
        const rightHandGeo = new THREE.BoxGeometry(0.08, 0.1, 0.04);
        const rightHand = new THREE.Mesh(rightHandGeo, skinMat);
        rightHand.position.set(0.1, -0.14, -0.28);
        rightHand.rotation.set(0.25, -0.08, 0);
        fpsHands.add(rightHand);

        const rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        rightArm.position.set(0.15, -0.32, -0.18);
        rightArm.rotation.set(-0.7, 0.2, 0.3);
        fpsHands.add(rightArm);

        const leftHandGeo = new THREE.BoxGeometry(0.07, 0.08, 0.04);
        const leftHand = new THREE.Mesh(leftHandGeo, skinMat);
        leftHand.position.set(0.04, -0.08, -0.42);
        leftHand.rotation.set(0.15, 0.2, -0.1);
        fpsHands.add(leftHand);

        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        leftArm.position.set(-0.06, -0.28, -0.28);
        leftArm.rotation.set(-0.5, -0.3, -0.2);
        fpsHands.add(leftArm);

        fpsHands.add(laserGun);
        fpsHands.userData.laserGun = laserGun;

        fpsWeapon.add(fpsHands);
        fpsWeapon.position.set(0.12, -0.08, -0.4);
        fpsWeapon.rotation.set(0.05, -0.1, 0);

        return {
            weapon: fpsWeapon,
            hands: fpsHands,
            laserGun: laserGun,
            cell: cell,
            emitter: emitter,
            glowRing: glowRing,
            trigger: trigger
        };
    },

    createPickupMesh(THREE) {
        const pickup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.theme.body,
            roughness: 0.2,
            metalness: 0.8,
            emissive: this.theme.body,
            emissiveIntensity: 0.1
        });

        const emitterMat = new THREE.MeshStandardMaterial({
            color: this.theme.emitter,
            emissive: this.theme.emitterGlow,
            emissiveIntensity: 0.8
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: this.theme.accent,
            emissive: this.theme.accent,
            emissiveIntensity: 0.4
        });

        // Body
        const bodyGeo = new THREE.BoxGeometry(0.15, 0.2, 0.6);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        pickup.add(body);

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.25, 8);
        const barrel = new THREE.Mesh(barrelGeo, bodyMat);
        barrel.position.set(0, 0.02, -0.4);
        barrel.rotation.x = Math.PI / 2;
        pickup.add(barrel);

        // Emitter tip
        const emitterGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.08, 8);
        const emitter = new THREE.Mesh(emitterGeo, emitterMat);
        emitter.position.set(0, 0.02, -0.52);
        emitter.rotation.x = Math.PI / 2;
        pickup.add(emitter);

        // Accent stripes
        const stripeGeo = new THREE.BoxGeometry(0.16, 0.02, 0.1);
        const stripe = new THREE.Mesh(stripeGeo, accentMat);
        stripe.position.set(0, 0.11, 0);
        pickup.add(stripe);

        // Glow
        const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.theme.emitterGlow,
            transparent: true,
            opacity: 0.25
        });
        pickup.add(new THREE.Mesh(glowGeo, glowMat));

        return pickup;
    },

    // ==========================================
    // ANIMATION
    // ==========================================

    animateFPS(refs, dt) {
        if (!refs) return;

        const { cell, emitter, glowRing, trigger, laserGun } = refs;

        // Animate energy cell based on ammo
        if (cell) {
            const ammoPercent = this.state.ammo / this.config.ammo.max;
            cell.scale.y = Math.max(0.2, ammoPercent);
            cell.material.emissiveIntensity = 0.2 + ammoPercent * 0.4;
        }

        // Pulse emitter glow when firing or idle
        if (emitter) {
            const pulse = Math.sin(this.state.glowPulse) * 0.3 + 0.7;
            const intensity = this.state.isFiring ? 1.2 : pulse * 0.8;
            emitter.material.emissiveIntensity = intensity;
        }

        if (glowRing) {
            glowRing.rotation.z += dt * 3;
        }

        // Trigger animation
        if (trigger) {
            trigger.rotation.x = this.state.isFiring ? 0.5 : 0.3;
        }

        // Recoil
        if (laserGun && this.state.fireAnimProgress > 0) {
            this.state.fireAnimProgress -= dt * 15;
            if (this.state.fireAnimProgress < 0) this.state.fireAnimProgress = 0;
            laserGun.position.z = -0.35 + this.state.fireAnimProgress * 0.015;
        }
    },

    triggerFireAnim() {
        this.state.fireAnimProgress = 1.0;
    },

    isFireAnimPlaying() {
        return this.state.fireAnimProgress > 0;
    },

    updateTransform(weapon, turnRate) {
        if (!weapon) return;

        const weaponLeanAngle = -turnRate * 0.12;
        const weaponSway = turnRate * 0.025;

        weapon.rotation.z = weapon.rotation.z * 0.85 + weaponLeanAngle * 0.15;
        weapon.position.x = 0.12 + weapon.position.x * 0.9 + weaponSway * 0.1;
        weapon.position.x = Math.max(0.08, Math.min(0.18, weapon.position.x));
    }
};
