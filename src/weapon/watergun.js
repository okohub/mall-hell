// ============================================
// WATER GUN - Self-Contained Weapon Module
// ============================================
// Pump-action water blaster: fires arcing water balloons with splash damage
// Implements the weapon interface for WeaponManager

const WaterGun = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'watergun',
    name: 'Water Blaster',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    config: {
        fireMode: 'single',   // Tap to fire water balloons
        cooldown: 350,        // Moderate fire rate
        range: 90,            // Medium range
        aimAssist: true,

        ammo: {
            max: 30,
            current: 30,
            consumePerShot: 1
        },

        projectile: {
            type: 'water',
            speed: { min: 45, max: 45 },   // Slower - arcs more
            damage: 1.0,                    // Direct hit damage
            count: 1,
            gravity: 18,                    // Strong arc
            splashRadius: 5,                // Splash damage radius
            splashDamage: 0.5               // Splash damage to nearby
        },

        charge: null  // No charge mechanic
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
        const fpsWeapon = new THREE.Group();
        const fpsHands = new THREE.Group();

        // Materials
        const skinMat = materials?.skin || new THREE.MeshStandardMaterial({
            color: 0xffd4c4, roughness: 0.4, metalness: 0.0
        });

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.theme.body,
            roughness: 0.5,
            metalness: 0.1
        });

        const bodyLightMat = new THREE.MeshStandardMaterial({
            color: this.theme.bodyLight,
            roughness: 0.5,
            metalness: 0.1
        });

        const tankMat = new THREE.MeshStandardMaterial({
            color: this.theme.tank,
            transparent: true,
            opacity: 0.5,
            roughness: 0.2,
            metalness: 0.0
        });

        const waterMat = new THREE.MeshStandardMaterial({
            color: this.theme.tankWater,
            transparent: true,
            opacity: 0.75,
            roughness: 0.1,
            metalness: 0.0
        });

        const pumpMat = new THREE.MeshStandardMaterial({
            color: this.theme.pump,
            roughness: 0.6,
            metalness: 0.1
        });

        const nozzleMat = new THREE.MeshStandardMaterial({
            color: this.theme.nozzle,
            roughness: 0.4,
            metalness: 0.3
        });

        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x2980b9, roughness: 0.9, metalness: 0.0
        });

        // === WATER GUN BODY ===
        const waterGun = new THREE.Group();

        // Main body - chunky toy shape
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.14, 0.3);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0, 0);
        waterGun.add(body);

        // Top ridge
        const ridgeGeo = new THREE.BoxGeometry(0.08, 0.03, 0.22);
        const ridge = new THREE.Mesh(ridgeGeo, bodyLightMat);
        ridge.position.set(0, 0.08, -0.02);
        waterGun.add(ridge);

        // Handle/grip
        const handleGeo = new THREE.BoxGeometry(0.07, 0.16, 0.08);
        const handle = new THREE.Mesh(handleGeo, bodyMat);
        handle.position.set(0, -0.1, 0.06);
        handle.rotation.x = 0.3;
        waterGun.add(handle);

        // Water tank (large, on top)
        const tankGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.14, 16);
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, 0.14, 0);
        waterGun.add(tank);
        waterGun.userData.tank = tank;

        // Water inside tank
        const waterGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.12, 16);
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(0, 0.14, 0);
        waterGun.add(water);
        waterGun.userData.water = water;

        // Tank cap
        const capGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.03, 12);
        const cap = new THREE.Mesh(capGeo, pumpMat);
        cap.position.set(0, 0.22, 0);
        waterGun.add(cap);

        // Pump handle (front)
        const pumpGeo = new THREE.BoxGeometry(0.05, 0.06, 0.12);
        const pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(0, -0.02, -0.2);
        waterGun.add(pump);
        waterGun.userData.pump = pump;

        // Pump rod
        const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8);
        const rod = new THREE.Mesh(rodGeo, nozzleMat);
        rod.position.set(0, 0, -0.14);
        rod.rotation.x = Math.PI / 2;
        waterGun.add(rod);

        // Nozzle - wide opening for "balloons"
        const nozzleGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.08, 12);
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.position.set(0, 0.02, -0.19);
        nozzle.rotation.x = Math.PI / 2;
        waterGun.add(nozzle);

        // Nozzle tip (wider for balloon)
        const tipGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.04, 12);
        const tip = new THREE.Mesh(tipGeo, bodyLightMat);
        tip.position.set(0, 0.02, -0.24);
        tip.rotation.x = Math.PI / 2;
        waterGun.add(tip);

        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.025, 0.06, 0.02);
        const trigger = new THREE.Mesh(triggerGeo, this.theme.trigger);
        trigger.position.set(0, -0.05, 0.04);
        trigger.rotation.x = 0.3;
        waterGun.add(trigger);
        waterGun.userData.trigger = trigger;

        // Position water gun
        waterGun.position.set(0.1, -0.06, -0.35);
        waterGun.rotation.set(0.08, -0.1, 0);

        // === HANDS ===
        const rightHandGeo = new THREE.BoxGeometry(0.08, 0.1, 0.04);
        const rightHand = new THREE.Mesh(rightHandGeo, skinMat);
        rightHand.position.set(0.1, -0.16, -0.28);
        rightHand.rotation.set(0.3, -0.1, 0);
        fpsHands.add(rightHand);

        const rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        rightArm.position.set(0.15, -0.34, -0.2);
        rightArm.rotation.set(-0.7, 0.2, 0.3);
        fpsHands.add(rightArm);

        // Left hand on pump
        const leftHandGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
        const leftHand = new THREE.Mesh(leftHandGeo, skinMat);
        leftHand.position.set(0.02, -0.08, -0.48);
        leftHand.rotation.set(0.2, 0.3, -0.1);
        fpsHands.add(leftHand);
        fpsHands.userData.leftHand = leftHand;

        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        leftArm.position.set(-0.08, -0.28, -0.32);
        leftArm.rotation.set(-0.5, -0.3, -0.2);
        fpsHands.add(leftArm);

        fpsHands.add(waterGun);
        fpsHands.userData.waterGun = waterGun;

        fpsWeapon.add(fpsHands);
        fpsWeapon.position.set(0.12, -0.08, -0.4);
        fpsWeapon.rotation.set(0.05, -0.1, 0);

        return {
            weapon: fpsWeapon,
            hands: fpsHands,
            waterGun: waterGun,
            water: water,
            pump: pump,
            trigger: trigger,
            leftHand: leftHand
        };
    },

    createPickupMesh(THREE) {
        const pickup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.theme.body,
            roughness: 0.5,
            metalness: 0.1,
            emissive: this.theme.body,
            emissiveIntensity: 0.2
        });

        const tankMat = new THREE.MeshStandardMaterial({
            color: this.theme.tank,
            transparent: true,
            opacity: 0.6
        });

        const pumpMat = new THREE.MeshStandardMaterial({
            color: this.theme.pump,
            emissive: this.theme.pump,
            emissiveIntensity: 0.2
        });

        // Body
        const bodyGeo = new THREE.BoxGeometry(0.25, 0.35, 0.65);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        pickup.add(body);

        // Tank
        const tankGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12);
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, 0.3, 0);
        pickup.add(tank);

        // Pump
        const pumpGeo = new THREE.BoxGeometry(0.12, 0.15, 0.25);
        const pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(0, -0.05, -0.42);
        pickup.add(pump);

        // Nozzle
        const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8);
        const nozzle = new THREE.Mesh(nozzleGeo, bodyMat);
        nozzle.position.set(0, 0.05, -0.42);
        nozzle.rotation.x = Math.PI / 2;
        pickup.add(nozzle);

        // Glow
        const glowGeo = new THREE.SphereGeometry(0.55, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x3498db,
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

        const { water, pump, trigger, leftHand, waterGun } = refs;

        // Animate water level based on ammo
        if (water) {
            const ammoPercent = this.state.ammo / this.config.ammo.max;
            water.scale.y = Math.max(0.1, ammoPercent);
            water.position.y = 0.14 - (1 - ammoPercent) * 0.06;
        }

        // Pump animation (pull back on fire)
        if (pump && this.state.pumpAnim > 0) {
            const pumpOffset = this.state.pumpAnim * 0.08;
            pump.position.z = -0.2 + pumpOffset;
        }

        // Left hand follows pump
        if (leftHand && this.state.pumpAnim > 0) {
            const handOffset = this.state.pumpAnim * 0.08;
            leftHand.position.z = -0.48 + handOffset;
        }

        // Trigger press on fire
        if (trigger) {
            if (this.state.fireAnimProgress > 0.5) {
                trigger.rotation.x = 0.5;
            } else {
                trigger.rotation.x = 0.3;
            }
        }

        // Fire animation decay
        if (this.state.fireAnimProgress > 0) {
            this.state.fireAnimProgress -= dt * 5;
            if (this.state.fireAnimProgress < 0) this.state.fireAnimProgress = 0;
        }

        // Slight recoil
        if (waterGun && this.state.pumpAnim > 0) {
            waterGun.rotation.x = 0.08 + this.state.pumpAnim * 0.05;
        } else if (waterGun) {
            waterGun.rotation.x = 0.08;
        }
    },

    triggerFireAnim() {
        this.state.pumpAnim = 1.0;
        this.state.fireAnimProgress = 1.0;
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
