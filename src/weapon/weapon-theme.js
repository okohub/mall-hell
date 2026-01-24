// ============================================
// WEAPON THEME - Visual Configuration
// ============================================
// Colors, materials, and visual styling for weapons
// Pure data - no THREE.js dependencies

const WeaponTheme = {
    // Slingshot colors
    slingshot: {
        wood: 0x8B4513,
        woodDark: 0x5D3A1A,
        leather: 0x4a3728,
        leatherDark: 0x3d2d22,
        band: 0x654321,
        metal: 0x888888,
        stone: 0x888888
    },

    // Hand/skin colors for FPS view
    hands: {
        skin: 0xe8beac
    },

    // Get colors for specific weapon type
    getColors(weaponType) {
        switch (weaponType) {
            case 'slingshot':
            default:
                return this.slingshot;
        }
    }
};
