// ============================================
// PROJECTILE THEME - Visual Configuration
// ============================================
// Colors, materials, and visual styling for projectiles
// Pure data - no THREE.js dependencies

const ProjectileTheme = {
    // Stone projectile
    stone: {
        color: 0xf39c12,
        emissive: 0xf39c12,
        emissiveIntensity: 0.3,
        glow: true,
        glowColor: 0xf39c12,
        glowOpacity: 0.4
    },

    // Trail effect
    trail: {
        color: 0xf39c12,
        opacity: 0.6
    },

    // Get theme for projectile type
    getTheme(projectileType) {
        switch (projectileType) {
            case 'stone':
            default:
                return this.stone;
        }
    }
};
