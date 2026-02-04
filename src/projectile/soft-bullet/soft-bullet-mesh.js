// ============================================
// SOFT BULLET PROJECTILE MESH
// ============================================
// Creates tapered soft bullet mesh + optional glow

const SoftBulletProjectileMesh = {
    /**
     * Create soft bullet projectile mesh group
     * @param {THREE} THREE - Three.js library
     * @param {Object} context - Visual context
     * @returns {THREE.Group}
     */
    createMesh(THREE, context) {
        const group = new THREE.Group();
        const length = context.length * context.sizeScale;
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
            group.add(new THREE.Mesh(glowGeo, glowMat));
        }

        return group;
    }
};
