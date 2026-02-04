// ============================================
// DINOSAUR MESH - Pure Mesh Creation
// ============================================
// Stateless mesh creation for dinosaur enemy
// Receives all dependencies as parameters

const DinosaurMesh = {
    /**
     * Create complete dinosaur enemy with health bar
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Enemy type config
     * @returns {THREE.Group} Complete dinosaur group with health bar
     */
    createEnemy(THREE, config) {
        const group = new THREE.Group();

        // Merge theme with config for mesh creation
        const configWithTheme = { ...config, visual: { ...Dinosaur.theme, size: config.size } };

        // Create dinosaur mesh
        const visual = this.createMesh(THREE, configWithTheme);
        group.add(visual);

        // Copy all userData references
        Object.assign(group.userData, visual.userData);
        group.userData.cart = visual;

        // Boss health bar - larger and higher
        const healthBar = this._createHealthBar(THREE);
        healthBar.position.y = 12;
        healthBar.rotation.x = -0.3;
        group.add(healthBar);
        group.userData.healthBar = healthBar;

        return group;
    },

    /**
     * Create toy dinosaur mesh (small, collectible look)
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group} Toy dinosaur mesh group
     */
    createToy(THREE) {
        const toyTheme = {
            bodyColor: 0x2ecc71,
            bellyColor: 0xa8ffcc,
            stripeColor: 0x1e9e5a,
            headColor: 0x27ae60,
            mouthColor: 0x5d2a2a,
            eyeColor: 0xffffff,
            pupilColor: 0x1a1a1a,
            teethColor: 0xfef6e4,
            tongueColor: 0xff6b6b
        };

        const configWithTheme = { visual: { ...toyTheme, size: { w: 1.2, h: 0.9, d: 1.4 } } };
        const toy = this.createMesh(THREE, configWithTheme);
        toy.scale.set(0.35, 0.35, 0.35);
        return toy;
    },

    /**
     * Create dinosaur enemy mesh - T-Rex style boss
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Enemy type config
     * @returns {THREE.Group} Dinosaur enemy mesh group
     */
    createMesh(THREE, config) {
        const group = new THREE.Group();
        const v = config.visual;

        // === DINOSAUR (no cart, just the dino) ===
        const dinosaur = this._createFullDinosaur(THREE, v);
        dinosaur.position.set(0, 0, 0);
        dinosaur.rotation.y = Math.PI; // Face the player (head towards +Z)
        group.add(dinosaur);

        // Store references
        group.userData.dinosaur = dinosaur;
        group.userData.body = dinosaur; // For hit flash compatibility
        group.userData.leftLeg = dinosaur.userData.leftLeg;
        group.userData.rightLeg = dinosaur.userData.rightLeg;
        group.userData.leftArm = dinosaur.userData.leftArm;
        group.userData.rightArm = dinosaur.userData.rightArm;
        group.userData.head = dinosaur.userData.head;
        group.userData.tail = dinosaur.userData.tail;
        group.userData.config = config;

        return group;
    },

    /**
     * Create T-Rex - organic, scary, unmistakably a dinosaur
     * @private
     */
    _createFullDinosaur(THREE, v) {
        const dinosaur = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: v.bodyColor || 0x8B5A2B,
            roughness: 0.7,
            metalness: 0.05
        });

        const bellyMat = new THREE.MeshStandardMaterial({
            color: v.bellyColor || 0xD2B48C,
            roughness: 0.8,
            metalness: 0.02
        });

        const stripeMat = new THREE.MeshStandardMaterial({
            color: v.stripeColor || 0x5D3A1A,
            roughness: 0.7,
            metalness: 0.05
        });

        // Scale factor - big boss!
        const S = 2.0;

        // ==========================================
        // BODY - Barrel-shaped torso, tilted forward
        // ==========================================
        // Main body - cylinder tilted forward to suggest horizontal posture
        const torsoGroup = new THREE.Group();

        // Upper body (chest area) - wider
        const upperBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.75 * S, 0.65 * S, 1.2 * S, 12),
            bodyMat
        );
        upperBody.position.set(0, 0.6 * S, 0);
        torsoGroup.add(upperBody);

        // Lower body (hip area) - connects to legs
        const lowerBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6 * S, 0.7 * S, 0.8 * S, 12),
            bodyMat
        );
        lowerBody.position.set(0, -0.1 * S, 0);
        torsoGroup.add(lowerBody);

        // Belly (lighter colored, front-facing)
        const belly = new THREE.Mesh(
            new THREE.SphereGeometry(0.5 * S, 12, 10),
            bellyMat
        );
        belly.scale.set(0.8, 1.0, 0.5);
        belly.position.set(0, 0.3 * S, -0.35 * S);
        torsoGroup.add(belly);

        // Position the whole torso
        torsoGroup.position.set(0, 1.8 * S, 0.2 * S);
        torsoGroup.rotation.x = 0.25; // Tilt forward slightly
        dinosaur.add(torsoGroup);

        // ==========================================
        // HEAD - HUGE! The T-Rex signature
        // ==========================================
        const head = this._createDinosaurHead(THREE, v, S * 1.6); // Extra big!
        head.position.set(0, 3.0 * S, -0.6 * S);
        head.rotation.x = -0.1; // Looking at player
        dinosaur.add(head);
        dinosaur.userData.head = head;

        // Thick neck connecting head to body
        const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35 * S, 0.5 * S, 0.6 * S, 10),
            bodyMat
        );
        neck.position.set(0, 2.55 * S, -0.2 * S);
        neck.rotation.x = 0.3;
        dinosaur.add(neck);

        // ==========================================
        // LEGS - Powerful dinosaur legs
        // ==========================================
        const legs = this._createDinosaurLegs(THREE, bodyMat, stripeMat, S);
        dinosaur.add(legs);
        dinosaur.userData.leftLeg = legs.userData.leftLeg;
        dinosaur.userData.rightLeg = legs.userData.rightLeg;

        // ==========================================
        // TAIL - Extends back, sways side to side
        // ==========================================
        const tail = this._createDinosaurTail(THREE, bodyMat, stripeMat, S);
        tail.position.set(0, 1.4 * S, 0.8 * S);
        dinosaur.add(tail);
        dinosaur.userData.tail = tail;

        // ==========================================
        // ARMS - Tiny T-Rex arms!
        // ==========================================
        const arms = this._createDinosaurArms(THREE, bodyMat, S);
        arms.position.set(0, 2.1 * S, -0.35 * S);
        dinosaur.add(arms);
        dinosaur.userData.leftArm = arms.userData.leftArm;
        dinosaur.userData.rightArm = arms.userData.rightArm;

        // ==========================================
        // BACK RIDGES - Dinosaur texture
        // ==========================================
        for (let i = 0; i < 6; i++) {
            const ridge = new THREE.Mesh(
                new THREE.ConeGeometry((0.08 - i * 0.008) * S, (0.2 - i * 0.02) * S, 4),
                stripeMat
            );
            ridge.position.set(0, 2.5 * S - i * 0.18 * S, 0.35 * S + i * 0.15 * S);
            ridge.rotation.x = -0.2;
            dinosaur.add(ridge);
        }

        return dinosaur;
    },

    /**
     * Create massive T-Rex head - the defining feature!
     * @private
     */
    _createDinosaurHead(THREE, v, S) {
        const head = new THREE.Group();

        const headMat = new THREE.MeshStandardMaterial({
            color: v.headColor || v.bodyColor || 0x6B4423,
            roughness: 0.7,
            metalness: 0.05
        });

        const darkHeadMat = new THREE.MeshStandardMaterial({
            color: v.stripeColor || 0x5D3A1A,
            roughness: 0.75,
            metalness: 0.05
        });

        const mouthMat = new THREE.MeshBasicMaterial({
            color: v.mouthColor || 0x4A1515
        });

        const teethMat = new THREE.MeshStandardMaterial({
            color: v.teethColor || 0xFFFFF0,
            roughness: 0.3
        });

        const eyeMat = new THREE.MeshBasicMaterial({
            color: v.eyeColor || 0xFFCC00
        });

        // ==========================================
        // UPPER SKULL - Angular T-Rex head, NOT a pig!
        // ==========================================
        // Back of skull (box-ish)
        const skullBack = new THREE.Mesh(
            new THREE.BoxGeometry(0.55 * S, 0.4 * S, 0.4 * S),
            headMat
        );
        skullBack.position.set(0, 0.1 * S, 0.1 * S);
        head.add(skullBack);

        // Upper snout - RECTANGULAR box, not cylinder!
        const upperSnout = new THREE.Mesh(
            new THREE.BoxGeometry(0.45 * S, 0.3 * S, 0.6 * S),
            headMat
        );
        upperSnout.position.set(0, 0, -0.35 * S);
        head.add(upperSnout);

        // Snout tip - FLAT front, not round pig nose!
        const snoutTip = new THREE.Mesh(
            new THREE.BoxGeometry(0.4 * S, 0.25 * S, 0.2 * S),
            headMat
        );
        snoutTip.position.set(0, -0.02 * S, -0.7 * S);
        head.add(snoutTip);

        // Brow ridges - angular, fierce
        [-1, 1].forEach((side) => {
            const browRidge = new THREE.Mesh(
                new THREE.BoxGeometry(0.2 * S, 0.1 * S, 0.25 * S),
                darkHeadMat
            );
            browRidge.position.set(side * 0.18 * S, 0.28 * S, -0.1 * S);
            browRidge.rotation.z = side * 0.2; // Angry angle
            head.add(browRidge);
        });

        // ==========================================
        // EYES - Fierce and glowing
        // ==========================================
        [-1, 1].forEach((side, i) => {
            // Eye socket (depression)
            const socket = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 * S, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
            );
            socket.position.set(side * 0.22 * S, 0.12 * S, -0.15 * S);
            head.add(socket);

            // Glowing eye
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.07 * S, 8, 8),
                eyeMat
            );
            eye.position.set(side * 0.24 * S, 0.12 * S, -0.2 * S);
            head.add(eye);

            // Red pupil slit
            const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.03 * S, 6, 6),
                new THREE.MeshBasicMaterial({ color: v.pupilColor || 0xFF0000 })
            );
            pupil.scale.set(0.5, 1.5, 1);
            pupil.position.set(side * 0.26 * S, 0.12 * S, -0.23 * S);
            head.add(pupil);

            if (i === 0) head.userData.leftEye = eye;
            else head.userData.rightEye = eye;
        });

        // Nostrils - on TOP of snout, not on front like a pig!
        [-1, 1].forEach((side) => {
            const nostril = new THREE.Mesh(
                new THREE.BoxGeometry(0.06 * S, 0.03 * S, 0.08 * S),
                new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
            );
            nostril.position.set(side * 0.1 * S, 0.15 * S, -0.65 * S);
            head.add(nostril);
        });

        // ==========================================
        // MOUTH INTERIOR - Dark and scary
        // ==========================================
        const mouthCavity = new THREE.Mesh(
            new THREE.BoxGeometry(0.38 * S, 0.2 * S, 0.55 * S),
            mouthMat
        );
        mouthCavity.position.set(0, -0.12 * S, -0.4 * S);
        head.add(mouthCavity);

        // Upper teeth - big and menacing
        for (let i = -5; i <= 5; i++) {
            if (i === 0) continue;
            const toothSize = (Math.abs(i) < 3) ? 0.12 : 0.08; // Bigger front teeth
            const tooth = new THREE.Mesh(
                new THREE.ConeGeometry(0.025 * S, toothSize * S, 4),
                teethMat
            );
            tooth.position.set(i * 0.035 * S, -0.18 * S, -0.55 * S + Math.abs(i) * 0.02 * S);
            tooth.rotation.x = Math.PI; // Point down
            tooth.rotation.z = (i / 10) * 0.1; // Slight angle outward
            head.add(tooth);
        }

        // ==========================================
        // LOWER JAW - Angular, powerful
        // ==========================================
        const lowerJaw = new THREE.Group();
        lowerJaw.position.set(0, -0.2 * S, 0.05 * S); // Pivot point at back

        // Jaw bone - rectangular!
        const jawMain = new THREE.Mesh(
            new THREE.BoxGeometry(0.4 * S, 0.15 * S, 0.55 * S),
            headMat
        );
        jawMain.position.set(0, -0.02 * S, -0.32 * S);
        lowerJaw.add(jawMain);

        // Chin/front of jaw - angular
        const jawFront = new THREE.Mesh(
            new THREE.BoxGeometry(0.35 * S, 0.12 * S, 0.15 * S),
            headMat
        );
        jawFront.position.set(0, -0.02 * S, -0.62 * S);
        lowerJaw.add(jawFront);

        // Lower teeth
        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            const toothSize = (Math.abs(i) < 2) ? 0.1 : 0.07;
            const tooth = new THREE.Mesh(
                new THREE.ConeGeometry(0.02 * S, toothSize * S, 4),
                teethMat
            );
            tooth.position.set(i * 0.04 * S, 0.06 * S, -0.45 * S + Math.abs(i) * 0.015 * S);
            lowerJaw.add(tooth);
        }

        // Tongue
        const tongue = new THREE.Mesh(
            new THREE.BoxGeometry(0.2 * S, 0.04 * S, 0.25 * S),
            new THREE.MeshStandardMaterial({ color: v.tongueColor || 0xCC3333 })
        );
        tongue.position.set(0, 0.04 * S, -0.3 * S);
        lowerJaw.add(tongue);

        // Start with mouth open
        lowerJaw.rotation.x = 0.35;
        head.add(lowerJaw);
        head.userData.jaw = lowerJaw;

        return head;
    },

    /**
     * Create thick, powerful tail extending backward (+Z)
     * @private
     */
    _createDinosaurTail(THREE, material, stripeMat, S) {
        const tail = new THREE.Group();

        // Smooth tapered tail with overlapping segments
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const size = (0.35 - t * 0.28) * S; // Taper from thick to thin

            const segment = new THREE.Mesh(
                new THREE.SphereGeometry(size, 10, 8),
                (i % 3 === 0) ? stripeMat : material
            );
            segment.scale.set(0.85, 0.7, 1.2);
            // Curve slightly downward and back
            segment.position.set(
                0,
                -i * 0.05 * S,  // Droop down
                i * 0.3 * S     // Extend back
            );
            tail.add(segment);
        }

        // Pointed tip
        const tip = new THREE.Mesh(
            new THREE.ConeGeometry(0.05 * S, 0.4 * S, 6),
            stripeMat
        );
        tip.rotation.x = Math.PI / 2 + 0.2;
        tip.position.set(0, -0.4 * S, 2.5 * S);
        tail.add(tip);

        return tail;
    },

    /**
     * Create T-Rex legs - powerful theropod stance
     * @private
     */
    _createDinosaurLegs(THREE, material, stripeMat, S) {
        const legs = new THREE.Group();

        [-1, 1].forEach((side, index) => {
            const leg = new THREE.Group();
            // Position at hips, wide stance
            leg.position.set(side * 0.5 * S, 0, 0.25 * S);

            // THIGH - Massive, muscular
            const thigh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28 * S, 0.2 * S, 0.9 * S, 10),
                material
            );
            thigh.position.set(side * 0.05 * S, 1.15 * S, 0);
            thigh.rotation.z = side * 0.1;
            thigh.rotation.x = 0.15; // Slight forward lean
            leg.add(thigh);

            // Thigh muscles (bulge)
            const thighMuscle = new THREE.Mesh(
                new THREE.SphereGeometry(0.2 * S, 8, 8),
                material
            );
            thighMuscle.scale.set(1.0, 1.3, 0.8);
            thighMuscle.position.set(side * 0.12 * S, 1.2 * S, -0.05 * S);
            leg.add(thighMuscle);

            // KNEE - Prominent joint
            const knee = new THREE.Mesh(
                new THREE.SphereGeometry(0.16 * S, 10, 8),
                material
            );
            knee.position.set(side * 0.08 * S, 0.65 * S, -0.08 * S);
            leg.add(knee);

            // SHIN - Thinner, angled back
            const shin = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14 * S, 0.1 * S, 0.65 * S, 8),
                material
            );
            shin.position.set(side * 0.03 * S, 0.32 * S, -0.05 * S);
            shin.rotation.x = -0.1;
            leg.add(shin);

            // ANKLE - Bird-like, backwards knee appearance
            const ankle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 * S, 8, 8),
                material
            );
            ankle.position.set(0, 0.08 * S, 0);
            leg.add(ankle);

            // FOOT - Large, three-toed
            const footBase = new THREE.Mesh(
                new THREE.SphereGeometry(0.15 * S, 8, 6),
                material
            );
            footBase.scale.set(1.2, 0.4, 1.5);
            footBase.position.set(0, 0.06 * S, -0.12 * S);
            leg.add(footBase);

            // Three big clawed toes
            [-1, 0, 1].forEach((t) => {
                // Toe
                const toe = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05 * S, 0.035 * S, 0.25 * S, 6),
                    material
                );
                toe.rotation.x = Math.PI / 2 - 0.3;
                toe.rotation.y = t * 0.25;
                toe.position.set(t * 0.1 * S, 0.05 * S, -0.28 * S);
                leg.add(toe);

                // Claw
                const claw = new THREE.Mesh(
                    new THREE.ConeGeometry(0.035 * S, 0.12 * S, 4),
                    stripeMat
                );
                claw.rotation.x = Math.PI / 2 - 0.1;
                claw.rotation.y = t * 0.25;
                claw.position.set(t * 0.12 * S, 0.03 * S, -0.42 * S);
                leg.add(claw);
            });

            legs.add(leg);
            if (index === 0) legs.userData.leftLeg = leg;
            else legs.userData.rightLeg = leg;
        });

        return legs;
    },

    /**
     * Create comically small T-Rex arms - iconic feature!
     * @private
     */
    _createDinosaurArms(THREE, material, S) {
        const arms = new THREE.Group();

        [-1, 1].forEach((side, index) => {
            const arm = new THREE.Group();
            // Position at upper chest, sticking out to sides
            arm.position.set(side * 0.55 * S, 0, 0);

            // Tiny shoulder
            const shoulder = new THREE.Mesh(
                new THREE.SphereGeometry(0.08 * S, 8, 6),
                material
            );
            shoulder.position.set(side * 0.05 * S, 0, 0);
            arm.add(shoulder);

            // Upper arm - stubby, pointing outward/down
            const upperArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06 * S, 0.05 * S, 0.18 * S, 6),
                material
            );
            upperArm.position.set(side * 0.12 * S, -0.08 * S, -0.02 * S);
            upperArm.rotation.z = side * 1.0;
            upperArm.rotation.x = -0.3;
            arm.add(upperArm);

            // Elbow
            const elbow = new THREE.Mesh(
                new THREE.SphereGeometry(0.045 * S, 6, 6),
                material
            );
            elbow.position.set(side * 0.22 * S, -0.14 * S, -0.05 * S);
            arm.add(elbow);

            // Forearm - bent forward
            const forearm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.045 * S, 0.035 * S, 0.14 * S, 6),
                material
            );
            forearm.position.set(side * 0.26 * S, -0.2 * S, -0.1 * S);
            forearm.rotation.z = side * 0.3;
            forearm.rotation.x = -0.8;
            arm.add(forearm);

            // Tiny two-clawed hand
            const handPos = { x: side * 0.28 * S, y: -0.28 * S, z: -0.18 * S };
            [-1, 1].forEach((clawSide, c) => {
                const claw = new THREE.Mesh(
                    new THREE.ConeGeometry(0.02 * S, 0.08 * S, 4),
                    material
                );
                claw.position.set(
                    handPos.x + clawSide * 0.025 * S,
                    handPos.y,
                    handPos.z - 0.02 * S
                );
                claw.rotation.x = -1.0;
                claw.rotation.y = clawSide * 0.2;
                arm.add(claw);
            });

            arms.add(arm);
            if (index === 0) arms.userData.leftArm = arm;
            else arms.userData.rightArm = arm;
        });

        return arms;
    },

    // ==========================================
    // HEALTH BAR - Boss Style
    // ==========================================

    /**
     * Create boss health bar - large and imposing
     * @private
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group} Health bar group
     */
    _createHealthBar(THREE) {
        const group = new THREE.Group();
        const width = 6; // Boss gets wide health bar

        // Background with border
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(width + 0.2, 0.35),
            bgMat
        );
        group.add(bg);

        // Fill bar - orange/red for boss
        const fillMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
        const fill = new THREE.Mesh(
            new THREE.PlaneGeometry(width - 0.1, 0.25),
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
     * Update dinosaur health bar display
     * @param {THREE.Group} healthBar - Health bar group
     * @param {number} percent - Health percentage (0-1)
     */
    updateHealthBar(healthBar, percent) {
        if (!healthBar || !healthBar.userData.fill) return;

        const fill = healthBar.userData.fill;
        const width = healthBar.userData.width || 6;

        fill.scale.x = Math.max(0, percent);
        fill.position.x = -(width / 2) * (1 - percent);

        // Boss bar: orange -> red gradient
        const mat = healthBar.userData.fillMat;
        if (percent > 0.6) {
            mat.color.setHex(0xff4400); // Orange
        } else if (percent > 0.3) {
            mat.color.setHex(0xff2200); // Orange-red
        } else {
            mat.color.setHex(0xff0000); // Red
        }
    },

    /**
     * Apply hit flash effect to dinosaur
     * @param {THREE.Group} enemyMesh - Enemy mesh
     * @param {number} intensity - Flash intensity
     */
    applyHitFlash(enemyMesh, intensity) {
        if (!enemyMesh) return;

        const body = enemyMesh.userData?.body;
        if (body && body.material) {
            if (intensity > 0) {
                body.material.emissive = body.material.emissive || new THREE.Color();
                body.material.emissive.setHex(0xff4400); // Orange flash for dino
                body.material.emissiveIntensity = intensity;
            } else {
                body.material.emissiveIntensity = 0;
            }
        }
    }
};
