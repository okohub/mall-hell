// ============================================
// BLOB PROJECTILE MESH
// ============================================
// Creates water blob mesh + optional glow

const BlobProjectileMesh = {
    /**
     * Create blob projectile mesh group
     * @param {THREE} THREE - Three.js library
     * @param {Object} context - Visual context
     * @returns {THREE.Group}
     */
    createMesh(THREE, context) {
        const group = new THREE.Group();
        const geo = new THREE.SphereGeometry(context.baseSize * context.sizeScale, 12, 12);
        const projMat = new THREE.MeshStandardMaterial({
            color: context.baseColor,
            emissive: context.hasGlow ? context.glowColor : 0x000000,
            emissiveIntensity: context.emissiveIntensity
        });

        group.add(new THREE.Mesh(geo, projMat));

        if (context.hasGlow) {
            const glowGeo = new THREE.SphereGeometry(context.baseSize * 1.5 * context.sizeScale, 12, 12);
            const glowMat = new THREE.MeshBasicMaterial({
                color: context.glowColor,
                transparent: true,
                opacity: context.glowOpacity
            });
            group.add(new THREE.Mesh(glowGeo, glowMat));
        }

        return group;
    }
};
