// ============================================
// NERF GUN - Self-Contained Weapon Module
// ============================================
// Single-shot foam dart launcher
// Implements the weapon interface for WeaponManager

const NerfGun = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'nerfgun',
    name: 'Nerf Blaster',

    // ==========================================
    // CONFIGURATION
    // ==========================================

    config: {
        fireMode: 'single',  // Tap to fire
        cooldown: 500,       // Slower but powerful - deliberate shots
        range: 140,          // Longest range for nerf blaster (enemies spawn at 150)
        aimAssist: true,

        ammo: {
            max: 12,
            current: 12,
            consumePerShot: 1
        },

        projectile: {
            type: 'dart',
            speed: { min: 100, max: 100 },  // Constant speed
            damage: 2.0,                     // High damage - 2-shot kills
            count: 1
        },

        charge: null  // No charge mechanic
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
            roughness: 0.5,
            metalness: 0.1
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: this.theme.accent,
            roughness: 0.4,
            metalness: 0.2
        });

        const barrelMat = new THREE.MeshStandardMaterial({
            color: this.theme.barrel,
            roughness: 0.6,
            metalness: 0.4
        });

        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            roughness: 0.9,
            metalness: 0.0
        });

        // === NERF GUN BODY ===
        const nerfGun = new THREE.Group();

        // Main body - blocky nerf style
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.14, 0.35);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0, 0);
        nerfGun.add(body);

        // Body rounded front
        const frontGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12);
        const front = new THREE.Mesh(frontGeo, bodyMat);
        front.position.set(0, 0, -0.2);
        front.rotation.x = Math.PI / 2;
        nerfGun.add(front);

        // Handle/grip
        const handleGeo = new THREE.BoxGeometry(0.07, 0.16, 0.08);
        const handle = new THREE.Mesh(handleGeo, bodyMat);
        handle.position.set(0, -0.12, 0.08);
        handle.rotation.x = 0.25;
        nerfGun.add(handle);

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.2, 12);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(0, 0.02, -0.35);
        barrel.rotation.x = Math.PI / 2;
        nerfGun.add(barrel);
        nerfGun.userData.barrel = barrel;

        // Barrel tip (orange for safety!)
        const tipMat = new THREE.MeshStandardMaterial({
            color: 0xf39c12,
            roughness: 0.4
        });
        const tipGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.04, 12);
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(0, 0.02, -0.46);
        tip.rotation.x = Math.PI / 2;
        nerfGun.add(tip);

        // Slide/top rail
        const slideGeo = new THREE.BoxGeometry(0.06, 0.04, 0.25);
        const slide = new THREE.Mesh(slideGeo, accentMat);
        slide.position.set(0, 0.09, -0.05);
        nerfGun.add(slide);
        nerfGun.userData.slide = slide;

        // Rear sight
        const sightGeo = new THREE.BoxGeometry(0.02, 0.03, 0.02);
        const sight = new THREE.Mesh(sightGeo, barrelMat);
        sight.position.set(0, 0.12, 0.05);
        nerfGun.add(sight);

        // Yellow accent stripe
        const stripeGeo = new THREE.BoxGeometry(0.11, 0.02, 0.2);
        const stripe = new THREE.Mesh(stripeGeo, accentMat);
        stripe.position.set(0, -0.02, -0.05);
        nerfGun.add(stripe);

        // Trigger guard
        const guardMat = new THREE.MeshStandardMaterial({
            color: this.theme.trigger,
            roughness: 0.8
        });
        const guardGeo = new THREE.TorusGeometry(0.03, 0.008, 8, 12, Math.PI);
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.position.set(0, -0.06, 0.03);
        guard.rotation.set(0, 0, Math.PI);
        nerfGun.add(guard);

        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.015, 0.04, 0.015);
        const trigger = new THREE.Mesh(triggerGeo, guardMat);
        trigger.position.set(0, -0.04, 0.03);
        trigger.rotation.x = 0.2;
        nerfGun.add(trigger);
        nerfGun.userData.trigger = trigger;

        // Dart visible in barrel
        const dartMat = new THREE.MeshStandardMaterial({
            color: this.theme.dart,
            roughness: 0.6
        });
        const dartGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.08, 8);
        const dart = new THREE.Mesh(dartGeo, dartMat);
        dart.position.set(0, 0.02, -0.38);
        dart.rotation.x = Math.PI / 2;
        nerfGun.add(dart);
        nerfGun.userData.dart = dart;

        // Position nerf gun
        nerfGun.position.set(0.08, -0.06, -0.32);
        nerfGun.rotation.set(0.08, -0.08, 0);

        // === HANDS ===
        // Right hand on grip
        const rightHandGeo = new THREE.BoxGeometry(0.08, 0.1, 0.05);
        const rightHand = new THREE.Mesh(rightHandGeo, skinMat);
        rightHand.position.set(0.08, -0.17, -0.24);
        rightHand.rotation.set(0.25, -0.08, 0);
        fpsHands.add(rightHand);

        // Right arm
        const rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        rightArm.position.set(0.14, -0.35, -0.15);
        rightArm.rotation.set(-0.7, 0.2, 0.3);
        fpsHands.add(rightArm);

        // Left hand supporting barrel
        const leftHandGeo = new THREE.BoxGeometry(0.07, 0.06, 0.06);
        const leftHand = new THREE.Mesh(leftHandGeo, skinMat);
        leftHand.position.set(0.02, -0.08, -0.42);
        leftHand.rotation.set(0.1, 0.2, -0.1);
        fpsHands.add(leftHand);

        // Left arm
        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        leftArm.position.set(-0.06, -0.28, -0.3);
        leftArm.rotation.set(-0.4, -0.3, -0.2);
        fpsHands.add(leftArm);

        fpsHands.add(nerfGun);
        fpsHands.userData.nerfGun = nerfGun;

        fpsWeapon.add(fpsHands);
        fpsWeapon.position.set(0.1, -0.08, -0.38);
        fpsWeapon.rotation.set(0.05, -0.08, 0);

        return {
            weapon: fpsWeapon,
            hands: fpsHands,
            nerfGun: nerfGun,
            slide: slide,
            trigger: trigger,
            dart: dart,
            barrel: barrel
        };
    },

    /**
     * Create pickup mesh
     */
    createPickupMesh(THREE) {
        const pickup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.theme.body,
            roughness: 0.5,
            metalness: 0.1,
            emissive: this.theme.body,
            emissiveIntensity: 0.2
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: this.theme.accent,
            roughness: 0.4,
            emissive: this.theme.accent,
            emissiveIntensity: 0.3
        });

        // Simplified nerf gun
        const bodyGeo = new THREE.BoxGeometry(0.25, 0.35, 0.8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        pickup.add(body);

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 10);
        const barrel = new THREE.Mesh(barrelGeo, bodyMat);
        barrel.position.set(0, 0.05, -0.55);
        barrel.rotation.x = Math.PI / 2;
        pickup.add(barrel);

        // Yellow stripe
        const stripeGeo = new THREE.BoxGeometry(0.26, 0.06, 0.5);
        const stripe = new THREE.Mesh(stripeGeo, accentMat);
        stripe.position.set(0, -0.05, 0);
        pickup.add(stripe);

        // Glow
        const glowGeo = new THREE.SphereGeometry(0.65, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xe74c3c,
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

        const { slide, trigger, dart, nerfGun } = refs;

        // Animate dart visibility based on ammo
        if (dart) {
            dart.visible = this.state.ammo > 0;
        }

        // Animate slide recoil
        if (slide && this.state.slideAnim > 0) {
            slide.position.z = -0.05 + this.state.slideAnim * 0.08;
        } else if (slide) {
            slide.position.z = -0.05;
        }

        // Animate trigger
        if (trigger) {
            if (this.state.fireAnimProgress > 0.5) {
                trigger.rotation.x = 0.2 + 0.3;  // Pressed
            } else {
                trigger.rotation.x = 0.2;  // Released
            }
        }

        // Subtle recoil
        if (nerfGun && this.state.fireAnimProgress > 0) {
            const recoil = this.state.fireAnimProgress * 0.02;
            const kickUp = this.state.fireAnimProgress * 0.03;
            nerfGun.position.z = -0.32 + recoil;
            nerfGun.rotation.x = 0.08 - kickUp;
        } else if (nerfGun) {
            nerfGun.position.z = -0.32;
            nerfGun.rotation.x = 0.08;
        }
    },

    triggerFireAnim() {
        this.state.fireAnimProgress = 1.0;
        this.state.slideAnim = 1.0;
    },

    isFireAnimPlaying() {
        return this.state.fireAnimProgress > 0;
    },

    updateTransform(weapon, turnRate) {
        if (!weapon) return;

        const weaponLeanAngle = -turnRate * 0.1;
        const weaponSway = turnRate * 0.02;

        weapon.rotation.z = weapon.rotation.z * 0.85 + weaponLeanAngle * 0.15;
        weapon.position.x = 0.1 + weapon.position.x * 0.9 + weaponSway * 0.1;
        weapon.position.x = Math.max(0.06, Math.min(0.16, weapon.position.x));
    }
};
