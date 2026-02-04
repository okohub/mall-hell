// ============================================
// LASERGUN MESH - Pure Mesh Creation
// ============================================
// Stateless mesh creation functions
// Receives theme as parameter

const LaserGunMesh = {
    /**
     * Create FPS weapon mesh
     * @param {Object} THREE - THREE.js library
     * @param {Object} materials - Shared materials (skin, etc.)
     * @param {Object} theme - Color theme
     * @returns {Object} Mesh references
     */
    createFPSMesh(THREE, materials, theme) {
        const fpsWeapon = new THREE.Group();
        const fpsHands = new THREE.Group();

        // Materials
        const skinMat = materials?.skin || new THREE.MeshStandardMaterial({
            color: 0xffd4c4, roughness: 0.4, metalness: 0.0
        });

        const bodyMat = new THREE.MeshStandardMaterial({
            color: theme.body,
            roughness: 0.2,
            metalness: 0.8
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: theme.accent,
            roughness: 0.3,
            metalness: 0.6,
            emissive: theme.accent,
            emissiveIntensity: 0.3
        });

        const emitterMat = new THREE.MeshStandardMaterial({
            color: theme.emitter,
            roughness: 0.1,
            metalness: 0.2,
            emissive: theme.emitterGlow,
            emissiveIntensity: 0.8
        });

        const cellMat = new THREE.MeshStandardMaterial({
            color: theme.energyCell,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            emissive: theme.energyCell,
            emissiveIntensity: 0.4
        });

        const gripMat = new THREE.MeshStandardMaterial({
            color: theme.grip,
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

    /**
     * Create pickup mesh
     * @param {Object} THREE - THREE.js library
     * @param {Object} theme - Color theme
     * @returns {THREE.Group} Pickup mesh
     */
    createPickupMesh(THREE, theme) {
        const pickup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: theme.body,
            roughness: 0.2,
            metalness: 0.8,
            emissive: theme.body,
            emissiveIntensity: 0.1
        });

        const emitterMat = new THREE.MeshStandardMaterial({
            color: theme.emitter,
            emissive: theme.emitterGlow,
            emissiveIntensity: 0.8
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: theme.accent,
            emissive: theme.accent,
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
            color: theme.emitterGlow,
            transparent: true,
            opacity: 0.25
        });
        pickup.add(new THREE.Mesh(glowGeo, glowMat));

        return pickup;
    }
};
