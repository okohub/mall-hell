// ============================================
// ENEMY VISUAL - Mesh Creation
// ============================================
// Self-contained, zero external dependencies
// Creates enemy meshes - receives THREE as parameter

const EnemyVisual = {
    /**
     * Create health bar for enemy
     * @param {THREE} THREE - Three.js library
     * @param {number} width - Health bar width
     * @returns {THREE.Group} Health bar group
     */
    createHealthBar(THREE, width = 2) {
        const group = new THREE.Group();

        // Background with border
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(width + 0.1, 0.25),
            bgMat
        );
        group.add(bg);

        // Fill bar
        const fillMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const fill = new THREE.Mesh(
            new THREE.PlaneGeometry(width - 0.05, 0.15),
            fillMat
        );
        fill.position.z = 0.01;
        group.add(fill);

        group.userData.fill = fill;
        group.userData.fillMat = fillMat;
        group.userData.width = width;

        return group;
    },

    /**
     * Create skeleton enemy mesh - skeleton BEHIND cart, pushing it
     * Player looks at -Z, sees +Z side of enemy, so we build with front at +Z
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Enemy type config
     * @returns {THREE.Group} Skeleton enemy mesh group
     */
    createSkeletonMesh(THREE, config) {
        const group = new THREE.Group();
        const v = config.visual;

        // === SHOPPING CART (professional design) ===
        // Cart is built with front at -Z, so we rotate it 180° to face +Z (towards player)
        const cart = this._createShoppingCart(THREE, v);
        cart.rotation.y = Math.PI; // Rotate cart so front faces +Z (towards player)
        group.add(cart);
        group.userData.cart = cart;
        group.userData.body = cart.userData.body;

        // === SKELETON (positioned BEHIND cart from player's view) ===
        // After cart rotation: cart front at +Z, cart handle at -Z
        // Skeleton stands at -Z (behind cart from player's view), facing handle
        const skeleton = this._createFullSkeleton(THREE, v);
        // Position: at -Z (behind the rotated cart)
        skeleton.position.set(0, 0, -2.8);
        // Rotation: face -Z (towards cart handle) - player sees skeleton's BACK
        skeleton.rotation.y = 0;
        group.add(skeleton);

        // Store references
        group.userData.skeleton = skeleton;
        group.userData.skull = skeleton.userData.skull;
        group.userData.leftEye = skeleton.userData.leftEye;
        group.userData.rightEye = skeleton.userData.rightEye;
        group.userData.leftLeg = skeleton.userData.leftLeg;
        group.userData.rightLeg = skeleton.userData.rightLeg;
        group.userData.leftArm = skeleton.userData.leftArm;
        group.userData.rightArm = skeleton.userData.rightArm;
        group.userData.torso = skeleton.userData.torso;
        group.userData.pelvis = skeleton.userData.pelvis;
        group.userData.config = config;

        return group;
    },

    /**
     * Create professional shopping cart with creepy modifications
     * @private
     */
    _createShoppingCart(THREE, v) {
        const cart = new THREE.Group();

        // === CART BASKET (wire mesh style) ===
        const basketWidth = v.size.w;
        const basketHeight = v.size.h * 0.7;
        const basketDepth = v.size.d;

        // Dark metallic material for cart frame
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.3,
            metalness: 0.8
        });

        // Rusted/creepy accent material
        const accentMat = new THREE.MeshStandardMaterial({
            color: v.cartColor || 0x1a1a1a,
            roughness: 0.6,
            metalness: 0.5
        });

        // Main basket body (dark translucent effect using wireframe)
        const basketGeo = new THREE.BoxGeometry(basketWidth, basketHeight, basketDepth);
        const basketMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.7,
            metalness: 0.4,
            transparent: true,
            opacity: 0.8
        });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = basketHeight / 2 + 0.5;
        cart.add(basket);
        cart.userData.body = basket;

        // Wire frame edges (creates the shopping cart look)
        const wireRadius = 0.035;
        const wireMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.4,
            metalness: 0.7
        });

        // Horizontal wires (top and bottom edges)
        const wirePositions = [
            // Bottom frame
            [0, 0.5, -basketDepth/2, basketWidth, 'x'],
            [0, 0.5, basketDepth/2, basketWidth, 'x'],
            [-basketWidth/2, 0.5, 0, basketDepth, 'z'],
            [basketWidth/2, 0.5, 0, basketDepth, 'z'],
            // Top frame
            [0, basketHeight + 0.5, -basketDepth/2, basketWidth, 'x'],
            [0, basketHeight + 0.5, basketDepth/2, basketWidth, 'x'],
            [-basketWidth/2, basketHeight + 0.5, 0, basketDepth, 'z'],
            [basketWidth/2, basketHeight + 0.5, 0, basketDepth, 'z'],
            // Mid frame
            [0, basketHeight/2 + 0.5, -basketDepth/2, basketWidth, 'x'],
            [0, basketHeight/2 + 0.5, basketDepth/2, basketWidth, 'x'],
        ];

        wirePositions.forEach(([x, y, z, length, axis]) => {
            const wireGeo = new THREE.CylinderGeometry(wireRadius, wireRadius, length, 8);
            const wire = new THREE.Mesh(wireGeo, wireMat);
            wire.position.set(x, y, z);
            if (axis === 'x') wire.rotation.z = Math.PI / 2;
            if (axis === 'z') wire.rotation.x = Math.PI / 2;
            cart.add(wire);
        });

        // Vertical corner posts
        const cornerPositions = [
            [-basketWidth/2, 0, -basketDepth/2],
            [basketWidth/2, 0, -basketDepth/2],
            [-basketWidth/2, 0, basketDepth/2],
            [basketWidth/2, 0, basketDepth/2],
        ];

        cornerPositions.forEach(([x, _, z]) => {
            const postGeo = new THREE.CylinderGeometry(wireRadius * 1.5, wireRadius * 1.5, basketHeight, 8);
            const post = new THREE.Mesh(postGeo, wireMat);
            post.position.set(x, basketHeight/2 + 0.5, z);
            cart.add(post);
        });

        // === CART HANDLE (at back, positive Z) ===
        const handleHeight = basketHeight + 0.8;
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.6
        });

        // Handle uprights
        [-basketWidth/2 + 0.15, basketWidth/2 - 0.15].forEach(x => {
            const upright = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
                handleMat
            );
            upright.position.set(x, handleHeight, basketDepth/2 + 0.1);
            cart.add(upright);
        });

        // Handle bar (grip)
        const handleBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, basketWidth - 0.3, 12),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.8,
                metalness: 0.3
            })
        );
        handleBar.rotation.z = Math.PI / 2;
        handleBar.position.set(0, handleHeight + 0.5, basketDepth/2 + 0.1);
        cart.add(handleBar);
        cart.userData.handle = handleBar;

        // === WHEELS (with realistic design) ===
        const wheelRadius = 0.22;
        const wheelWidth = 0.1;
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.1
        });
        const hubMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.5,
            metalness: 0.6
        });

        const wheelPositions = [
            [-basketWidth/2 + 0.25, wheelRadius, -basketDepth/2 + 0.3],
            [basketWidth/2 - 0.25, wheelRadius, -basketDepth/2 + 0.3],
            [-basketWidth/2 + 0.25, wheelRadius, basketDepth/2 - 0.3],
            [basketWidth/2 - 0.25, wheelRadius, basketDepth/2 - 0.3],
        ];

        wheelPositions.forEach(([x, y, z], i) => {
            const wheelGroup = new THREE.Group();

            // Wheel
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16),
                wheelMat
            );
            wheel.rotation.z = Math.PI / 2;
            wheelGroup.add(wheel);

            // Hub cap
            const hub = new THREE.Mesh(
                new THREE.CylinderGeometry(wheelRadius * 0.4, wheelRadius * 0.4, wheelWidth + 0.02, 8),
                hubMat
            );
            hub.rotation.z = Math.PI / 2;
            wheelGroup.add(hub);

            // Caster mount (for front wheels)
            if (z < 0) {
                const mount = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8),
                    hubMat
                );
                mount.position.y = 0.1;
                wheelGroup.add(mount);
            }

            wheelGroup.position.set(x, y, z);
            // Add slight wobble for creepy effect
            wheelGroup.rotation.y = (i % 2 === 0 ? 0.05 : -0.05);
            cart.add(wheelGroup);
        });

        // === CREEPY ELEMENTS - Devil horns only (face is on skeleton) ===

        const hornMat = new THREE.MeshStandardMaterial({
            color: v.hornColor || 0x8b0000,
            roughness: 0.4,
            metalness: 0.3,
            emissive: v.hornColor || 0x8b0000,
            emissiveIntensity: 0.2
        });

        // Left horn
        const leftHorn = this._createHorn(THREE, hornMat);
        leftHorn.position.set(-basketWidth/3, basketHeight + 0.7, -basketDepth/2 - 0.05);
        leftHorn.rotation.x = -0.3;
        leftHorn.rotation.z = 0.2;
        cart.add(leftHorn);

        // Right horn
        const rightHorn = this._createHorn(THREE, hornMat);
        rightHorn.position.set(basketWidth/3, basketHeight + 0.7, -basketDepth/2 - 0.05);
        rightHorn.rotation.x = -0.3;
        rightHorn.rotation.z = -0.2;
        cart.add(rightHorn);

        return cart;
    },

    /**
     * Create a curved devil horn
     * @private
     */
    _createHorn(THREE, material) {
        const horn = new THREE.Group();

        // Use a curved path for realistic horn
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.05, 0.25, -0.05),
            new THREE.Vector3(0.1, 0.45, 0)
        );

        const hornGeo = new THREE.TubeGeometry(curve, 12, 0.06, 8, false);

        // Taper the horn
        const positions = hornGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            const scale = 1 - (y / 0.5) * 0.7; // Taper towards tip
            const x = positions.getX(i);
            const z = positions.getZ(i);
            // Scale around the curve center
            positions.setX(i, x * Math.max(0.3, scale));
            positions.setZ(i, z * Math.max(0.3, scale));
        }
        positions.needsUpdate = true;
        hornGeo.computeVertexNormals();

        const hornMesh = new THREE.Mesh(hornGeo, material);
        horn.add(hornMesh);

        return horn;
    },

    /**
     * Create complete skeleton figure - properly scaled and connected
     * @private
     */
    _createFullSkeleton(THREE, v) {
        const skeleton = new THREE.Group();

        const boneMat = new THREE.MeshStandardMaterial({
            color: v.boneColor || 0xf5f5dc,
            roughness: 0.6,
            metalness: 0.15
        });

        // Scale factor for overall skeleton size
        const scale = 1.15;

        // === PELVIS (hip center) ===
        const pelvis = this._createPelvis(THREE, boneMat);
        pelvis.position.y = 1.0 * scale;
        pelvis.scale.setScalar(scale);
        skeleton.add(pelvis);
        skeleton.userData.pelvis = pelvis;

        // === LEGS (connected to pelvis, feet at ground level) ===
        const legs = this._createLegs(THREE, boneMat);
        legs.position.y = 0.95 * scale;
        legs.scale.setScalar(scale);
        skeleton.add(legs);
        skeleton.userData.leftLeg = legs.userData.leftLeg;
        skeleton.userData.rightLeg = legs.userData.rightLeg;

        // === SPINE & RIBCAGE (connected to pelvis) ===
        const torso = this._createTorso(THREE, boneMat);
        torso.position.y = 1.1 * scale;
        torso.scale.setScalar(scale);
        skeleton.add(torso);
        skeleton.userData.torso = torso;

        // === ARMS (at shoulder height, reaching forward) ===
        const arms = this._createArms(THREE, boneMat, v);
        arms.position.y = 1.85 * scale;
        arms.scale.setScalar(scale);
        skeleton.add(arms);
        skeleton.userData.leftArm = arms.userData.leftArm;
        skeleton.userData.rightArm = arms.userData.rightArm;

        // === SKULL (on top of spine) ===
        // Skull is rotated 180° to face backwards - creepy effect where skeleton
        // pushes cart but head is turned around to stare at the player
        const skull = this._createSkull(THREE, boneMat, v);
        skull.position.y = 2.35 * scale;
        skull.scale.setScalar(scale * 1.1); // Slightly bigger head for creepy effect
        skull.rotation.y = Math.PI; // Turn head around to face player
        skeleton.add(skull);
        skeleton.userData.skull = skull;
        skeleton.userData.leftEye = skull.userData.leftEye;
        skeleton.userData.rightEye = skull.userData.rightEye;

        return skeleton;
    },

    /**
     * Create skull with creepy joker smile
     * @private
     */
    _createSkull(THREE, boneMat, v) {
        const skull = new THREE.Group();

        // Cranium
        const cranium = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 16, 16),
            boneMat
        );
        cranium.scale.set(1, 1.15, 1.05);
        skull.add(cranium);

        // Cheekbones
        [-0.18, 0.18].forEach(x => {
            const cheek = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                boneMat
            );
            cheek.position.set(x, -0.1, -0.25);
            cheek.scale.set(1, 0.8, 0.6);
            skull.add(cheek);
        });

        // Eye sockets (deep black)
        const socketMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        [-0.1, 0.1].forEach((x, i) => {
            const side = i === 0 ? -1 : 1;

            // Socket depression
            const socket = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 8, 8),
                socketMat
            );
            socket.position.set(x, 0.05, -0.28);
            skull.add(socket);

            // Glowing angry pupil (slightly elongated for menacing look)
            const eyeMat = new THREE.MeshBasicMaterial({
                color: v.eyeColor || 0xff0000
            });
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 8, 8),
                eyeMat
            );
            eye.scale.set(1.2, 0.7, 1); // Squashed for angry look
            eye.position.set(x, 0.05, -0.32);
            eye.rotation.z = side * 0.2; // Slight slant for angry expression
            skull.add(eye);

            // Inner bright core (intense glow center)
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffff00  // Yellow-hot center
            });
            const core = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 8),
                coreMat
            );
            core.position.set(x, 0.05, -0.33);
            skull.add(core);

            // ANGRY EYEBROWS (bone ridges)
            const browMat = new THREE.MeshStandardMaterial({
                color: v.boneColor || 0xf5f5dc,
                roughness: 0.6
            });
            const brow = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.025, 0.04),
                browMat
            );
            // Angled inward for angry expression (\ /)
            brow.position.set(x, 0.14, -0.29);
            brow.rotation.z = side * 0.35; // Angle down toward center
            brow.rotation.x = 0.15; // Slight forward tilt
            skull.add(brow);

            if (i === 0) skull.userData.leftEye = eye;
            else skull.userData.rightEye = eye;
        });

        // Nose cavity (triangular hole)
        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(0.04, 0.08, 3),
            socketMat
        );
        nose.position.set(0, -0.08, -0.3);
        nose.rotation.x = Math.PI;
        skull.add(nose);

        // JOKER SMILE (wide, curved, unsettling)
        const smileMat = new THREE.MeshBasicMaterial({
            color: v.smileColor || 0x8b0000,
            side: THREE.DoubleSide
        });

        // Main smile curve
        const smileArc = new THREE.Mesh(
            new THREE.TorusGeometry(0.15, 0.02, 6, 16, Math.PI * 1.1),
            smileMat
        );
        smileArc.position.set(0, -0.2, -0.26);
        smileArc.rotation.x = Math.PI / 2 - 0.1;
        smileArc.rotation.z = Math.PI + 0.05;
        skull.add(smileArc);

        // Teeth (individual for creepy effect)
        const toothMat = new THREE.MeshStandardMaterial({
            color: 0xfff8e7,
            roughness: 0.4
        });

        // Upper teeth
        for (let i = -4; i <= 4; i++) {
            const tooth = new THREE.Mesh(
                new THREE.BoxGeometry(0.018, 0.035, 0.015),
                toothMat
            );
            const angle = (i / 5) * 0.5;
            tooth.position.set(
                Math.sin(angle) * 0.14,
                -0.17 - Math.abs(i) * 0.003,
                -0.28 - Math.cos(angle) * 0.02
            );
            tooth.rotation.z = angle * 0.15;
            skull.add(tooth);
        }

        // Lower jaw
        const jaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.07, 0.15),
            boneMat
        );
        jaw.position.set(0, -0.3, -0.18);
        skull.add(jaw);

        // Lower teeth
        for (let i = -3; i <= 3; i++) {
            const tooth = new THREE.Mesh(
                new THREE.BoxGeometry(0.016, 0.028, 0.012),
                toothMat
            );
            tooth.position.set(i * 0.025, -0.26, -0.25);
            skull.add(tooth);
        }

        return skull;
    },

    /**
     * Create torso with ribcage and spine
     * @private
     */
    _createTorso(THREE, boneMat) {
        const torso = new THREE.Group();

        // Spine vertebrae
        for (let i = 0; i < 6; i++) {
            const vertebra = new THREE.Mesh(
                new THREE.CylinderGeometry(0.035, 0.04, 0.1, 8),
                boneMat
            );
            vertebra.position.y = -i * 0.12;
            torso.add(vertebra);

            // Spinous process (back bump)
            const process = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, 0.06, 4),
                boneMat
            );
            process.position.set(0, -i * 0.12, 0.05);
            process.rotation.x = -Math.PI / 4;
            torso.add(process);
        }

        // Ribcage
        for (let row = 0; row < 5; row++) {
            const y = -row * 0.14;
            const ribSize = 0.18 - row * 0.015;

            [-1, 1].forEach(side => {
                // Rib bone (curved)
                const rib = new THREE.Mesh(
                    new THREE.TorusGeometry(ribSize, 0.018, 4, 10, Math.PI * 0.55),
                    boneMat
                );
                rib.position.set(side * 0.05, y, -0.03);
                rib.rotation.y = side * Math.PI * 0.35;
                rib.rotation.z = side * Math.PI * 0.1;
                rib.rotation.x = 0.2;
                torso.add(rib);
            });
        }

        // Clavicles (collar bones)
        [-1, 1].forEach(side => {
            const clavicle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.022, 0.018, 0.22, 6),
                boneMat
            );
            clavicle.position.set(side * 0.12, 0.15, -0.02);
            clavicle.rotation.z = side * Math.PI / 3;
            clavicle.rotation.x = 0.2;
            torso.add(clavicle);
        });

        // Shoulder joints
        [-0.25, 0.25].forEach(x => {
            const shoulder = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                boneMat
            );
            shoulder.position.set(x, 0.12, 0);
            torso.add(shoulder);
        });

        return torso;
    },

    /**
     * Create arms reaching forward to grip cart handle
     * Skeleton faces -Z (towards cart), arms reach in -Z direction
     * @private
     */
    _createArms(THREE, boneMat, v) {
        const arms = new THREE.Group();

        [-1, 1].forEach((side, index) => {
            const arm = new THREE.Group();
            arm.position.set(side * 0.3, 0, 0);

            // Upper arm (humerus) - angled forward/down to reach handle
            const upperArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.032, 0.026, 0.4, 8),
                boneMat
            );
            upperArm.position.set(0, -0.12, -0.18);
            upperArm.rotation.x = Math.PI * 0.35; // Reach forward (-Z)
            upperArm.rotation.z = side * 0.12;
            arm.add(upperArm);

            // Elbow joint
            const elbow = new THREE.Mesh(
                new THREE.SphereGeometry(0.035, 8, 8),
                boneMat
            );
            elbow.position.set(side * 0.02, -0.28, -0.42);
            arm.add(elbow);

            // Forearm (radius/ulna) - angled down to handle
            const forearm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.026, 0.02, 0.35, 8),
                boneMat
            );
            forearm.position.set(side * 0.01, -0.42, -0.58);
            forearm.rotation.x = Math.PI * 0.3;
            arm.add(forearm);

            // Wrist
            const wrist = new THREE.Mesh(
                new THREE.SphereGeometry(0.024, 6, 6),
                boneMat
            );
            wrist.position.set(side * 0.01, -0.55, -0.75);
            arm.add(wrist);

            // Hand gripping handle
            const hand = this._createHand(THREE, boneMat);
            hand.position.set(side * 0.01, -0.58, -0.82);
            hand.rotation.x = Math.PI * 0.6; // Grip angle
            hand.rotation.z = side * 0.15;
            arm.add(hand);

            arms.add(arm);

            if (index === 0) arms.userData.leftArm = arm;
            else arms.userData.rightArm = arm;
        });

        return arms;
    },

    /**
     * Create skeleton hand gripping forward (fingers curl in -Z direction)
     * @private
     */
    _createHand(THREE, boneMat) {
        const hand = new THREE.Group();

        // Metacarpals (palm bones)
        const palm = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.035, 0.07),
            boneMat
        );
        hand.add(palm);

        // Fingers (4) - curling forward to grip handle
        for (let i = 0; i < 4; i++) {
            const fingerGroup = new THREE.Group();
            fingerGroup.position.set(-0.025 + i * 0.018, 0, -0.04);

            // Proximal phalanx
            const prox = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.007, 0.038, 5),
                boneMat
            );
            prox.position.z = -0.02;
            prox.rotation.x = Math.PI / 2;
            fingerGroup.add(prox);

            // Middle phalanx (curling down)
            const mid = new THREE.Mesh(
                new THREE.CylinderGeometry(0.007, 0.006, 0.032, 5),
                boneMat
            );
            mid.position.set(0, -0.02, -0.045);
            mid.rotation.x = Math.PI / 2 + 0.5;
            fingerGroup.add(mid);

            // Distal phalanx (curled tight for grip)
            const dist = new THREE.Mesh(
                new THREE.CylinderGeometry(0.006, 0.004, 0.025, 5),
                boneMat
            );
            dist.position.set(0, -0.04, -0.055);
            dist.rotation.x = Math.PI / 2 + 1.0;
            fingerGroup.add(dist);

            hand.add(fingerGroup);
        }

        // Thumb (wrapping around from side)
        const thumb = new THREE.Group();
        thumb.position.set(0.045, 0, 0);
        thumb.rotation.z = -Math.PI / 4;
        thumb.rotation.y = -0.3;

        const thumbBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.007, 0.035, 5),
            boneMat
        );
        thumbBase.position.z = -0.018;
        thumbBase.rotation.x = Math.PI / 2;
        thumb.add(thumbBase);

        const thumbTip = new THREE.Mesh(
            new THREE.CylinderGeometry(0.006, 0.004, 0.028, 5),
            boneMat
        );
        thumbTip.position.set(0, -0.015, -0.04);
        thumbTip.rotation.x = Math.PI / 2 + 0.6;
        thumb.add(thumbTip);

        hand.add(thumb);

        return hand;
    },

    /**
     * Create pelvis
     * @private
     */
    _createPelvis(THREE, boneMat) {
        const pelvis = new THREE.Group();

        // Sacrum (central)
        const sacrum = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.12, 0.08),
            boneMat
        );
        pelvis.add(sacrum);

        // Ilium (hip wings)
        [-1, 1].forEach(side => {
            const ilium = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                boneMat
            );
            ilium.scale.set(1.2, 0.8, 0.5);
            ilium.position.set(side * 0.14, 0.02, 0);
            pelvis.add(ilium);

            // Hip socket
            const socket = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                boneMat
            );
            socket.position.set(side * 0.15, -0.06, 0);
            pelvis.add(socket);
        });

        return pelvis;
    },

    /**
     * Create legs - properly proportioned with feet at y=0 in leg space
     * @private
     */
    _createLegs(THREE, boneMat) {
        const legs = new THREE.Group();

        [-1, 1].forEach((side, index) => {
            const leg = new THREE.Group();
            leg.position.set(side * 0.14, 0, 0);

            // Femur (thigh bone)
            const femur = new THREE.Mesh(
                new THREE.CylinderGeometry(0.038, 0.032, 0.4, 8),
                boneMat
            );
            femur.position.y = -0.2;
            leg.add(femur);

            // Knee cap
            const knee = new THREE.Mesh(
                new THREE.SphereGeometry(0.042, 8, 8),
                boneMat
            );
            knee.position.y = -0.42;
            knee.position.z = -0.01;
            leg.add(knee);

            // Tibia/Fibula (shin bones)
            const tibia = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.024, 0.4, 8),
                boneMat
            );
            tibia.position.y = -0.64;
            leg.add(tibia);

            // Ankle
            const ankle = new THREE.Mesh(
                new THREE.SphereGeometry(0.028, 6, 6),
                boneMat
            );
            ankle.position.y = -0.86;
            leg.add(ankle);

            // Foot (pointing forward in -Z)
            const foot = this._createFoot(THREE, boneMat);
            foot.position.set(0, -0.9, -0.04);
            foot.rotation.y = Math.PI; // Point toes forward
            leg.add(foot);

            legs.add(leg);

            if (index === 0) legs.userData.leftLeg = leg;
            else legs.userData.rightLeg = leg;
        });

        return legs;
    },

    /**
     * Create skeleton foot
     * @private
     */
    _createFoot(THREE, boneMat) {
        const foot = new THREE.Group();

        // Tarsals (heel/ankle bones)
        const heel = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.04, 0.06),
            boneMat
        );
        heel.position.z = 0.02;
        foot.add(heel);

        // Metatarsals (main foot)
        const metatarsal = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.025, 0.1),
            boneMat
        );
        metatarsal.position.set(0, -0.01, 0.08);
        foot.add(metatarsal);

        // Toes
        for (let i = 0; i < 4; i++) {
            const toe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.006, 0.004, 0.035, 4),
                boneMat
            );
            toe.position.set(-0.018 + i * 0.012, -0.01, 0.15);
            toe.rotation.x = Math.PI / 2;
            foot.add(toe);
        }

        return foot;
    },

    /**
     * Animate skeleton eyes to track player
     * Skull is rotated 180° to face player, so eyes are on the +Z side (from skeleton's perspective)
     * but in local skull coordinates they're still at -Z
     */
    animateSkeletonEyes(enemyMesh, targetPos) {
        if (!enemyMesh || !enemyMesh.userData.leftEye) return;

        const leftEye = enemyMesh.userData.leftEye;
        const rightEye = enemyMesh.userData.rightEye;

        // Calculate look direction from enemy to target
        const dx = targetPos.x - enemyMesh.position.x;
        const dz = targetPos.z - enemyMesh.position.z;

        // Since skull is rotated 180°, X movement is inverted, Z tracks normally
        const lookX = Math.max(-0.025, Math.min(0.025, -dx * 0.012));
        const lookZ = Math.max(-0.015, Math.min(0.015, dz * 0.008));

        // Move eyes within sockets (base positions from _createSkull, in local skull coords)
        leftEye.position.x = -0.1 + lookX;
        leftEye.position.z = -0.32 + lookZ;
        rightEye.position.x = 0.1 + lookX;
        rightEye.position.z = -0.32 + lookZ;
    },

    /**
     * Animate skeleton walking - pushing cart with menacing effort
     */
    animateSkeletonWalk(enemyMesh, walkTimer, walkSpeed = 3.5) {
        if (!enemyMesh || !enemyMesh.userData) return walkTimer;

        const skeleton = enemyMesh.userData.skeleton;
        const leftLeg = enemyMesh.userData.leftLeg;
        const rightLeg = enemyMesh.userData.rightLeg;
        const leftArm = enemyMesh.userData.leftArm;
        const rightArm = enemyMesh.userData.rightArm;
        const skull = enemyMesh.userData.skull;
        const torso = enemyMesh.userData.torso;

        // Walking cycle
        const legSwing = Math.sin(walkTimer) * 0.3;
        const armPush = Math.sin(walkTimer * 0.8) * 0.06;
        const bodyBob = Math.abs(Math.sin(walkTimer * 2)) * 0.03;
        const bodySway = Math.sin(walkTimer) * 0.02;
        const pushLean = -0.1; // Lean forward (negative X rotation since facing -Z)

        // Animate legs (opposite phase walking motion)
        if (leftLeg) leftLeg.rotation.x = -legSwing;
        if (rightLeg) rightLeg.rotation.x = legSwing;

        // Animate arms (subtle pushing motion on handle)
        if (leftArm) {
            leftArm.rotation.x = -armPush * 0.25;
            leftArm.position.z = -armPush * 0.04;
        }
        if (rightArm) {
            rightArm.rotation.x = armPush * 0.25;
            rightArm.position.z = armPush * 0.04;
        }

        // Body movement - bob and sway while pushing
        if (skeleton) {
            skeleton.position.y = bodyBob;
            skeleton.rotation.x = pushLean;
            skeleton.rotation.z = bodySway;
        }

        // Head movement - skull already rotated 180° to face player
        // Add subtle nodding/swaying for menacing effect
        if (skull) {
            skull.rotation.x = Math.sin(walkTimer * 0.7) * 0.05; // Subtle nod
            skull.rotation.z = -bodySway * 0.5; // Sway with body
        }

        return walkTimer;
    },

    /**
     * Update health bar display
     */
    updateHealthBar(healthBar, percent) {
        if (!healthBar || !healthBar.userData.fill) return;

        const fill = healthBar.userData.fill;
        const width = healthBar.userData.width || 2;

        fill.scale.x = Math.max(0, percent);
        fill.position.x = -(width / 2) * (1 - percent);

        const mat = healthBar.userData.fillMat;
        if (percent > 0.6) {
            mat.color.setHex(0x00ff00);
        } else if (percent > 0.3) {
            mat.color.setHex(0xffff00);
        } else {
            mat.color.setHex(0xff0000);
        }
    },

    /**
     * Apply hit flash effect
     */
    applyHitFlash(enemyMesh, intensity) {
        if (!enemyMesh) return;

        const body = enemyMesh.userData?.body;
        if (body && body.material) {
            if (intensity > 0) {
                body.material.emissive = body.material.emissive || new THREE.Color();
                body.material.emissive.setHex(0xffffff);
                body.material.emissiveIntensity = intensity;
            } else {
                body.material.emissiveIntensity = 0;
            }
        }
    },

    /**
     * Animate enemy eyes
     */
    animateEyes(enemyMesh, targetPos) {
        this.animateSkeletonEyes(enemyMesh, targetPos);
    },

    /**
     * Create complete enemy with health bar
     */
    createEnemy(THREE, config) {
        const group = new THREE.Group();

        const visual = this.createSkeletonMesh(THREE, config);
        group.add(visual);

        // Copy all userData references
        Object.assign(group.userData, visual.userData);
        group.userData.cart = visual;

        // Health bar
        const healthBar = this.createHealthBar(THREE, 2);
        healthBar.position.y = 3.8;
        healthBar.rotation.x = -0.3;
        group.add(healthBar);
        group.userData.healthBar = healthBar;

        return group;
    }
};
