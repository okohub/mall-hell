// ============================================
// PROJECTILE MESH FACTORY - Per Type
// ============================================
// Delegates mesh creation to per-projectile files

const ProjectileMeshFactory = {
    /**
     * Create projectile group based on type
     * @param {THREE} THREE - Three.js library
     * @param {Object} config - Projectile config
     * @param {Object} options - Creation options
     * @returns {THREE.Group}
     */
    createGroup(THREE, config, options = {}) {
        const {
            projectileType = 'stone',
            speed = 100,
            speedMin = 60,
            speedMax = 180,
            sizeScaleBase = 0.8,
            sizeScalePower = 0.4,
            glowOpacityBase = 0.2,
            glowOpacityPower = 0.3
        } = options;

        const baseSize = config.size || 0.2;
        const baseColor = config.color || 0xf39c12;
        const glowColor = config.glowColor || baseColor;
        const hasGlow = config.glow !== false;
        const emissiveMin = config.emissiveIntensity?.min || 0.2;
        const emissiveMax = config.emissiveIntensity?.max || 0.6;

        const sizeScale = sizeScaleBase + (speed / speedMax) * sizeScalePower;
        const emissiveIntensity = emissiveMin + (speed / speedMax) * (emissiveMax - emissiveMin);
        const glowOpacity = glowOpacityBase + (speed / speedMax) * glowOpacityPower;

        const context = {
            projectileType,
            baseSize,
            baseColor,
            glowColor,
            hasGlow,
            sizeScale,
            emissiveIntensity,
            glowOpacity
        };

        if (projectileType === 'dinonizer' && typeof DinonizerProjectileMesh !== 'undefined') {
            return DinonizerProjectileMesh.createGroup(THREE, config, context);
        }

        if (projectileType === 'laser' && typeof LaserProjectileMesh !== 'undefined') {
            return LaserProjectileMesh.createGroup(THREE, config, context);
        }

        if (projectileType === 'dart' && typeof DartProjectileMesh !== 'undefined') {
            return DartProjectileMesh.createGroup(THREE, config, context);
        }

        if (typeof StoneProjectileMesh !== 'undefined') {
            return StoneProjectileMesh.createGroup(THREE, config, context);
        }

        // Fallback: simple sphere
        const fallbackGroup = new THREE.Group();
        const geo = new THREE.SphereGeometry(baseSize * sizeScale, 12, 12);
        const mat = new THREE.MeshStandardMaterial({ color: baseColor });
        fallbackGroup.add(new THREE.Mesh(geo, mat));
        return fallbackGroup;
    }
};
