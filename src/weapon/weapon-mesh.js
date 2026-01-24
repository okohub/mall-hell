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
     * Create capsule-like geometry (fallback for THREE.js r128 which lacks CapsuleGeometry)
     * @param {THREE} THREE - Three.js library
     * @param {number} radius - Capsule radius
     * @param {number} length - Capsule body length
     * @returns {THREE.BufferGeometry} Geometry
     */
    _createCapsuleGeometry(THREE, radius, length) {
        // Use CapsuleGeometry if available (r133+), otherwise fallback to CylinderGeometry
        if (THREE.CapsuleGeometry) {
            return new THREE.CapsuleGeometry(radius, length, 4, 8);
        }
        // Fallback: simple cylinder for older Three.js versions
        return new THREE.CylinderGeometry(radius, radius, length + radius * 2, 8);
    },

    /**
     * Create FPS slingshot with hands
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group} FPS weapon group with slingshot and hands
     */
    createFPSWeapon(THREE) {
        const fpsHands = new THREE.Group();

        // Skin tone
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xe8beac,
            roughness: 0.8,
            metalness: 0.1
        });

        // === LEFT HAND (pulling pouch) ===
        const leftHand = new THREE.Group();

        // Left palm
        const leftPalm = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.1, 0.06),
            skinMat
        );
        leftPalm.position.set(0, 0, 0);
        leftHand.add(leftPalm);

        // Left fingers (pinching pouch)
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(
                this._createCapsuleGeometry(THREE, 0.012, 0.06),
                skinMat
            );
            finger.position.set(-0.025 + i * 0.017, 0.02, -0.05);
            finger.rotation.x = -0.8;
            leftHand.add(finger);
        }

        // Left thumb
        const leftThumb = new THREE.Mesh(
            this._createCapsuleGeometry(THREE, 0.014, 0.04),
            skinMat
        );
        leftThumb.position.set(0.05, 0, -0.02);
        leftThumb.rotation.set(-0.3, 0, 0.5);
        leftHand.add(leftThumb);

        leftHand.position.set(-0.15, -0.08, -0.5);
        leftHand.rotation.set(0.2, 0.3, 0);
        fpsHands.add(leftHand);
        fpsHands.userData.leftHand = leftHand;

        // === RIGHT HAND (holding slingshot frame) ===
        const rightHand = new THREE.Group();

        // Right palm
        const rightPalm = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.1, 0.06),
            skinMat
        );
        rightHand.add(rightPalm);

        // Curled fingers around slingshot handle
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(
                this._createCapsuleGeometry(THREE, 0.012, 0.05),
                skinMat
            );
            finger.position.set(-0.025 + i * 0.017, -0.01, -0.04);
            finger.rotation.x = -1.2;
            rightHand.add(finger);

            // Fingertip curl
            const tip = new THREE.Mesh(
                this._createCapsuleGeometry(THREE, 0.011, 0.025),
                skinMat
            );
            tip.position.set(-0.025 + i * 0.017, -0.04, -0.02);
            tip.rotation.x = -2.0;
            rightHand.add(tip);
        }

        // Right thumb wrapping around
        const rightThumb = new THREE.Mesh(
            this._createCapsuleGeometry(THREE, 0.014, 0.04),
            skinMat
        );
        rightThumb.position.set(0.05, -0.02, -0.01);
        rightThumb.rotation.set(-0.5, 0, 0.8);
        rightHand.add(rightThumb);

        rightHand.position.set(0.12, -0.05, -0.35);
        rightHand.rotation.set(0.1, -0.2, -0.1);
        fpsHands.add(rightHand);
        fpsHands.userData.rightHand = rightHand;

        // === SLINGSHOT ===
        const slingshot = this.createSlingshotMesh(THREE, true);
        slingshot.position.set(0.12, -0.02, -0.32);
        slingshot.rotation.set(0.1, -0.2, 0.1);
        fpsHands.add(slingshot);
        fpsHands.userData.slingshot = slingshot;

        return fpsHands;
    },

    /**
     * Create slingshot mesh
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
     * @param {THREE.Group} fpsHands - FPS hands group
     * @param {number} tension - Current charge tension (0-1)
     * @param {boolean} isCharging - Whether currently charging
     */
    animateFPSWeapon(fpsHands, tension, isCharging) {
        if (!fpsHands || !fpsHands.userData.leftHand) return;

        const leftHand = fpsHands.userData.leftHand;
        const slingshot = fpsHands.userData.slingshot;

        if (isCharging && slingshot) {
            const pullBack = tension;

            // Pull left hand back
            leftHand.position.z = -0.5 - pullBack * 0.25;
            leftHand.position.y = -0.08 - pullBack * 0.05;

            // Animate bands and pouch if available
            if (slingshot.userData.pouch) {
                slingshot.userData.pouch.position.z = -0.14 - pullBack * 0.2;
            }
            if (slingshot.userData.bandL) {
                slingshot.userData.bandL.scale.z = 1 + pullBack * 0.5;
            }
            if (slingshot.userData.bandR) {
                slingshot.userData.bandR.scale.z = 1 + pullBack * 0.5;
            }
        } else {
            // Reset positions
            leftHand.position.set(-0.15, -0.08, -0.5);

            if (slingshot) {
                if (slingshot.userData.pouch) {
                    slingshot.userData.pouch.position.z = -0.14;
                }
                if (slingshot.userData.bandL) {
                    slingshot.userData.bandL.scale.z = 1;
                }
                if (slingshot.userData.bandR) {
                    slingshot.userData.bandR.scale.z = 1;
                }
            }
        }
    }
};
