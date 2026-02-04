// ============================================
// RAY PROJECTILE MESH
// ============================================
// Creates elongated beam mesh + glow

const RayProjectileMesh = {
    /**
     * Create ray projectile mesh group
     * @param {THREE} THREE - Three.js library
     * @param {Object} context - Visual context
     * @returns {THREE.Group}
     */
    createMesh(THREE, context) {
        const group = new THREE.Group();
        const rayRadius = context.baseSize * context.sizeScale * 0.4;
        const rayLength = context.length * context.sizeScale * 1.5;

        const emissiveIntensity = context.emissiveIntensity * 1.5;
        const projMat = new THREE.MeshStandardMaterial({
            color: context.baseColor,
            emissive: context.hasGlow ? context.glowColor : 0x000000,
            emissiveIntensity: emissiveIntensity
        });

        const geo = new THREE.CylinderGeometry(rayRadius, rayRadius, rayLength, 8);
        const mesh = new THREE.Mesh(geo, projMat);
        mesh.rotation.x = Math.PI / 2;
        group.add(mesh);

        if (context.hasGlow) {
            const glowRadius = context.baseSize * 2.5 * context.sizeScale;
            const glowLength = context.length * context.sizeScale * 1.3;
            const glowGeo = new THREE.CylinderGeometry(glowRadius, glowRadius, glowLength, 8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: context.glowColor,
                transparent: true,
                opacity: context.glowOpacity * 1.5
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.x = Math.PI / 2;
            group.add(glow);
        }

        return group;
    }
};
