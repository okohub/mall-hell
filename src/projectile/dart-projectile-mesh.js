// ============================================
// DART PROJECTILE MESH
// ============================================
// Creates tapered dart mesh + optional glow

const DartProjectileMesh = {
    /**
     * Create dart projectile group
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Projectile config
     * @param {Object} context - Visual context (sizes/colors/intensity)
     * @returns {THREE.Group}
     */
    createGroup(THREE, config, context) {
        const group = new THREE.Group();
        const length = (config.length || 0.5) * context.sizeScale;
        const geo = new THREE.CylinderGeometry(
            context.baseSize * context.sizeScale * 0.5,
            context.baseSize * context.sizeScale * 0.3,
            length,
            8
        );

        const projMat = new THREE.MeshStandardMaterial({
            color: context.baseColor,
            emissive: context.hasGlow ? context.glowColor : 0x000000,
            emissiveIntensity: context.emissiveIntensity
        });

        const mesh = new THREE.Mesh(geo, projMat);
        mesh.rotation.x = Math.PI / 2;
        group.add(mesh);

        if (context.hasGlow) {
            const glowGeo = new THREE.SphereGeometry(context.baseSize * 1.5 * context.sizeScale, 12, 12);
            const glowMat = new THREE.MeshBasicMaterial({
                color: context.glowColor,
                transparent: true,
                opacity: context.glowOpacity
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            group.add(glow);
        }

        return group;
    }
};
