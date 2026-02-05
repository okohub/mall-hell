// ============================================
// HEALTH UP - Pickup Mesh
// ============================================
// Stylized heart pickup (drop-only)

const HealthUpMesh = {
    /**
     * Create pickup mesh for health up
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Power-up config (includes visual)
     * @returns {THREE.Group}
     */
    createPickupMesh(THREE, config) {
        const pickup = new THREE.Group();
        const baseColor = new THREE.Color(config?.visual?.color || 0xe74c3c);
        const glowColor = config?.visual?.glowColor || 0xff6b6b;

        // Heart body material
        const heartMat = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.35,
            metalness: 0.2,
            emissive: baseColor,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });

        // Heart silhouette using a shape (more recognizable than spheres)
        const shape = new THREE.Shape();
        shape.moveTo(0, 0.2);
        shape.bezierCurveTo(0, 0.5, -0.5, 0.55, -0.5, 0.15);
        shape.bezierCurveTo(-0.5, -0.25, -0.1, -0.45, 0, -0.6);
        shape.bezierCurveTo(0.1, -0.45, 0.5, -0.25, 0.5, 0.15);
        shape.bezierCurveTo(0.5, 0.55, 0, 0.5, 0, 0.2);

        const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
            depth: 0.08,
            bevelEnabled: false
        });
        extrudeGeo.center();

        const heart = new THREE.Mesh(extrudeGeo, heartMat);
        heart.scale.set(1.0, 1.12, 1.0);
        pickup.add(heart);

        // Subtle glow shell
        const glowMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.6
        });
        const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, 0.05, 0);
        pickup.add(glow);

        return pickup;
    }
};
