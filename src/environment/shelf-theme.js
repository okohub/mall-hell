// ============================================
// SHELF THEME - Visual Configuration
// ============================================
// Colors, materials, and visual styling for shelves
// Pure data - no THREE.js dependencies

const ShelfTheme = {
    // Shelf frame
    frame: {
        metal: 0x888888,
        metalDark: 0x666666,
        wood: 0x8B4513
    },

    // Default product colors (overridden by room theme)
    defaultProducts: [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6],

    // Price tag
    priceTag: {
        background: 0xffff00,
        text: '#000000',
        sale: 0xff0000
    },

    // Refrigerator (for cold sections)
    refrigerator: {
        frame: 0xE8E8E8,
        glass: 0xadd8e6,
        glassOpacity: 0.3,
        light: 0xffffff
    },

    // Get shelf style
    getStyle(shelfType) {
        switch (shelfType) {
            case 'refrigerator':
                return this.refrigerator;
            case 'standard':
            default:
                return this.frame;
        }
    }
};
