// ============================================
// EXTRA TIME - Pickup Mesh
// ============================================
// Neon stopwatch pickup for time bonus

const ExtraTimeMesh = {
    /**
     * Create pickup mesh for extra time
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Power-up config (includes visual)
     * @returns {THREE.Group}
     */
    createPickupMesh(THREE, config) {
        const pickup = new THREE.Group();
        const visual = config?.visual || {};
        const bodyColor = new THREE.Color(visual.color || 0x00e5ff);
        const glowColor = new THREE.Color(visual.glowColor || 0x7dffea);

        // Stopwatch body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.2,
            metalness: 0.75,
            emissive: bodyColor,
            emissiveIntensity: 0.35
        });
        const bodyGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.18, 28);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        pickup.add(body);

        // Outer neon ring
        const ringMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.6
        });
        const ringGeo = new THREE.TorusGeometry(0.42, 0.035, 14, 36);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        pickup.add(ring);

        // Crown (top button housing)
        const crownMat = new THREE.MeshStandardMaterial({
            color: 0xdafcff,
            roughness: 0.28,
            metalness: 0.8
        });
        const crownGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.14, 18);
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(0, 0.5, 0);
        pickup.add(crown);

        // Side buttons
        const buttonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12);
        const buttonLeft = new THREE.Mesh(buttonGeo, crownMat);
        buttonLeft.position.set(-0.16, 0.44, 0);
        buttonLeft.rotation.z = Math.PI / 4;
        pickup.add(buttonLeft);

        const buttonRight = new THREE.Mesh(buttonGeo, crownMat);
        buttonRight.position.set(0.16, 0.44, 0);
        buttonRight.rotation.z = -Math.PI / 4;
        pickup.add(buttonRight);

        // Watch face
        const faceMat = new THREE.MeshStandardMaterial({
            color: 0x02161f,
            roughness: 0.2,
            metalness: 0.4,
            emissive: 0x08334a,
            emissiveIntensity: 0.4
        });
        const faceGeo = new THREE.CircleGeometry(0.28, 28);
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.set(0, 0, 0.095);
        pickup.add(face);

        // Tick marks
        const tickMat = new THREE.MeshBasicMaterial({ color: 0x9afcff });
        const tickGeo = new THREE.BoxGeometry(0.03, 0.08, 0.01);
        for (let i = 0; i < 12; i++) {
            const tick = new THREE.Mesh(tickGeo, tickMat);
            const angle = (i / 12) * Math.PI * 2;
            const radius = 0.22;
            tick.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0.1
            );
            tick.rotation.z = angle;
            pickup.add(tick);
        }

        // Clock hand
        const handMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const handGeo = new THREE.BoxGeometry(0.025, 0.16, 0.01);
        const hand = new THREE.Mesh(handGeo, handMat);
        hand.position.set(0.07, 0.04, 0.105);
        hand.rotation.z = Math.PI / 3;
        pickup.add(hand);

        // Center cap
        const centerGeo = new THREE.CircleGeometry(0.03, 16);
        const centerCap = new THREE.Mesh(centerGeo, tickMat);
        centerCap.position.set(0, 0, 0.11);
        pickup.add(centerCap);

        // Soft aura
        const auraMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.35
        });
        const auraGeo = new THREE.SphereGeometry(0.55, 16, 16);
        const aura = new THREE.Mesh(auraGeo, auraMat);
        pickup.add(aura);

        return pickup;
    }
};
