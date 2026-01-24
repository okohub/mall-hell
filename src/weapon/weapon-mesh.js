// ============================================
// WEAPON MESH - Mesh Creation
// ============================================
// Creates weapon THREE.js meshes
// Uses WeaponTheme for colors

const WeaponMesh = {
    /**
     * Get colors from theme or fallback
     */
    _getColors() {
        if (typeof WeaponTheme !== 'undefined') {
            return WeaponTheme.slingshot;
        }
        // Fallback colors
        return {
            wood: 0x8B4513,
            woodDark: 0x5D3A1A,
            leather: 0x4a3728,
            leatherDark: 0x3d2d22,
            band: 0x654321,
            metal: 0x888888,
            stone: 0x888888
        };
    },

    /**
     * Create FPS slingshot with stylized hands
     * Returns an object with all components needed for animation
     * @param {THREE} THREE - Three.js library
     * @param {Object} [materials] - Optional shared materials library
     * @returns {Object} Object with weapon, hands, and animation component references
     */
    createFPSWeapon(THREE, materials) {
        // Materials - Clean stylized look
        const skinMat = materials?.skin || new THREE.MeshStandardMaterial({
            color: 0xffd4c4,  // Warm peachy skin tone
            roughness: 0.4,   // Smoother, more stylized
            metalness: 0.0
        });
        const woodMat = materials?.wood || new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });
        const rubberMat = materials?.rubber || new THREE.MeshStandardMaterial({
            color: 0xc0392b,
            roughness: 0.5,
            metalness: 0.1
        });

        // Helper: Create smooth stylized finger (single capsule shape)
        function createStylizedFinger(length, radius, isThumb = false) {
            const finger = new THREE.Group();

            // Single smooth capsule body
            const cylGeo = new THREE.CylinderGeometry(
                radius * 0.85,   // Tip radius (tapered)
                radius,          // Base radius
                length * 0.85,   // Height
                12               // Smooth segments
            );
            const cyl = new THREE.Mesh(cylGeo, skinMat);
            cyl.position.y = length * 0.4;
            finger.add(cyl);

            // Rounded tip
            const tipGeo = new THREE.SphereGeometry(radius * 0.85, 12, 8);
            const tip = new THREE.Mesh(tipGeo, skinMat);
            tip.position.y = length * 0.85;
            tip.scale.y = 0.7;
            finger.add(tip);

            // Rounded base
            const baseGeo = new THREE.SphereGeometry(radius, 12, 8);
            const base = new THREE.Mesh(baseGeo, skinMat);
            base.position.y = 0;
            base.scale.y = 0.6;
            finger.add(base);

            finger.castShadow = true;
            return finger;
        }

        // Helper: Create clean stylized hand
        function createHand(isRight) {
            const hand = new THREE.Group();
            const mirror = isRight ? 1 : -1;

            // Palm - smooth rounded rectangle shape
            const palmGeo = new THREE.BoxGeometry(0.065, 0.08, 0.022);
            const palm = new THREE.Mesh(palmGeo, skinMat);
            palm.position.set(0, 0, 0);
            hand.add(palm);

            // Round the palm edges with spheres at corners
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

            // Simplified wrist
            const wristGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.04, 12);
            const wrist = new THREE.Mesh(wristGeo, skinMat);
            wrist.position.set(0, -0.055, 0);
            hand.add(wrist);

            // Fingers - cleaner proportions (index, middle, ring, pinky)
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

            // Thumb - shorter and rounder
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

        // Curl fingers around slingshot handle (grip pose)
        rightHand.userData.fingers.forEach((finger, i) => {
            finger.rotation.x = 1.2 + i * 0.1;  // Curl inward
            finger.rotation.z = -0.1 * (i - 1.5); // Slight spread
        });
        rightHand.userData.thumb.rotation.set(0.2, 0.5, 0.8);  // Thumb wraps around

        rightHand.position.set(0.12, -0.15, -0.35);
        rightHand.rotation.set(-0.3, -0.4, 0.2);  // Angled to hold handle
        fpsHands.add(rightHand);
        fpsHands.userData.rightHand = rightHand;

        // === LEFT HAND (pulling back pouch - pinch grip) ===
        const leftHand = createHand(false);

        // Pinch pose for holding pouch: index and thumb pinch, others curled
        leftHand.userData.fingers[0].rotation.x = 0.8;   // Index - extended for pinch
        leftHand.userData.fingers[0].rotation.z = 0.2;   // Slightly inward
        leftHand.userData.fingers[1].rotation.x = 1.5;   // Middle - curled
        leftHand.userData.fingers[2].rotation.x = 1.6;   // Ring - curled
        leftHand.userData.fingers[3].rotation.x = 1.7;   // Pinky - curled tight
        leftHand.userData.thumb.rotation.set(0.4, -0.9, -0.3);  // Thumb meets index

        leftHand.position.set(-0.05, -0.08, -0.15);  // Will be animated when pulling
        leftHand.rotation.set(0.2, 0.5, -0.3);
        fpsHands.add(leftHand);
        fpsHands.userData.leftHand = leftHand;  // Store for animation

        // === FOREARMS / SLEEVES (connect hands to body) ===
        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x2980b9,  // Blue sleeve (kid's shirt)
            roughness: 0.9,
            metalness: 0.0
        });

        // Right forearm - connects right hand to lower right of screen
        const rightArmGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.35, 8);
        const rightArm = new THREE.Mesh(rightArmGeo, sleeveMat);
        rightArm.position.set(0.18, -0.35, -0.2);
        rightArm.rotation.set(-0.8, 0.3, 0.4);
        fpsHands.add(rightArm);

        // Right wrist (skin connection between sleeve and hand)
        const rightWrist = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.032, 0.06, 8),
            skinMat
        );
        rightWrist.position.set(0.13, -0.22, -0.3);
        rightWrist.rotation.set(-0.4, 0, 0.2);
        fpsHands.add(rightWrist);

        // Left forearm - connects left hand to lower left of screen
        const leftArmGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.35, 8);
        const leftArm = new THREE.Mesh(leftArmGeo, sleeveMat);
        leftArm.position.set(-0.12, -0.32, -0.05);
        leftArm.rotation.set(-0.5, -0.4, -0.3);
        fpsHands.add(leftArm);
        fpsHands.userData.leftArm = leftArm; // Store for animation

        // Left wrist
        const leftWrist = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.032, 0.06, 8),
            skinMat
        );
        leftWrist.position.set(-0.06, -0.15, -0.12);
        leftWrist.rotation.set(0.1, 0, -0.2);
        fpsHands.add(leftWrist);
        fpsHands.userData.leftWrist = leftWrist; // Store for animation

        // === SLINGSHOT (held by right hand) ===
        const slingshot = new THREE.Group();

        // Y-frame handle (held in right hand)
        const handleGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.2, 12);
        const handle = new THREE.Mesh(handleGeo, woodMat);
        handle.position.set(0, -0.06, 0);
        handle.castShadow = true;
        slingshot.add(handle);

        // Handle grip texture (wrapped cord)
        for (let i = 0; i < 6; i++) {
            const wrapGeo = new THREE.TorusGeometry(0.022, 0.003, 4, 12);
            const wrap = new THREE.Mesh(wrapGeo, new THREE.MeshStandardMaterial({
                color: 0x4a3520, roughness: 0.9
            }));
            wrap.position.set(0, -0.12 + i * 0.015, 0);
            wrap.rotation.x = Math.PI / 2;
            slingshot.add(wrap);
        }

        // Fork prongs (Y-shape)
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

        // Fork tips (where rubber bands attach)
        const tipGeo = new THREE.SphereGeometry(0.018, 12, 12);
        const tipL = new THREE.Mesh(tipGeo, woodMat);
        tipL.position.set(-0.065, 0.09, 0);
        slingshot.add(tipL);
        slingshot.userData.tipL = tipL;

        const tipR = new THREE.Mesh(tipGeo, woodMat);
        tipR.position.set(0.065, 0.09, 0);
        slingshot.add(tipR);
        slingshot.userData.tipR = tipR;

        // === RUBBER BANDS (dynamic - will stretch to pouch) ===
        const bandMat = rubberMat.clone();

        // Left rubber band
        const fpsBandL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.1, 8),
            bandMat
        );
        fpsBandL.position.set(-0.04, 0.05, 0.05);
        slingshot.add(fpsBandL);

        // Right rubber band
        const fpsBandR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.1, 8),
            bandMat
        );
        fpsBandR.position.set(0.04, 0.05, 0.05);
        slingshot.add(fpsBandR);

        // === POUCH (leather pocket that holds stone) ===
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

        // Pouch edges (makes it look like leather strap)
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

        // === STONE (ammo in pouch) ===
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x707070,
            roughness: 0.8,
            metalness: 0.1
        });
        const stoneGeo = new THREE.SphereGeometry(0.016, 10, 10);
        const fpsStone = new THREE.Mesh(stoneGeo, stoneMat);
        fpsStone.position.set(0, 0.025, 0.08);
        // Slightly irregular shape
        fpsStone.scale.set(1.1, 0.9, 1.0);
        slingshot.add(fpsStone);

        // Position slingshot in right hand grip
        slingshot.position.set(0.12, -0.02, -0.32);
        slingshot.rotation.set(0.1, -0.2, 0.1);  // Angled towards screen
        fpsHands.add(slingshot);
        fpsHands.userData.slingshot = slingshot;

        fpsWeapon.add(fpsHands);

        // Position whole weapon view - center-right, clearly visible
        fpsWeapon.position.set(0.15, -0.12, -0.45);
        fpsWeapon.rotation.set(0.05, -0.15, 0);

        // Return object with all references for animation
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
     * Create slingshot mesh (for third-person or detached use)
     * @param {THREE} THREE - Three.js library
     * @param {boolean} isFPS - If true, create FPS version with more detail
     * @returns {THREE.Group} Slingshot mesh group
     */
    createSlingshotMesh(THREE, isFPS = false) {
        const slingshot = new THREE.Group();
        const colors = this._getColors();

        const woodMat = new THREE.MeshStandardMaterial({
            color: colors.wood,
            roughness: 0.8,
            metalness: 0.1
        });

        const leatherMat = new THREE.MeshStandardMaterial({
            color: colors.leather,
            roughness: 0.9,
            metalness: 0
        });

        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.18, 8);
        const handle = new THREE.Mesh(handleGeo, woodMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.z = 0.09;
        slingshot.add(handle);

        // Handle wrapping
        const wrapMat = new THREE.MeshStandardMaterial({
            color: colors.leatherDark,
            roughness: 1.0
        });
        for (let i = 0; i < 4; i++) {
            const wrap = new THREE.Mesh(
                new THREE.TorusGeometry(0.028, 0.005, 8, 16),
                wrapMat
            );
            wrap.position.z = 0.04 + i * 0.035;
            slingshot.add(wrap);
        }

        // Left fork
        const forkL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.022, 0.14, 8),
            woodMat
        );
        forkL.position.set(-0.04, 0.05, -0.02);
        forkL.rotation.z = 0.3;
        slingshot.add(forkL);

        // Right fork
        const forkR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.022, 0.14, 8),
            woodMat
        );
        forkR.position.set(0.04, 0.05, -0.02);
        forkR.rotation.z = -0.3;
        slingshot.add(forkR);

        // Fork tips (where bands attach)
        const tipL = new THREE.Mesh(
            new THREE.SphereGeometry(0.022, 8, 8),
            woodMat
        );
        tipL.position.set(-0.06, 0.11, -0.02);
        slingshot.add(tipL);
        slingshot.userData.tipL = tipL;

        const tipR = new THREE.Mesh(
            new THREE.SphereGeometry(0.022, 8, 8),
            woodMat
        );
        tipR.position.set(0.06, 0.11, -0.02);
        slingshot.add(tipR);
        slingshot.userData.tipR = tipR;

        // Elastic bands
        const bandMat = new THREE.MeshStandardMaterial({
            color: colors.band,
            roughness: 0.6
        });

        const bandL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8),
            bandMat
        );
        bandL.position.set(-0.03, 0.05, -0.08);
        bandL.rotation.x = 0.5;
        bandL.rotation.z = 0.2;
        slingshot.add(bandL);
        slingshot.userData.bandL = bandL;

        const bandR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8),
            bandMat
        );
        bandR.position.set(0.03, 0.05, -0.08);
        bandR.rotation.x = 0.5;
        bandR.rotation.z = -0.2;
        slingshot.add(bandR);
        slingshot.userData.bandR = bandR;

        // Pouch
        const pouch = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.04, 0.02),
            leatherMat
        );
        pouch.position.set(0, 0, -0.14);
        slingshot.add(pouch);
        slingshot.userData.pouch = pouch;

        if (isFPS) {
            // Pouch edges for FPS detail
            const edgeMat = new THREE.MeshStandardMaterial({
                color: colors.leatherDark,
                roughness: 1.0
            });

            const pouchEdge1 = new THREE.Mesh(
                new THREE.BoxGeometry(0.065, 0.005, 0.025),
                edgeMat
            );
            pouchEdge1.position.set(0, 0.02, -0.14);
            slingshot.add(pouchEdge1);

            const pouchEdge2 = new THREE.Mesh(
                new THREE.BoxGeometry(0.065, 0.005, 0.025),
                edgeMat
            );
            pouchEdge2.position.set(0, -0.02, -0.14);
            slingshot.add(pouchEdge2);

            // Stone in pouch
            const stoneMat = new THREE.MeshStandardMaterial({
                color: colors.stone,
                roughness: 0.9,
                metalness: 0.1
            });
            const stone = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 8),
                stoneMat
            );
            stone.position.set(0, 0, -0.13);
            slingshot.add(stone);
            slingshot.userData.stone = stone;
        }

        return slingshot;
    },

    /**
     * Create third-person slingshot for player cart
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group} Slingshot arm group
     */
    createThirdPersonWeapon(THREE) {
        const slingshotArm = new THREE.Group();
        const colors = this._getColors();

        const woodMat = new THREE.MeshStandardMaterial({
            color: colors.wood,
            roughness: 0.7
        });

        const bandMat = new THREE.MeshStandardMaterial({
            color: colors.band,
            roughness: 0.6
        });

        const leatherMat = new THREE.MeshStandardMaterial({
            color: colors.leather,
            roughness: 0.8
        });

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8),
            woodMat
        );
        handle.position.y = -0.2;
        slingshotArm.add(handle);

        // Forks
        const forkL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            woodMat
        );
        forkL.position.set(-0.1, 0.15, 0);
        forkL.rotation.z = 0.3;
        slingshotArm.add(forkL);

        const forkR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8),
            woodMat
        );
        forkR.position.set(0.1, 0.15, 0);
        forkR.rotation.z = -0.3;
        slingshotArm.add(forkR);

        // Tips
        const tipL = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            woodMat
        );
        tipL.position.set(-0.15, 0.3, 0);
        slingshotArm.add(tipL);

        const tipR = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            woodMat
        );
        tipR.position.set(0.15, 0.3, 0);
        slingshotArm.add(tipR);

        // Bands
        const bandL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6),
            bandMat
        );
        bandL.position.set(-0.08, 0.15, 0.15);
        bandL.rotation.x = 0.5;
        slingshotArm.add(bandL);

        const bandR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6),
            bandMat
        );
        bandR.position.set(0.08, 0.15, 0.15);
        bandR.rotation.x = 0.5;
        slingshotArm.add(bandR);

        // Pouch
        const pouch = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            leatherMat
        );
        pouch.scale.set(1.5, 1, 0.5);
        pouch.position.set(0, 0.05, 0.3);
        slingshotArm.add(pouch);

        return slingshotArm;
    },

    /**
     * Animate FPS weapon based on charge state
     * @param {Object} refs - References object from createFPSWeapon
     * @param {number} tension - Current charge tension (0-1)
     * @param {boolean} isCharging - Whether currently charging
     */
    animateFPSWeapon(refs, tension, isCharging) {
        if (!refs || !refs.leftHand) return;

        const { leftHand, pouch, stone, bandL, bandR } = refs;

        if (isCharging) {
            const pullBack = tension;

            // Pull left hand back
            leftHand.position.z = -0.15 + (-pullBack * 0.25);
            leftHand.position.y = -0.08 - pullBack * 0.05;

            // Animate pouch and stone
            if (pouch) {
                pouch.position.z = 0.08 + pullBack * 0.2;
            }
            if (stone) {
                stone.position.z = 0.08 + pullBack * 0.2;
            }
            // Animate bands
            if (bandL) {
                bandL.scale.y = 1 + pullBack * 0.5;
            }
            if (bandR) {
                bandR.scale.y = 1 + pullBack * 0.5;
            }
        } else {
            // Reset positions
            leftHand.position.set(-0.05, -0.08, -0.15);

            if (pouch) {
                pouch.position.z = 0.08;
            }
            if (stone) {
                stone.position.z = 0.08;
            }
            if (bandL) {
                bandL.scale.y = 1;
            }
            if (bandR) {
                bandR.scale.y = 1;
            }
        }
    }
};
