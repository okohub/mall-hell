// ============================================
// PROJECTILE VISUAL - Mesh Creation
// ============================================
// Self-contained, zero external dependencies
// Creates projectile meshes - receives THREE as parameter

const ProjectileVisual = {
    /**
     * Create projectile mesh based on type config
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Projectile type config
     * @param {number} power - Fire power (0-1) affects glow intensity
     * @returns {THREE.Mesh} Projectile mesh
     */
    createMesh(THREE, config, power = 1.0) {
        let geometry;

        switch (config.geometry) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(config.size, 12, 12);
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(config.size, config.size, config.size);
                break;
            default:
                geometry = new THREE.SphereGeometry(config.size, 12, 12);
        }

        // Calculate emissive intensity based on power
        const emissiveIntensity = config.glow
            ? config.emissiveIntensity.min + (config.emissiveIntensity.max - config.emissiveIntensity.min) * power
            : 0;

        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            emissive: config.glow ? config.glowColor : 0x000000,
            emissiveIntensity: emissiveIntensity,
            roughness: 0.3,
            metalness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Store config for later reference
        mesh.userData.projectileConfig = config;
        mesh.userData.power = power;

        return mesh;
    },

    /**
     * Create point light for glowing projectiles
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Projectile type config
     * @param {number} power - Fire power affects light intensity
     * @returns {THREE.PointLight|null} Point light or null if no glow
     */
    createGlowLight(THREE, config, power = 1.0) {
        if (!config.glow) return null;

        const intensity = 0.5 + power * 0.5;
        const light = new THREE.PointLight(config.glowColor, intensity, 8);
        return light;
    },

    /**
     * Create complete projectile group (mesh + light)
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Projectile type config
     * @param {number} power - Fire power (0-1)
     * @returns {THREE.Group} Group containing mesh and optional light
     */
    createProjectileGroup(THREE, config, power = 1.0) {
        const group = new THREE.Group();

        const mesh = this.createMesh(THREE, config, power);
        group.add(mesh);
        group.userData.mesh = mesh;

        if (config.glow) {
            const light = this.createGlowLight(THREE, config, power);
            if (light) {
                group.add(light);
                group.userData.light = light;
            }
        }

        group.userData.projectileConfig = config;
        group.userData.power = power;
        group.userData.active = true;

        return group;
    },

    /**
     * Create trail effect for projectile
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Projectile type config
     * @returns {THREE.Points} Trail particle system
     */
    createTrail(THREE, config) {
        const trailGeometry = new THREE.BufferGeometry();
        const trailCount = 10;
        const positions = new Float32Array(trailCount * 3);

        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const trailMaterial = new THREE.PointsMaterial({
            color: config.glow ? config.glowColor : config.color,
            size: config.size * 0.5,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Points(trailGeometry, trailMaterial);
    },

    /**
     * Update trail positions (call each frame)
     * @param {THREE.Points} trail - Trail particle system
     * @param {THREE.Vector3} position - Current projectile position
     */
    updateTrail(trail, position) {
        const positions = trail.geometry.attributes.position.array;

        // Shift positions back
        for (let i = positions.length - 3; i >= 3; i -= 3) {
            positions[i] = positions[i - 3];
            positions[i + 1] = positions[i - 2];
            positions[i + 2] = positions[i - 1];
        }

        // Set new position at front
        positions[0] = position.x;
        positions[1] = position.y;
        positions[2] = position.z;

        trail.geometry.attributes.position.needsUpdate = true;
    }
};
