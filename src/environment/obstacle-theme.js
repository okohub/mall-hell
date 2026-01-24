// ============================================
// OBSTACLE THEME - Visual Configuration
// ============================================
// Colors, materials, and visual styling for obstacles
// Pure data - no THREE.js dependencies

const ObstacleTheme = {
    // Product stack
    stack: {
        boxColors: [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xe67e22],
        cardboard: 0xd4a574
    },

    // Barrel
    barrel: {
        body: 0x3498db,
        bands: 0x7f8c8d,
        top: 0x2980b9
    },

    // Promotional display
    display: {
        stand: 0xe74c3c,
        sign: 0xf1c40f,
        text: '#e74c3c',
        textBackground: 0xf1c40f
    },

    // Hit effect
    hit: {
        flash: 0xffffff,
        particles: 0xf39c12
    },

    // Get theme for obstacle type
    getTheme(obstacleType) {
        switch (obstacleType) {
            case 'stack':
                return this.stack;
            case 'barrel':
                return this.barrel;
            case 'display':
                return this.display;
            default:
                return this.stack;
        }
    }
};
