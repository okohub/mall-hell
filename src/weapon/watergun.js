// ============================================
// WATER GUN - Self-Contained Weapon Module
// ============================================
// Auto-fire water gun: hold to spray water droplets
// Implements the weapon interface for WeaponManager

const WaterGun = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'watergun',
    name: 'Water Gun',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    config: {
        fireMode: 'auto',    // Hold to continuously fire
        cooldown: 50,        // 20 shots per second
        range: 80,           // Shorter range for water gun (enemies spawn at 150)
        aimAssist: true,

        ammo: {
            max: 60,
            current: 60,
            consumePerShot: 1
        },

        projectile: {
            type: 'water',
            speed: { min: 80, max: 80 },  // Constant speed
            damage: 0.5,                  // Less damage per hit
            count: 1,
            spread: 0.1                   // Slight random spread
        },

        charge: null  // No charge mechanic
    },

    // ==========================================
    // THEME (Colors)
    // ==========================================

    theme: {
        body: 0x3498db,       // Blue body
        bodyLight: 0x5dade2,
        tank: 0x85c1e9,       // Transparent tank
        tankWater: 0x2980b9,
        trigger: 0x2c3e50,
        nozzle: 0x7f8c8d
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
        pumpAnim: 0
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
        this.state.pumpAnim = 0;
        // Restore ammo to max on equip
        this.state.ammo = this.config.ammo.max;
    },

    // ==========================================
    // INPUT HANDLERS
    // ==========================================

    /**
     * Called when fire button is pressed - start spraying
     */
    onFireStart(time) {
        if (this.state.ammo <= 0) return;
        this.state.isFiring = true;
        this.state.isCharging = true; // For UI compatibility
    },

    /**
     * Called when fire button is released - stop spraying
     * @returns {null} Auto weapons fire during update, not on release
     */
    onFireRelease(time) {
        this.state.isFiring = false;
        this.state.isCharging = false;
        return null; // Auto weapons don't fire on release
    },

    /**
     * Update weapon state each frame
     * @returns {Object|null} Fire result if firing this frame
     */
    update(dt, time) {
        // Auto-fire while holding
        if (this.state.isFiring && this.state.ammo > 0) {
            if (this.canFire(time)) {
                return this.fire(time);
            }
        }

        // Update pump animation
        if (this.state.pumpAnim > 0) {
            this.state.pumpAnim -= dt * 10;
            if (this.state.pumpAnim < 0) this.state.pumpAnim = 0;
        }

        return null;
    },

    /**
     * Cancel current action
     */
    cancelAction() {
        this.state.isFiring = false;
        this.state.isCharging = false;
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
        this.state.pumpAnim = 1.0;

        // Stop firing if out of ammo
        if (this.state.ammo <= 0) {
            this.state.isFiring = false;
            this.state.isCharging = false;
        }

        // Calculate spread
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
        // Water gun shows ammo percentage as "tension" for UI
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

    /**
     * Create FPS weapon mesh
     */
    createFPSMesh(THREE, materials) {
        const fpsWeapon = new THREE.Group();
        const fpsHands = new THREE.Group();

        // Materials
        const skinMat = materials?.skin || new THREE.MeshStandardMaterial({
            color: 0xffd4c4,
            roughness: 0.4,
            metalness: 0.0
        });

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.theme.body,
            roughness: 0.4,
            metalness: 0.1
        });

        const tankMat = new THREE.MeshStandardMaterial({
            color: this.theme.tank,
            transparent: true,
            opacity: 0.6,
            roughness: 0.2,
            metalness: 0.0
        });

        const waterMat = new THREE.MeshStandardMaterial({
            color: this.theme.tankWater,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.0
        });

        const nozzleMat = new THREE.MeshStandardMaterial({
            color: this.theme.nozzle,
            roughness: 0.6,
            metalness: 0.3
        });

        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            roughness: 0.9,
            metalness: 0.0
        });

        // === WATER GUN BODY ===
        const waterGun = new THREE.Group();

        // Main body
        const bodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.25);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0, 0);
        waterGun.add(body);

        // Handle/grip
        const handleGeo = new THREE.BoxGeometry(0.06, 0.15, 0.08);
        const handle = new THREE.Mesh(handleGeo, bodyMat);
        handle.position.set(0, -0.1, 0.05);
        handle.rotation.x = 0.3;
        waterGun.add(handle);

        // Water tank (on top)
        const tankGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16);
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, 0.1, -0.02);
        waterGun.add(tank);

        // Water inside tank (animated based on ammo)
        const waterGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 16);
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(0, 0.1, -0.02);
        waterGun.add(water);
        waterGun.userData.water = water;

        // Nozzle
        const nozzleGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.1, 12);
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.position.set(0, 0.02, -0.17);
        nozzle.rotation.x = Math.PI / 2;
        waterGun.add(nozzle);

        // Nozzle tip
        const tipGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.03, 8);
        const tip = new THREE.Mesh(tipGeo, nozzleMat);
        tip.position.set(0, 0.02, -0.22);
        tip.rotation.x = Math.PI / 2;
        waterGun.add(tip);

        // Trigger
        const triggerMat = new THREE.MeshStandardMaterial({
            color: this.theme.trigger,
            roughness: 0.8
        });
        const triggerGeo = new THREE.BoxGeometry(0.02, 0.06, 0.02);
        const trigger = new THREE.Mesh(triggerGeo, triggerMat);
        trigger.position.set(0, -0.04, 0.04);
        trigger.rotation.x = 0.3;
        waterGun.add(trigger);
        waterGun.userData.trigger = trigger;

        // Position water gun
        waterGun.position.set(0.1, -0.08, -0.35);
        waterGun.rotation.set(0.1, -0.1, 0);

        // === SIMPLIFIED HANDS ===
        // Right hand holding grip
        const rightHandGeo = new THREE.BoxGeometry(0.08, 0.1, 0.04);
        const rightHand = new THREE.Mesh(rightHandGeo, skinMat);
        rightHand.position.set(0.1, -0.18, -0.3);
        rightHand.rotation.set(0.3, -0.1, 0);
        fpsHands.add(rightHand);

        // Right arm
        const rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        rightArm.position.set(0.15, -0.35, -0.2);
        rightArm.rotation.set(-0.7, 0.2, 0.3);
        fpsHands.add(rightArm);

        // Left hand supporting
        const leftHandGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
        const leftHand = new THREE.Mesh(leftHandGeo, skinMat);
        leftHand.position.set(0.02, -0.1, -0.4);
        leftHand.rotation.set(0.2, 0.3, -0.1);
        fpsHands.add(leftHand);
        fpsHands.userData.leftHand = leftHand;

        // Left arm
        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        leftArm.position.set(-0.08, -0.3, -0.25);
        leftArm.rotation.set(-0.5, -0.3, -0.2);
        fpsHands.add(leftArm);

        fpsHands.add(waterGun);
        fpsHands.userData.waterGun = waterGun;

        fpsWeapon.add(fpsHands);
        fpsWeapon.position.set(0.12, -0.1, -0.4);
        fpsWeapon.rotation.set(0.05, -0.1, 0);

        return {
            weapon: fpsWeapon,
            hands: fpsHands,
            waterGun: waterGun,
            water: water,
            trigger: trigger,
            leftHand: leftHand
        };
    },

    /**
     * Create pickup mesh
     */
    createPickupMesh(THREE) {
        const pickup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.theme.body,
            roughness: 0.4,
            metalness: 0.1,
            emissive: this.theme.body,
            emissiveIntensity: 0.2
        });

        // Simplified water gun
        const bodyGeo = new THREE.BoxGeometry(0.2, 0.3, 0.6);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        pickup.add(body);

        // Tank
        const tankMat = new THREE.MeshStandardMaterial({
            color: this.theme.tank,
            transparent: true,
            opacity: 0.7
        });
        const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12);
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, 0.25, -0.05);
        pickup.add(tank);

        // Nozzle
        const nozzleGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8);
        const nozzle = new THREE.Mesh(nozzleGeo, bodyMat);
        nozzle.position.set(0, 0.05, -0.4);
        nozzle.rotation.x = Math.PI / 2;
        pickup.add(nozzle);

        // Glow
        const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.25
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        pickup.add(glow);

        return pickup;
    },

    // ==========================================
    // ANIMATION
    // ==========================================

    /**
     * Animate FPS weapon
     */
    animateFPS(refs, dt) {
        if (!refs) return;

        const { water, trigger, waterGun } = refs;

        // Animate water level based on ammo
        if (water) {
            const ammoPercent = this.state.ammo / this.config.ammo.max;
            water.scale.y = Math.max(0.1, ammoPercent);
            water.position.y = 0.1 - (1 - ammoPercent) * 0.05;
        }

        // Animate trigger while firing
        if (trigger) {
            if (this.state.isFiring) {
                trigger.rotation.x = 0.3 + 0.2;  // Pressed
            } else {
                trigger.rotation.x = 0.3;  // Released
            }
        }

        // Subtle recoil while firing
        if (waterGun && this.state.pumpAnim > 0) {
            const recoil = this.state.pumpAnim * 0.01;
            waterGun.position.z = -0.35 + recoil;
        }
    },

    triggerFireAnim() {
        this.state.pumpAnim = 1.0;
    },

    isFireAnimPlaying() {
        return this.state.pumpAnim > 0;
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
