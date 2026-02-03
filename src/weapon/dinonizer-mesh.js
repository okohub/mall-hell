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
            roughness: 0.25,
            metalness: 0.7
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: theme.accent,
            roughness: 0.3,
            metalness: 0.6,
            emissive: theme.accent,
            emissiveIntensity: 0.3
        });

        const coreMat = new THREE.MeshStandardMaterial({
            color: theme.core,
            roughness: 0.1,
            metalness: 0.2,
            emissive: theme.coreGlow,
            emissiveIntensity: 1.0
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

        const bodyGeo = new THREE.BoxGeometry(0.07, 0.07, 0.3);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        gun.add(body);

        const spineGeo = new THREE.BoxGeometry(0.03, 0.03, 0.22);
        const spine = new THREE.Mesh(spineGeo, accentMat);
        spine.position.set(0, 0.05, -0.02);
        gun.add(spine);

        const barrelGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.16, 10);
        const barrel = new THREE.Mesh(barrelGeo, bodyMat);
        barrel.position.set(0, 0, -0.2);
        barrel.rotation.x = Math.PI / 2;
        gun.add(barrel);

        const coreGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12);
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 0, -0.28);
        core.rotation.x = Math.PI / 2;
        gun.add(core);
        gun.userData.core = core;

        const glowRingGeo = new THREE.TorusGeometry(0.028, 0.005, 8, 16);
        const glowRing = new THREE.Mesh(glowRingGeo, coreMat);
        glowRing.position.set(0, 0, -0.25);
        gun.add(glowRing);
        gun.userData.glowRing = glowRing;

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

        const bodyMat = new THREE.MeshStandardMaterial({
            color: theme.body,
            roughness: 0.3,
            metalness: 0.7,
            emissive: theme.body,
            emissiveIntensity: 0.15
        });

        const coreMat = new THREE.MeshStandardMaterial({
            color: theme.core,
            roughness: 0.15,
            metalness: 0.2,
            emissive: theme.coreGlow,
            emissiveIntensity: 0.9
        });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.12), bodyMat);
        pickup.add(body);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.35, 10), bodyMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0, -0.2);
        pickup.add(barrel);

        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12), coreMat);
        core.rotation.x = Math.PI / 2;
        core.position.set(0, 0, -0.36);
        pickup.add(core);

        const glowMat = new THREE.MeshBasicMaterial({
            color: theme.coreGlow,
            transparent: true,
            opacity: 0.35
        });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), glowMat);
        glow.position.set(0, 0, -0.2);
        pickup.add(glow);

        return pickup;
    }
};
