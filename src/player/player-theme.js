// ============================================
// PLAYER THEME - Visual Configuration
// ============================================
// Colors, materials, and visual styling for player
// Pure data - no THREE.js dependencies

const PlayerTheme = {
    // Cart materials
    cart: {
        chrome: 0xc0c0c0,
        darkChrome: 0x606060,
        redPlastic: 0xe74c3c,
        blackRubber: 0x1a1a1a
    },

    // Child character
    child: {
        skin: 0xffdbac,
        shirt: 0x3498db,
        pants: 0x2c3e50,
        hair: 0x4a3728,
        eyes: 0x2c3e50,
        eyebrows: 0x3d2817,
        mouth: 0xc0392b,
        shoes: 0x2ecc71
    },

    // Slingshot weapon
    slingshot: {
        wood: 0x8b4513,
        rubber: 0xc0392b
    },

    // Get all colors as flat object (for backward compatibility)
    getAllColors() {
        return {
            ...this.cart,
            ...this.child,
            ...this.slingshot
        };
    }
};
