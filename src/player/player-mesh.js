// ============================================
// PLAYER MESH - Mesh Creation
// ============================================
// Creates player cart THREE.js meshes
// Uses PlayerTheme for colors if not provided

const PlayerMesh = {
    /**
     * Create the complete player cart with child and slingshot
     * @param {THREE} THREE - Three.js library
     * @param {Object} [theme] - Theme from PlayerTheme (optional, uses PlayerTheme if available)
     * @returns {Object} Object containing cart group and references
     */
    createPlayerCart(THREE, theme) {
        // Use provided theme or fall back to PlayerTheme
        const colors = theme || (typeof PlayerTheme !== 'undefined' ? PlayerTheme.getAllColors() : {});
        const playerCart = new THREE.Group();
        const result = {
            cart: playerCart,
            child: null,
            slingshot: null
        };

        // Materials
        const chromeMat = new THREE.MeshStandardMaterial({
            color: colors.chrome,
            metalness: 0.9,
            roughness: 0.2
        });
        const darkChromeMat = new THREE.MeshStandardMaterial({
            color: colors.darkChrome,
            metalness: 0.8,
            roughness: 0.3
        });
        const redPlasticMat = new THREE.MeshStandardMaterial({
            color: colors.redPlastic,
            metalness: 0.1,
            roughness: 0.6
        });
        const blackRubberMat = new THREE.MeshStandardMaterial({
            color: colors.blackRubber,
            metalness: 0.0,
            roughness: 0.9
        });

        // === CART FRAME ===
        const cartGroup = new THREE.Group();

        // Main basket frame - bottom
        const bottomFrameGeo = new THREE.BoxGeometry(1.8, 0.08, 2.6);
        const bottomFrame = new THREE.Mesh(bottomFrameGeo, chromeMat);
        bottomFrame.position.set(0, 0.5, 0);
        bottomFrame.castShadow = true;
        cartGroup.add(bottomFrame);

        // Wire mesh bottom (grid pattern)
        for (let x = -0.8; x <= 0.8; x += 0.2) {
            const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.5, 6);
            const wire = new THREE.Mesh(wireGeo, chromeMat);
            wire.rotation.x = Math.PI / 2;
            wire.position.set(x, 0.52, 0);
            cartGroup.add(wire);
        }
        for (let z = -1.2; z <= 1.2; z += 0.2) {
            const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.7, 6);
            const wire = new THREE.Mesh(wireGeo, chromeMat);
            wire.rotation.z = Math.PI / 2;
            wire.position.set(0, 0.52, z);
            cartGroup.add(wire);
        }

        // Cart sides - wire mesh walls
        const createWireSide = (width, height, posX, posZ, rotY) => {
            const sideGroup = new THREE.Group();
            // Vertical wires
            const wireCount = Math.floor(width / 0.15);
            for (let i = 0; i <= wireCount; i++) {
                const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, height, 6);
                const wire = new THREE.Mesh(wireGeo, chromeMat);
                wire.position.set(-width/2 + i * (width/wireCount), height/2, 0);
                sideGroup.add(wire);
            }
            // Horizontal wires
            for (let y = 0.15; y < height; y += 0.2) {
                const hWireGeo = new THREE.CylinderGeometry(0.015, 0.015, width, 6);
                const hWire = new THREE.Mesh(hWireGeo, chromeMat);
                hWire.rotation.z = Math.PI / 2;
                hWire.position.set(0, y, 0);
                sideGroup.add(hWire);
            }
            // Top rail
            const topRailGeo = new THREE.CylinderGeometry(0.03, 0.03, width + 0.1, 8);
            const topRail = new THREE.Mesh(topRailGeo, chromeMat);
            topRail.rotation.z = Math.PI / 2;
            topRail.position.set(0, height, 0);
            sideGroup.add(topRail);

            sideGroup.position.set(posX, 0.55, posZ);
            sideGroup.rotation.y = rotY;
            return sideGroup;
        };

        // Left side wall
        cartGroup.add(createWireSide(2.5, 1.0, -0.9, 0, Math.PI / 2));
        // Right side wall
        cartGroup.add(createWireSide(2.5, 1.0, 0.9, 0, Math.PI / 2));
        // Front wall
        cartGroup.add(createWireSide(1.7, 1.0, 0, -1.25, 0));
        // Back wall (shorter for child to sit)
        cartGroup.add(createWireSide(1.7, 0.6, 0, 1.25, 0));

        // Corner posts
        const cornerPositions = [[-0.85, -1.2], [0.85, -1.2], [-0.85, 1.2], [0.85, 1.2]];
        cornerPositions.forEach(([x, z]) => {
            const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
            const post = new THREE.Mesh(postGeo, chromeMat);
            post.position.set(x, 1.05, z);
            cartGroup.add(post);
        });

        // === RED PLASTIC CHILD SEAT ===
        const seatGroup = new THREE.Group();
        // Seat back
        const seatBackGeo = new THREE.BoxGeometry(1.2, 0.6, 0.1);
        const seatBack = new THREE.Mesh(seatBackGeo, redPlasticMat);
        seatBack.position.set(0, 1.1, 0.9);
        seatGroup.add(seatBack);
        // Seat bottom
        const seatBottomGeo = new THREE.BoxGeometry(1.2, 0.08, 0.5);
        const seatBottom = new THREE.Mesh(seatBottomGeo, redPlasticMat);
        seatBottom.position.set(0, 0.75, 1.05);
        seatGroup.add(seatBottom);
        // Leg holes
        const legHoleGeo = new THREE.BoxGeometry(0.25, 0.08, 0.3);
        const legHole1 = new THREE.Mesh(legHoleGeo, darkChromeMat);
        legHole1.position.set(-0.3, 0.72, 1.2);
        seatGroup.add(legHole1);
        const legHole2 = new THREE.Mesh(legHoleGeo, darkChromeMat);
        legHole2.position.set(0.3, 0.72, 1.2);
        seatGroup.add(legHole2);
        cartGroup.add(seatGroup);

        // === HANDLE ===
        const handleBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8);
        const handleBar = new THREE.Mesh(handleBarGeo, darkChromeMat);
        handleBar.rotation.z = Math.PI / 2;
        handleBar.position.set(0, 2.0, 1.6);
        cartGroup.add(handleBar);
        // Handle grips (rubber)
        const gripGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8);
        const gripL = new THREE.Mesh(gripGeo, blackRubberMat);
        gripL.rotation.z = Math.PI / 2;
        gripL.position.set(-0.75, 2.0, 1.6);
        cartGroup.add(gripL);
        const gripR = new THREE.Mesh(gripGeo, blackRubberMat);
        gripR.rotation.z = Math.PI / 2;
        gripR.position.set(0.75, 2.0, 1.6);
        cartGroup.add(gripR);
        // Handle supports
        const supportGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
        const supportL = new THREE.Mesh(supportGeo, chromeMat);
        supportL.position.set(-0.85, 1.75, 1.45);
        supportL.rotation.x = -0.3;
        cartGroup.add(supportL);
        const supportR = new THREE.Mesh(supportGeo, chromeMat);
        supportR.position.set(0.85, 1.75, 1.45);
        supportR.rotation.x = -0.3;
        cartGroup.add(supportR);

        // === WHEELS WITH CASTERS ===
        const createWheel = (x, z) => {
            const wheelGroup = new THREE.Group();
            // Caster housing
            const casterGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8);
            const caster = new THREE.Mesh(casterGeo, darkChromeMat);
            caster.position.y = 0.35;
            wheelGroup.add(caster);
            // Caster fork
            const forkGeo = new THREE.BoxGeometry(0.04, 0.2, 0.12);
            const fork = new THREE.Mesh(forkGeo, chromeMat);
            fork.position.set(0, 0.2, 0);
            wheelGroup.add(fork);
            // Wheel
            const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16);
            const wheel = new THREE.Mesh(wheelGeo, blackRubberMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.y = 0.15;
            wheelGroup.add(wheel);
            // Wheel hub
            const hubGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12);
            const hub = new THREE.Mesh(hubGeo, chromeMat);
            hub.rotation.z = Math.PI / 2;
            hub.position.y = 0.15;
            wheelGroup.add(hub);

            wheelGroup.position.set(x, 0, z);
            return wheelGroup;
        };
        cartGroup.add(createWheel(-0.75, -1.0));
        cartGroup.add(createWheel(0.75, -1.0));
        cartGroup.add(createWheel(-0.75, 1.0));
        cartGroup.add(createWheel(0.75, 1.0));

        // === FRAME LEGS ===
        const legGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.5, 8);
        const legPositions = [[-0.8, -1.0], [0.8, -1.0], [-0.8, 1.0], [0.8, 1.0]];
        legPositions.forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeo, chromeMat);
            leg.position.set(x, 0.4, z);
            cartGroup.add(leg);
        });

        playerCart.add(cartGroup);

        // === CHILD CHARACTER ===
        const childGroup = this._createChild(THREE, colors);
        childGroup.position.z = 0.3;
        playerCart.add(childGroup);
        result.child = childGroup;

        // === SLINGSHOT ===
        const slingshotArm = this._createSlingshot(THREE, colors);
        slingshotArm.position.set(-0.45, 1.15, -0.2);
        slingshotArm.rotation.x = -0.3;
        playerCart.add(slingshotArm);
        result.slingshot = slingshotArm;

        playerCart.position.set(0, 0, -5);

        return result;
    },

    /**
     * Create child character mesh
     * @private
     */
    _createChild(THREE, colors) {
        const childGroup = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: colors.skin, roughness: 0.8 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: colors.shirt, roughness: 0.7 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: colors.pants, roughness: 0.7 });
        const hairMat = new THREE.MeshStandardMaterial({ color: colors.hair, roughness: 0.9 });

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.7, 12);
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 1.2;
        torso.castShadow = true;
        childGroup.add(torso);

        // Head
        const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.85;
        head.castShadow = true;
        childGroup.add(head);

        // Hair (spiky/messy)
        const hairBaseGeo = new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
        hairBase.position.y = 1.9;
        childGroup.add(hairBase);
        // Hair spikes
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeGeo = new THREE.ConeGeometry(0.06, 0.15, 6);
            const spike = new THREE.Mesh(spikeGeo, hairMat);
            spike.position.set(
                Math.cos(angle) * 0.2,
                2.1,
                Math.sin(angle) * 0.2
            );
            spike.rotation.x = Math.sin(angle) * 0.3;
            spike.rotation.z = -Math.cos(angle) * 0.3;
            childGroup.add(spike);
        }

        // Eyes
        const eyeWhiteGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const eyePupilGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const eyePupilMat = new THREE.MeshStandardMaterial({ color: colors.eyes });
        // Left eye
        const eyeWhiteL = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        eyeWhiteL.position.set(-0.1, 1.88, -0.24);
        childGroup.add(eyeWhiteL);
        const eyePupilL = new THREE.Mesh(eyePupilGeo, eyePupilMat);
        eyePupilL.position.set(-0.1, 1.88, -0.28);
        childGroup.add(eyePupilL);
        // Right eye
        const eyeWhiteR = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        eyeWhiteR.position.set(0.1, 1.88, -0.24);
        childGroup.add(eyeWhiteR);
        const eyePupilR = new THREE.Mesh(eyePupilGeo, eyePupilMat);
        eyePupilR.position.set(0.1, 1.88, -0.28);
        childGroup.add(eyePupilR);

        // Eyebrows (mischievous angle)
        const browGeo = new THREE.BoxGeometry(0.1, 0.02, 0.02);
        const browMat = new THREE.MeshStandardMaterial({ color: colors.eyebrows });
        const browL = new THREE.Mesh(browGeo, browMat);
        browL.position.set(-0.1, 1.96, -0.26);
        browL.rotation.z = 0.2;
        childGroup.add(browL);
        const browR = new THREE.Mesh(browGeo, browMat);
        browR.position.set(0.1, 1.96, -0.26);
        browR.rotation.z = -0.2;
        childGroup.add(browR);

        // Mouth (grin)
        const mouthGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 12, Math.PI);
        const mouthMat = new THREE.MeshStandardMaterial({ color: colors.mouth });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, 1.78, -0.25);
        mouth.rotation.x = Math.PI;
        childGroup.add(mouth);

        // Nose
        const noseGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const nose = new THREE.Mesh(noseGeo, skinMat);
        nose.position.set(0, 1.84, -0.28);
        childGroup.add(nose);

        // Arms
        const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 8);
        // Left arm (extended forward for slingshot)
        const leftArm = new THREE.Mesh(armGeo, shirtMat);
        leftArm.rotation.x = -Math.PI / 3;
        leftArm.rotation.z = Math.PI / 6;
        leftArm.position.set(-0.35, 1.35, -0.25);
        childGroup.add(leftArm);
        // Right arm (pulling back slingshot)
        const rightArm = new THREE.Mesh(armGeo, shirtMat);
        rightArm.rotation.x = -Math.PI / 4;
        rightArm.rotation.z = -Math.PI / 6;
        rightArm.position.set(0.35, 1.35, -0.15);
        childGroup.add(rightArm);

        // Hands
        const handGeo = new THREE.SphereGeometry(0.07, 8, 8);
        const handL = new THREE.Mesh(handGeo, skinMat);
        handL.position.set(-0.45, 1.15, -0.5);
        childGroup.add(handL);
        const handR = new THREE.Mesh(handGeo, skinMat);
        handR.position.set(0.4, 1.2, -0.35);
        childGroup.add(handR);

        // Legs (in seat holes)
        const legGeoChild = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8);
        const legL = new THREE.Mesh(legGeoChild, pantsMat);
        legL.position.set(-0.2, 0.65, 1.15);
        childGroup.add(legL);
        const legR = new THREE.Mesh(legGeoChild, pantsMat);
        legR.position.set(0.2, 0.65, 1.15);
        childGroup.add(legR);

        // Feet
        const footGeo = new THREE.BoxGeometry(0.12, 0.08, 0.18);
        const footMat = new THREE.MeshStandardMaterial({ color: colors.shoes });
        const footL = new THREE.Mesh(footGeo, footMat);
        footL.position.set(-0.2, 0.45, 1.2);
        childGroup.add(footL);
        const footR = new THREE.Mesh(footGeo, footMat);
        footR.position.set(0.2, 0.45, 1.2);
        childGroup.add(footR);

        return childGroup;
    },

    /**
     * Create slingshot mesh (third-person version)
     * @private
     */
    _createSlingshot(THREE, colors) {
        const slingshotArm = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({
            color: colors.wood,
            roughness: 0.8
        });
        const rubberMat = new THREE.MeshStandardMaterial({
            color: colors.rubber,
            roughness: 0.6
        });

        // Y-frame handle
        const handleGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 8);
        const slHandle = new THREE.Mesh(handleGeo, woodMat);
        slHandle.rotation.x = Math.PI / 2;
        slHandle.position.z = -0.25;
        slingshotArm.add(slHandle);

        // Fork prongs
        const forkGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.25, 8);
        const forkL = new THREE.Mesh(forkGeo, woodMat);
        forkL.rotation.z = Math.PI / 5;
        forkL.position.set(-0.1, 0.1, -0.5);
        slingshotArm.add(forkL);
        const forkR = new THREE.Mesh(forkGeo, woodMat);
        forkR.rotation.z = -Math.PI / 5;
        forkR.position.set(0.1, 0.1, -0.5);
        slingshotArm.add(forkR);

        // Fork tips (rounded)
        const tipGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const tipL = new THREE.Mesh(tipGeo, woodMat);
        tipL.position.set(-0.15, 0.2, -0.5);
        slingshotArm.add(tipL);
        const tipR = new THREE.Mesh(tipGeo, woodMat);
        tipR.position.set(0.15, 0.2, -0.5);
        slingshotArm.add(tipR);

        // Rubber bands
        const bandGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6);
        const bandL = new THREE.Mesh(bandGeo, rubberMat);
        bandL.rotation.x = Math.PI / 3;
        bandL.rotation.z = Math.PI / 8;
        bandL.position.set(-0.1, 0.1, -0.38);
        slingshotArm.add(bandL);
        const bandR = new THREE.Mesh(bandGeo, rubberMat);
        bandR.rotation.x = Math.PI / 3;
        bandR.rotation.z = -Math.PI / 8;
        bandR.position.set(0.1, 0.1, -0.38);
        slingshotArm.add(bandR);

        // Pouch
        const pouchGeo = new THREE.SphereGeometry(0.06, 8, 8);
        pouchGeo.scale(1, 0.5, 1);
        const pouchMat = new THREE.MeshStandardMaterial({ color: colors.wood, roughness: 0.9 });
        const pouch = new THREE.Mesh(pouchGeo, pouchMat);
        pouch.position.set(0, 0.02, -0.25);
        slingshotArm.add(pouch);

        return slingshotArm;
    },

    /**
     * Update cart visual state (leaning)
     * @param {THREE.Group} cart - Player cart group
     * @param {number} leanAngle - Current lean angle
     */
    updateCartLean(cart, leanAngle) {
        if (!cart) return;
        cart.rotation.z = leanAngle;
    }
};
