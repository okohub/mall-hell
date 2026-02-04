// ============================================
// DINONIZER PROJECTILE MESH - Syringe Visual
// ============================================
// Builds the syringe-shaped projectile for Dinonizer
// Pure mesh creation (no scene or orchestration)

const DinonizerProjectileMesh = {
    /**
     * Create syringe projectile group
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Projectile config
     * @param {Object} context - Visual context (sizes/colors/intensity)
     * @returns {THREE.Group}
     */
    createGroup(THREE, config, context) {
        const group = new THREE.Group();
        const length = (config.length || 0.9) * context.sizeScale;
        const barrelRadius = context.baseSize * context.sizeScale * 0.45;
        const needleRadius = barrelRadius * 0.28;
        const glowColor = context.glowColor || context.baseColor;

        const barrelMat = new THREE.MeshStandardMaterial({
            color: context.baseColor,
            roughness: 0.35,
            metalness: 0.1,
            transparent: true,
            opacity: 0.6,
            emissive: 0x0f1420,
            emissiveIntensity: 0.1
        });

        const fluidMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            roughness: 0.25,
            metalness: 0.1,
            emissive: glowColor,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });

        const needleMat = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            roughness: 0.2,
            metalness: 0.85
        });

        const plungerMat = new THREE.MeshStandardMaterial({
            color: 0x9aa5b1,
            roughness: 0.5,
            metalness: 0.2
        });

        const barrelGeo = new THREE.CylinderGeometry(barrelRadius, barrelRadius, length, 10);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        group.add(barrel);

        const fluidGeo = new THREE.CylinderGeometry(barrelRadius * 0.72, barrelRadius * 0.72, length * 0.62, 10);
        const fluid = new THREE.Mesh(fluidGeo, fluidMat);
        fluid.rotation.x = Math.PI / 2;
        fluid.position.z = -length * 0.08;
        group.add(fluid);

        const needleGeo = new THREE.CylinderGeometry(needleRadius, needleRadius, length * 0.38, 6);
        const needle = new THREE.Mesh(needleGeo, needleMat);
        needle.rotation.x = Math.PI / 2;
        needle.position.z = -length * 0.7;
        group.add(needle);

        const tipGeo = new THREE.ConeGeometry(needleRadius * 1.15, length * 0.12, 6);
        const tip = new THREE.Mesh(tipGeo, needleMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.z = -length * 0.9;
        group.add(tip);

        const collarGeo = new THREE.CylinderGeometry(barrelRadius * 0.95, barrelRadius * 0.95, length * 0.04, 10);
        const collar = new THREE.Mesh(collarGeo, needleMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.z = -length * 0.45;
        group.add(collar);

        const plungerGeo = new THREE.BoxGeometry(barrelRadius * 1.9, barrelRadius * 0.5, length * 0.06);
        const plunger = new THREE.Mesh(plungerGeo, plungerMat);
        plunger.position.z = length * 0.46;
        group.add(plunger);

        const rodGeo = new THREE.CylinderGeometry(barrelRadius * 0.12, barrelRadius * 0.12, length * 0.4, 6);
        const rod = new THREE.Mesh(rodGeo, plungerMat);
        rod.rotation.x = Math.PI / 2;
        rod.position.z = length * 0.2;
        group.add(rod);

        return group;
    }
};
