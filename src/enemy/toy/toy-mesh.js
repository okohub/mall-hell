// ============================================
// TOY MESH - Stateless Mesh Creation
// ============================================
// Standalone toy mesh (no dependency on dinosaur mesh)

const ToyMesh = {
    /**
     * Create toy mesh
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Enemy type config
     * @returns {THREE.Group}
     */
    createMesh(THREE, config) {
        const group = new THREE.Group();
        const size = config?.size || { w: 1.0, h: 0.75, d: 1.1 };

        const theme = {
            bodyColor: 0x2ecc71,
            bellyColor: 0xa8ffcc,
            accentColor: 0x1e9e5a,
            headColor: 0x27ae60,
            mouthColor: 0x7a3b3b,
            eyeColor: 0xffffff,
            pupilColor: 0x1a1a1a,
            tongueColor: 0xff6b6b
        };

        const bodyMat = new THREE.MeshStandardMaterial({
            color: theme.bodyColor,
            roughness: 0.7,
            metalness: 0.05
        });
        const bellyMat = new THREE.MeshStandardMaterial({
            color: theme.bellyColor,
            roughness: 0.8,
            metalness: 0.02
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: theme.accentColor,
            roughness: 0.7,
            metalness: 0.05
        });
        const headMat = new THREE.MeshStandardMaterial({
            color: theme.headColor,
            roughness: 0.65,
            metalness: 0.05
        });
        const mouthMat = new THREE.MeshStandardMaterial({
            color: theme.mouthColor,
            roughness: 0.6,
            metalness: 0.03
        });
        const eyeMat = new THREE.MeshStandardMaterial({
            color: theme.eyeColor,
            roughness: 0.2,
            metalness: 0.0
        });
        const pupilMat = new THREE.MeshStandardMaterial({
            color: theme.pupilColor,
            roughness: 0.2,
            metalness: 0.0
        });
        const tongueMat = new THREE.MeshStandardMaterial({
            color: theme.tongueColor,
            roughness: 0.4,
            metalness: 0.0
        });

        const legHeight = 0.30 * size.h;
        const bodyHeight = 0.52 * size.h;
        const bodyWidth = 0.8 * size.w;
        const bodyDepth = 0.75 * size.d;

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
            bodyMat
        );
        body.position.set(0, legHeight + bodyHeight / 2, 0);
        group.add(body);

        const belly = new THREE.Mesh(
            new THREE.BoxGeometry(bodyWidth * 0.7, bodyHeight * 0.6, bodyDepth * 0.6),
            bellyMat
        );
        belly.position.set(0, legHeight + bodyHeight * 0.45, bodyDepth * 0.1);
        group.add(belly);

        const createLimb = (w, h, d, mat) => {
            const limb = new THREE.Group();
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.position.y = -h / 2;
            limb.add(mesh);
            return limb;
        };

        const leftLeg = createLimb(0.18 * size.w, legHeight, 0.18 * size.d, bodyMat);
        const rightLeg = createLimb(0.18 * size.w, legHeight, 0.18 * size.d, bodyMat);
        leftLeg.position.set(0.25 * size.w, legHeight, 0.12 * size.d);
        rightLeg.position.set(-0.25 * size.w, legHeight, 0.12 * size.d);
        group.add(leftLeg, rightLeg);

        const armHeight = 0.2 * size.h;
        const leftArm = createLimb(0.12 * size.w, armHeight, 0.12 * size.d, accentMat);
        const rightArm = createLimb(0.12 * size.w, armHeight, 0.12 * size.d, accentMat);
        leftArm.position.set(0.38 * size.w, legHeight + bodyHeight * 0.65, bodyDepth * 0.28);
        rightArm.position.set(-0.38 * size.w, legHeight + bodyHeight * 0.65, bodyDepth * 0.28);
        group.add(leftArm, rightArm);

        const headGroup = new THREE.Group();
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.5 * size.w, 0.44 * size.h, 0.45 * size.d),
            headMat
        );
        head.position.set(0, 0, 0);
        headGroup.add(head);

        const snout = new THREE.Mesh(
            new THREE.BoxGeometry(0.38 * size.w, 0.2 * size.h, 0.35 * size.d),
            headMat
        );
        snout.position.set(0, -0.02 * size.h, 0.32 * size.d);
        headGroup.add(snout);

        const jaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.34 * size.w, 0.12 * size.h, 0.3 * size.d),
            mouthMat
        );
        jaw.position.set(0, -0.13 * size.h, 0.28 * size.d);
        jaw.rotation.x = 0.25;
        headGroup.add(jaw);
        headGroup.userData.jaw = jaw;

        const tongue = new THREE.Mesh(
            new THREE.BoxGeometry(0.2 * size.w, 0.05 * size.h, 0.18 * size.d),
            tongueMat
        );
        tongue.position.set(0, -0.16 * size.h, 0.34 * size.d);
        headGroup.add(tongue);

        const eyeRadius = 0.06 * size.w;
        const pupilRadius = 0.03 * size.w;
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 10, 10), eyeMat);
        const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 10, 10), eyeMat);
        eyeLeft.position.set(0.14 * size.w, 0.08 * size.h, 0.2 * size.d);
        eyeRight.position.set(-0.14 * size.w, 0.08 * size.h, 0.2 * size.d);
        const pupilLeft = new THREE.Mesh(new THREE.SphereGeometry(pupilRadius, 8, 8), pupilMat);
        const pupilRight = new THREE.Mesh(new THREE.SphereGeometry(pupilRadius, 8, 8), pupilMat);
        pupilLeft.position.set(0.14 * size.w, 0.08 * size.h, 0.26 * size.d);
        pupilRight.position.set(-0.14 * size.w, 0.08 * size.h, 0.26 * size.d);
        headGroup.add(eyeLeft, eyeRight, pupilLeft, pupilRight);

        const crest = new THREE.Mesh(
            new THREE.BoxGeometry(0.16 * size.w, 0.12 * size.h, 0.12 * size.d),
            accentMat
        );
        crest.position.set(0, 0.31 * size.h, -0.03 * size.d);
        headGroup.add(crest);

        headGroup.position.set(0, legHeight + bodyHeight * 1.02, bodyDepth * 0.35);
        group.add(headGroup);

        const tail = new THREE.Group();
        const tailMesh = new THREE.Mesh(
            new THREE.ConeGeometry(0.12 * size.w, 0.55 * size.d, 6),
            accentMat
        );
        tailMesh.rotation.x = Math.PI / 2;
        tailMesh.position.z = -0.28 * size.d;
        tail.add(tailMesh);
        tail.position.set(0, legHeight + bodyHeight * 0.55, -bodyDepth * 0.55);
        group.add(tail);

        group.userData.body = body;
        group.userData.head = headGroup;
        group.userData.leftLeg = leftLeg;
        group.userData.rightLeg = rightLeg;
        group.userData.leftArm = leftArm;
        group.userData.rightArm = rightArm;
        group.userData.tail = tail;
        group.userData.jaw = jaw;

        return group;
    },

    /**
     * Apply hit flash (no-op for toy)
     * @param {THREE.Group} enemyMesh
     * @param {number} intensity
     */
    applyHitFlash(enemyMesh, intensity) {
        if (!enemyMesh) return;
        enemyMesh.traverse((child) => {
            if (child.material && child.material.emissive) {
                child.material.emissiveIntensity = Math.max(child.material.emissiveIntensity || 0, intensity * 0.4);
            }
        });
    }
};
