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

        // Note: Child character and third-person slingshot removed (FPS-only mode)

        playerCart.position.set(0, 0, -5);

        return result;
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
