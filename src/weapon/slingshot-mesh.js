// ============================================
// SLINGSHOT MESH - Pure Visual Factory
// ============================================
// Self-contained mesh creation functions
// Receives THREE and theme as parameters

const SlingshotMesh = {
    /**
     * Create FPS weapon mesh (slingshot with hands)
     * @param {THREE} THREE - Three.js library
     * @param {Object} materials - Optional materials library
     * @param {Object} theme - Color theme from slingshot.js
     * @returns {Object} Weapon mesh and animation references
     */
    createFPSMesh(THREE, materials, theme) {
        // Materials
        const skinMat = materials?.skin || new THREE.MeshStandardMaterial({
            color: 0xffd4c4,
            roughness: 0.4,
            metalness: 0.0
        });
        const woodMat = materials?.wood || new THREE.MeshStandardMaterial({
            color: theme.slingshot.wood,
            roughness: 0.7
        });
        const rubberMat = materials?.rubber || new THREE.MeshStandardMaterial({
            color: 0xc0392b,
            roughness: 0.5,
            metalness: 0.1
        });

        // Helper: Create smooth stylized finger
        function createStylizedFinger(length, radius, isThumb = false) {
            const finger = new THREE.Group();

            const cylGeo = new THREE.CylinderGeometry(
                radius * 0.85, radius, length * 0.85, 12
            );
            const cyl = new THREE.Mesh(cylGeo, skinMat);
            cyl.position.y = length * 0.4;
            finger.add(cyl);

            const tipGeo = new THREE.SphereGeometry(radius * 0.85, 12, 8);
            const tip = new THREE.Mesh(tipGeo, skinMat);
            tip.position.y = length * 0.85;
            tip.scale.y = 0.7;
            finger.add(tip);

            const baseGeo = new THREE.SphereGeometry(radius, 12, 8);
            const base = new THREE.Mesh(baseGeo, skinMat);
            base.position.y = 0;
            base.scale.y = 0.6;
            finger.add(base);

            finger.castShadow = true;
            return finger;
        }

        // Helper: Create stylized hand
        function createHand(isRight) {
            const hand = new THREE.Group();
            const mirror = isRight ? 1 : -1;

            // Palm
            const palmGeo = new THREE.BoxGeometry(0.065, 0.08, 0.022);
            const palm = new THREE.Mesh(palmGeo, skinMat);
            palm.position.set(0, 0, 0);
            hand.add(palm);

            // Round corners
            const cornerRadius = 0.012;
            const cornerPositions = [
                { x: 0.028, y: 0.035 },
                { x: -0.028, y: 0.035 },
                { x: 0.028, y: -0.035 },
                { x: -0.028, y: -0.035 }
            ];
            cornerPositions.forEach(pos => {
                const corner = new THREE.Mesh(
                    new THREE.SphereGeometry(cornerRadius, 8, 6),
                    skinMat
                );
                corner.position.set(pos.x, pos.y, 0);
                corner.scale.z = 0.9;
                hand.add(corner);
            });

            // Wrist
            const wristGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.04, 12);
            const wrist = new THREE.Mesh(wristGeo, skinMat);
            wrist.position.set(0, -0.055, 0);
            hand.add(wrist);

            // Fingers
            const fingerLengths = [0.055, 0.065, 0.06, 0.045];
            const fingerRadii = [0.008, 0.009, 0.008, 0.007];
            const fingerSpacing = [0.022, 0.008, -0.006, -0.020];

            hand.userData.fingers = [];
            for (let i = 0; i < 4; i++) {
                const finger = createStylizedFinger(fingerLengths[i], fingerRadii[i]);
                finger.position.set(mirror * fingerSpacing[i], 0.04, 0.003);
                hand.add(finger);
                hand.userData.fingers.push(finger);
            }

            // Thumb
            const thumb = createStylizedFinger(0.04, 0.01, true);
            thumb.position.set(mirror * 0.035, -0.01, 0.012);
            thumb.rotation.set(0.3, mirror * 0.7, mirror * 0.4);
            hand.add(thumb);
            hand.userData.thumb = thumb;

            return hand;
        }

        // Create main groups
        const fpsWeapon = new THREE.Group();
        const fpsHands = new THREE.Group();

        // === RIGHT HAND (holding slingshot frame) ===
        const rightHand = createHand(true);
        rightHand.userData.fingers.forEach((finger, i) => {
            finger.rotation.x = 1.2 + i * 0.1;
            finger.rotation.z = -0.1 * (i - 1.5);
        });
        rightHand.userData.thumb.rotation.set(0.2, 0.5, 0.8);
        rightHand.position.set(0.12, -0.15, -0.35);
        rightHand.rotation.set(-0.3, -0.4, 0.2);
        fpsHands.add(rightHand);
        fpsHands.userData.rightHand = rightHand;

        // === LEFT HAND (pulling pouch) ===
        const leftHand = createHand(false);
        leftHand.userData.fingers[0].rotation.x = 0.8;
        leftHand.userData.fingers[0].rotation.z = 0.2;
        leftHand.userData.fingers[1].rotation.x = 1.5;
        leftHand.userData.fingers[2].rotation.x = 1.6;
        leftHand.userData.fingers[3].rotation.x = 1.7;
        leftHand.userData.thumb.rotation.set(0.4, -0.9, -0.3);
        leftHand.position.set(-0.05, -0.08, -0.15);
        leftHand.rotation.set(0.2, 0.5, -0.3);
        fpsHands.add(leftHand);
        fpsHands.userData.leftHand = leftHand;

        // === FOREARMS / SLEEVES ===
        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            roughness: 0.9,
            metalness: 0.0
        });

        const rightArmGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.35, 8);
        const rightArm = new THREE.Mesh(rightArmGeo, sleeveMat);
        rightArm.position.set(0.18, -0.35, -0.2);
        rightArm.rotation.set(-0.8, 0.3, 0.4);
        fpsHands.add(rightArm);

        const rightWrist = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.032, 0.06, 8),
            skinMat
        );
        rightWrist.position.set(0.13, -0.22, -0.3);
        rightWrist.rotation.set(-0.4, 0, 0.2);
        fpsHands.add(rightWrist);

        const leftArmGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.35, 8);
        const leftArm = new THREE.Mesh(leftArmGeo, sleeveMat);
        leftArm.position.set(-0.12, -0.32, -0.05);
        leftArm.rotation.set(-0.5, -0.4, -0.3);
        fpsHands.add(leftArm);
        fpsHands.userData.leftArm = leftArm;

        const leftWrist = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.032, 0.06, 8),
            skinMat
        );
        leftWrist.position.set(-0.06, -0.15, -0.12);
        leftWrist.rotation.set(0.1, 0, -0.2);
        fpsHands.add(leftWrist);
        fpsHands.userData.leftWrist = leftWrist;

        // === SLINGSHOT ===
        const slingshot = new THREE.Group();

        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.2, 12);
        const handle = new THREE.Mesh(handleGeo, woodMat);
        handle.position.set(0, -0.06, 0);
        handle.castShadow = true;
        slingshot.add(handle);

        // Handle grip
        for (let i = 0; i < 6; i++) {
            const wrapGeo = new THREE.TorusGeometry(0.022, 0.003, 4, 12);
            const wrap = new THREE.Mesh(wrapGeo, new THREE.MeshStandardMaterial({
                color: 0x4a3520, roughness: 0.9
            }));
            wrap.position.set(0, -0.12 + i * 0.015, 0);
            wrap.rotation.x = Math.PI / 2;
            slingshot.add(wrap);
        }

        // Fork prongs
        const forkGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.12, 8);
        const forkL = new THREE.Mesh(forkGeo, woodMat);
        forkL.rotation.z = Math.PI / 5;
        forkL.position.set(-0.04, 0.04, 0);
        forkL.castShadow = true;
        slingshot.add(forkL);

        const forkR = new THREE.Mesh(forkGeo, woodMat);
        forkR.rotation.z = -Math.PI / 5;
        forkR.position.set(0.04, 0.04, 0);
        forkR.castShadow = true;
        slingshot.add(forkR);

        // Fork tips
        const tipGeo = new THREE.SphereGeometry(0.018, 12, 12);
        const tipL = new THREE.Mesh(tipGeo, woodMat);
        tipL.position.set(-0.065, 0.09, 0);
        slingshot.add(tipL);

        const tipR = new THREE.Mesh(tipGeo, woodMat);
        tipR.position.set(0.065, 0.09, 0);
        slingshot.add(tipR);

        // === RUBBER BANDS ===
        const bandMat = rubberMat.clone();

        const fpsBandL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.1, 8),
            bandMat
        );
        fpsBandL.position.set(-0.04, 0.05, 0.05);
        slingshot.add(fpsBandL);

        const fpsBandR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.1, 8),
            bandMat
        );
        fpsBandR.position.set(0.04, 0.05, 0.05);
        slingshot.add(fpsBandR);

        // === POUCH ===
        const pouchMat = new THREE.MeshStandardMaterial({
            color: 0x5c4033,
            roughness: 0.95,
            metalness: 0.0
        });
        const pouchGeo = new THREE.SphereGeometry(0.022, 12, 8);
        const fpsPouch = new THREE.Mesh(pouchGeo, pouchMat);
        fpsPouch.scale.set(1.4, 0.5, 1.2);
        fpsPouch.position.set(0, 0.02, 0.08);
        slingshot.add(fpsPouch);

        // Pouch edges
        const pouchEdge1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.003, 0.04),
            pouchMat
        );
        pouchEdge1.position.set(-0.025, 0.02, 0.08);
        slingshot.add(pouchEdge1);

        const pouchEdge2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.003, 0.04),
            pouchMat
        );
        pouchEdge2.position.set(0.025, 0.02, 0.08);
        slingshot.add(pouchEdge2);

        // === STONE ===
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x707070,
            roughness: 0.8,
            metalness: 0.1
        });
        const stoneGeo = new THREE.SphereGeometry(0.016, 10, 10);
        const fpsStone = new THREE.Mesh(stoneGeo, stoneMat);
        fpsStone.position.set(0, 0.025, 0.08);
        fpsStone.scale.set(1.1, 0.9, 1.0);
        slingshot.add(fpsStone);

        // Position slingshot
        slingshot.position.set(0.12, -0.02, -0.32);
        slingshot.rotation.set(0.1, -0.2, 0.1);
        fpsHands.add(slingshot);
        fpsHands.userData.slingshot = slingshot;

        fpsWeapon.add(fpsHands);
        fpsWeapon.position.set(0.15, -0.12, -0.45);
        fpsWeapon.rotation.set(0.05, -0.15, 0);

        return {
            weapon: fpsWeapon,
            hands: fpsHands,
            leftHand: leftHand,
            rightHand: rightHand,
            leftArm: leftArm,
            leftWrist: leftWrist,
            slingshot: slingshot,
            bandL: fpsBandL,
            bandR: fpsBandR,
            pouch: fpsPouch,
            stone: fpsStone
        };
    },

    /**
     * Create pickup mesh for floor pickup
     * @param {THREE} THREE - Three.js library
     * @param {Object} theme - Color theme from slingshot.js
     * @returns {THREE.Group} Pickup mesh
     */
    createPickupMesh(THREE, theme) {
        const pickup = new THREE.Group();

        const woodMat = new THREE.MeshStandardMaterial({
            color: theme.slingshot.wood,
            roughness: 0.7,
            emissive: theme.slingshot.wood,
            emissiveIntensity: 0.2
        });

        // Simplified slingshot for pickup
        const handleGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8);
        const handle = new THREE.Mesh(handleGeo, woodMat);
        handle.position.y = -0.25;
        pickup.add(handle);

        const forkGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.35, 8);

        const forkL = new THREE.Mesh(forkGeo, woodMat);
        forkL.position.set(-0.12, 0.15, 0);
        forkL.rotation.z = 0.3;
        pickup.add(forkL);

        const forkR = new THREE.Mesh(forkGeo, woodMat);
        forkR.position.set(0.12, 0.15, 0);
        forkR.rotation.z = -0.3;
        pickup.add(forkR);

        // Add glow sphere
        const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xf39c12,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        pickup.add(glow);

        return pickup;
    }
};
