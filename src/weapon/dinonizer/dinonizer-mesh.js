// ============================================
// DINONIZER MESH - Pure Mesh Creation
// ============================================
// Stateless mesh creation functions
// Receives theme as parameter

const DinonizerMesh = {
    /**
     * Create FPS weapon mesh
     * @param {Object} THREE - Three.js library
     * @param {Object} materials - Shared materials
     * @param {Object} theme - Color theme
     * @returns {Object} Mesh references
     */
    createFPSMesh(THREE, materials, theme) {
        const fpsWeapon = new THREE.Group();
        const hands = new THREE.Group();

        const skinMat = materials?.skin || new THREE.MeshStandardMaterial({
            color: 0xffd4c4, roughness: 0.4, metalness: 0.0
        });

        const bodyMat = new THREE.MeshStandardMaterial({
            color: theme.body,
            roughness: 0.3,
            metalness: 0.6
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: theme.accent,
            roughness: 0.25,
            metalness: 0.5,
            emissive: theme.accent,
            emissiveIntensity: 0.35
        });

        const coreMat = new THREE.MeshStandardMaterial({
            color: theme.core,
            roughness: 0.1,
            metalness: 0.15,
            emissive: theme.coreGlow,
            emissiveIntensity: 1.2
        });

        const gripMat = new THREE.MeshStandardMaterial({
            color: theme.grip,
            roughness: 0.9,
            metalness: 0.1
        });

        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, roughness: 0.9, metalness: 0.0
        });

        // === DINONIZER BODY ===
        const gun = new THREE.Group();

        const bodyGeo = new THREE.BoxGeometry(0.08, 0.08, 0.34);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        gun.add(body);

        const spineGeo = new THREE.BoxGeometry(0.035, 0.03, 0.26);
        const spine = new THREE.Mesh(spineGeo, accentMat);
        spine.position.set(0, 0.05, -0.02);
        gun.add(spine);

        const barrelGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 12);
        const barrel = new THREE.Mesh(barrelGeo, bodyMat);
        barrel.position.set(0, 0, -0.2);
        barrel.rotation.x = Math.PI / 2;
        gun.add(barrel);

        const coreGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12);
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 0, -0.28);
        core.rotation.x = Math.PI / 2;
        gun.add(core);
        gun.userData.core = core;

        const glowRingGeo = new THREE.TorusGeometry(0.032, 0.005, 8, 16);
        const glowRing = new THREE.Mesh(glowRingGeo, coreMat);
        glowRing.position.set(0, 0, -0.25);
        gun.add(glowRing);
        gun.userData.glowRing = glowRing;

        // Sun lens (disc)
        const lensGeo = new THREE.CircleGeometry(0.03, 18);
        const lensMat = new THREE.MeshBasicMaterial({
            color: theme.coreGlow,
            transparent: true,
            opacity: 0.6
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, 0, -0.32);
        lens.rotation.y = 0;
        gun.add(lens);

        // Solar fins
        const finGeo = new THREE.BoxGeometry(0.06, 0.02, 0.12);
        const finLeft = new THREE.Mesh(finGeo, accentMat);
        finLeft.position.set(-0.06, 0.02, 0.02);
        finLeft.rotation.z = 0.2;
        gun.add(finLeft);

        const finRight = new THREE.Mesh(finGeo, accentMat);
        finRight.position.set(0.06, 0.02, 0.02);
        finRight.rotation.z = -0.2;
        gun.add(finRight);

        // Energy coil
        const coilGeo = new THREE.TorusGeometry(0.03, 0.006, 8, 18);
        const coil = new THREE.Mesh(coilGeo, accentMat);
        coil.position.set(0, -0.01, -0.1);
        coil.rotation.x = Math.PI / 2;
        gun.add(coil);

        const handleGeo = new THREE.BoxGeometry(0.05, 0.12, 0.06);
        const handle = new THREE.Mesh(handleGeo, gripMat);
        handle.position.set(0, -0.08, 0.06);
        handle.rotation.x = 0.25;
        gun.add(handle);

        gun.position.set(0.08, -0.06, -0.35);
        gun.rotation.set(0.05, -0.08, 0);

        // === HANDS ===
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), skinMat);
        rightHand.position.set(0.1, -0.14, -0.28);
        rightHand.rotation.set(0.25, -0.08, 0);
        hands.add(rightHand);

        const rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        rightArm.position.set(0.15, -0.32, -0.18);
        rightArm.rotation.set(-0.7, 0.2, 0.3);
        hands.add(rightArm);

        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.04), skinMat);
        leftHand.position.set(0.02, -0.08, -0.42);
        leftHand.rotation.set(0.15, 0.2, -0.1);
        hands.add(leftHand);

        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            sleeveMat
        );
        leftArm.position.set(-0.07, -0.28, -0.28);
        leftArm.rotation.set(-0.5, -0.3, -0.2);
        hands.add(leftArm);

        hands.add(gun);
        hands.userData.gun = gun;

        fpsWeapon.add(hands);
        fpsWeapon.position.set(0.12, -0.08, -0.4);
        fpsWeapon.rotation.set(0.05, -0.1, 0);

        return {
            weapon: fpsWeapon,
            hands,
            gun,
            core,
            glowRing
        };
    },

    /**
     * Create pickup mesh
     * @param {Object} THREE - Three.js library
     * @param {Object} theme - Color theme
     * @returns {THREE.Group} Pickup mesh
     */
    createPickupMesh(THREE, theme) {
        const pickup = new THREE.Group();

        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0xe6f2ff,
            roughness: 0.35,
            metalness: 0.1,
            transparent: true,
            opacity: 0.7,
            emissive: theme.coreGlow,
            emissiveIntensity: 0.15
        });

        const fluidMat = new THREE.MeshStandardMaterial({
            color: theme.coreGlow,
            roughness: 0.2,
            metalness: 0.1,
            emissive: theme.coreGlow,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            roughness: 0.2,
            metalness: 0.85
        });

        const plungerMat = new THREE.MeshStandardMaterial({
            color: theme.accent,
            roughness: 0.4,
            metalness: 0.4,
            emissive: theme.accent,
            emissiveIntensity: 0.2
        });

        const length = 0.7;
        const barrelRadius = 0.1;
        const needleRadius = barrelRadius * 0.28;

        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(barrelRadius, barrelRadius, length, 12),
            barrelMat
        );
        barrel.rotation.x = Math.PI / 2;
        pickup.add(barrel);

        const fluid = new THREE.Mesh(
            new THREE.CylinderGeometry(barrelRadius * 0.72, barrelRadius * 0.72, length * 0.62, 10),
            fluidMat
        );
        fluid.rotation.x = Math.PI / 2;
        fluid.position.z = -length * 0.08;
        pickup.add(fluid);

        const needle = new THREE.Mesh(
            new THREE.CylinderGeometry(needleRadius, needleRadius, length * 0.38, 8),
            metalMat
        );
        needle.rotation.x = Math.PI / 2;
        needle.position.z = -length * 0.7;
        pickup.add(needle);

        const tip = new THREE.Mesh(
            new THREE.ConeGeometry(needleRadius * 1.1, length * 0.12, 8),
            metalMat
        );
        tip.rotation.x = Math.PI / 2;
        tip.position.z = -length * 0.9;
        pickup.add(tip);

        const collar = new THREE.Mesh(
            new THREE.CylinderGeometry(barrelRadius * 0.95, barrelRadius * 0.95, length * 0.05, 10),
            metalMat
        );
        collar.rotation.x = Math.PI / 2;
        collar.position.z = -length * 0.45;
        pickup.add(collar);

        const plunger = new THREE.Mesh(
            new THREE.BoxGeometry(barrelRadius * 1.9, barrelRadius * 0.55, length * 0.07),
            plungerMat
        );
        plunger.position.z = length * 0.46;
        pickup.add(plunger);

        const rod = new THREE.Mesh(
            new THREE.CylinderGeometry(barrelRadius * 0.12, barrelRadius * 0.12, length * 0.4, 8),
            plungerMat
        );
        rod.rotation.x = Math.PI / 2;
        rod.position.z = length * 0.2;
        pickup.add(rod);

        const glowMat = new THREE.MeshBasicMaterial({
            color: theme.coreGlow,
            transparent: true,
            opacity: 0.35
        });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), glowMat);
        glow.position.set(0, 0, -0.12);
        pickup.add(glow);

        return pickup;
    }
};
