// ============================================
// WATERGUN MESH - Pure Mesh Creation
// ============================================
// Stateless mesh creation functions
// Receives theme as parameter

const WaterGunMesh = {
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
            roughness: 0.5,
            metalness: 0.1
        });

        const bodyLightMat = new THREE.MeshStandardMaterial({
            color: theme.bodyLight,
            roughness: 0.5,
            metalness: 0.1
        });

        const tankMat = new THREE.MeshStandardMaterial({
            color: theme.tank,
            transparent: true,
            opacity: 0.5,
            roughness: 0.2,
            metalness: 0.0
        });

        const waterMat = new THREE.MeshStandardMaterial({
            color: theme.tankWater,
            transparent: true,
            opacity: 0.75,
            roughness: 0.1,
            metalness: 0.0
        });

        const pumpMat = new THREE.MeshStandardMaterial({
            color: theme.pump,
            roughness: 0.6,
            metalness: 0.1
        });

        const nozzleMat = new THREE.MeshStandardMaterial({
            color: theme.nozzle,
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
        const trigger = new THREE.Mesh(triggerGeo, theme.trigger);
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
            roughness: 0.5,
            metalness: 0.1,
            emissive: theme.body,
            emissiveIntensity: 0.2
        });

        const tankMat = new THREE.MeshStandardMaterial({
            color: theme.tank,
            transparent: true,
            opacity: 0.6
        });

        const pumpMat = new THREE.MeshStandardMaterial({
            color: theme.pump,
            emissive: theme.pump,
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
    }
};
