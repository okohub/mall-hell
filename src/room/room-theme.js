// ============================================
// ROOM THEME - Visual Configuration
// ============================================
// Mall department themes - colors, products, styling
// Pure data - no THREE.js dependencies

const RoomTheme = {
    // All available mall themes
    themes: {
        PRODUCE: {
            name: 'PRODUCE',
            shelfColor: 0x8B4513,
            productColors: [0x228B22, 0xFF6347, 0xFFD700, 0x32CD32, 0xFF8C00, 0x9ACD32],
            floorColor: '#c9b896',
            floorLineColor: '#a89878',
            signText: 'FRESH PRODUCE',
            signColor: 0x228B22,
            ambientColor: 0xfff8e8
        },
        DAIRY: {
            name: 'DAIRY',
            shelfColor: 0xE8E8E8,
            productColors: [0xFFFFFF, 0x87CEEB, 0xADD8E6, 0xF0F8FF, 0xE0FFFF, 0xB0E0E6],
            floorColor: '#d0d8e0',
            floorLineColor: '#a0b0c0',
            signText: 'DAIRY',
            signColor: 0x4169E1,
            ambientColor: 0xe8f0ff
        },
        FROZEN: {
            name: 'FROZEN',
            shelfColor: 0xB0C4DE,
            productColors: [0xE0FFFF, 0xAFEEEE, 0x87CEEB, 0xB0E0E6, 0xADD8E6, 0xF0FFFF],
            floorColor: '#d8e8f0',
            floorLineColor: '#b8d0e0',
            signText: 'FROZEN FOODS',
            signColor: 0x4682B4,
            ambientColor: 0xe0f0ff
        },
        SNACKS: {
            name: 'SNACKS',
            shelfColor: 0xDC143C,
            productColors: [0xFF4500, 0xFFD700, 0xFF69B4, 0x9400D3, 0x00CED1, 0xFF1493],
            floorColor: '#d4c4a8',
            floorLineColor: '#b4a488',
            signText: 'SNACKS & CANDY',
            signColor: 0xFF4500,
            ambientColor: 0xfff5f0
        },
        BEVERAGES: {
            name: 'BEVERAGES',
            shelfColor: 0x2E8B57,
            productColors: [0x8B4513, 0xFFD700, 0x00CED1, 0x32CD32, 0xFF6347, 0x4169E1],
            floorColor: '#c8d8c8',
            floorLineColor: '#a8b8a8',
            signText: 'BEVERAGES',
            signColor: 0x2E8B57,
            ambientColor: 0xf0fff0
        },
        ELECTRONICS: {
            name: 'ELECTRONICS',
            shelfColor: 0x2F4F4F,
            productColors: [0x1C1C1C, 0x4169E1, 0x00CED1, 0x696969, 0x708090, 0x00BFFF],
            floorColor: '#4a4a5a',
            floorLineColor: '#3a3a4a',
            signText: 'ELECTRONICS',
            signColor: 0x00BFFF,
            ambientColor: 0xe0e8ff
        },
        GAMING: {
            name: 'GAMING',
            shelfColor: 0x4B0082,
            productColors: [0xFF00FF, 0x00FF00, 0x00FFFF, 0xFF0000, 0xFFFF00, 0x9400D3],
            floorColor: '#3a2a4a',
            floorLineColor: '#2a1a3a',
            signText: 'GAMING',
            signColor: 0x9400D3,
            ambientColor: 0xe8d8ff
        },
        TOYS: {
            name: 'TOYS',
            shelfColor: 0xFFD700,
            productColors: [0xFF0000, 0x00FF00, 0x0000FF, 0xFF69B4, 0xFFA500, 0x9400D3],
            floorColor: '#f8e8d8',
            floorLineColor: '#e8d8c8',
            signText: 'TOYS & GAMES',
            signColor: 0xFF4500,
            ambientColor: 0xfff8e8
        },
        SPORTS: {
            name: 'SPORTS',
            shelfColor: 0x4169E1,
            productColors: [0xFF4500, 0x228B22, 0x1C1C1C, 0xFFFFFF, 0xFFD700, 0x4169E1],
            floorColor: '#c8d0e0',
            floorLineColor: '#a8b0c0',
            signText: 'SPORTS',
            signColor: 0x4169E1,
            ambientColor: 0xe8f0ff
        },
        CLOTHING: {
            name: 'CLOTHING',
            shelfColor: 0xD2B48C,
            productColors: [0x000080, 0x800000, 0x008000, 0x808080, 0xFFFFFF, 0x1C1C1C],
            floorColor: '#e8e0d8',
            floorLineColor: '#d0c8c0',
            signText: 'CLOTHING',
            signColor: 0x8B4513,
            ambientColor: 0xfff8f0
        },
        PHARMACY: {
            name: 'PHARMACY',
            shelfColor: 0xFFFFFF,
            productColors: [0xFF0000, 0x00FF00, 0x4169E1, 0xFFFFFF, 0x228B22, 0xFF69B4],
            floorColor: '#f0f0f0',
            floorLineColor: '#d0d0d0',
            signText: 'PHARMACY',
            signColor: 0xFF0000,
            ambientColor: 0xffffff
        },
        BAKERY: {
            name: 'BAKERY',
            shelfColor: 0xD2691E,
            productColors: [0xF5DEB3, 0xDEB887, 0xD2691E, 0x8B4513, 0xFFE4C4, 0xFFA07A],
            floorColor: '#e8d8c8',
            floorLineColor: '#d0c0b0',
            signText: 'BAKERY',
            signColor: 0xD2691E,
            ambientColor: 0xfff0e0
        },
        APPLIANCES: {
            name: 'APPLIANCES',
            shelfColor: 0x708090,
            productColors: [0xC0C0C0, 0x1C1C1C, 0xFFFFFF, 0x4169E1, 0x708090, 0x2F4F4F],
            floorColor: '#d0d0d8',
            floorLineColor: '#b0b0b8',
            signText: 'APPLIANCES',
            signColor: 0x4682B4,
            ambientColor: 0xf0f0f8
        },
        JUNCTION: {
            name: 'JUNCTION',
            shelfColor: 0x808080,
            productColors: [],
            floorColor: '#d8d8d8',
            floorLineColor: '#b8b8b8',
            signText: '',
            signColor: 0x808080,
            ambientColor: 0xf8f8f8,
            noShelves: true
        },
        ENTRANCE: {
            name: 'ENTRANCE',
            shelfColor: 0x808080,
            productColors: [],
            floorColor: '#e0e0e0',
            floorLineColor: '#c0c0c0',
            signText: 'WELCOME TO MALL HELL',
            signColor: 0xE94560,
            ambientColor: 0xffffff,
            noShelves: true
        }
    },

    // Common room styling
    common: {
        wallColor: 0xf5f5f5,
        ceilingColor: 0xfafafa,
        lightColor: 0xffffff,
        lightIntensity: 1.0
    },

    /**
     * Get theme by ID
     * @param {string} themeId - Theme identifier
     * @returns {Object|null} Theme data or null
     */
    getTheme(themeId) {
        return this.themes[themeId] || null;
    },

    /**
     * Get all theme IDs
     * @returns {string[]} Array of theme IDs
     */
    getThemeIds() {
        return Object.keys(this.themes);
    },

    /**
     * Get themes that have shelves (not junction/entrance)
     * @returns {string[]} Array of theme IDs with shelves
     */
    getShelfThemes() {
        return Object.keys(this.themes).filter(id => !this.themes[id].noShelves);
    },

    /**
     * Get random product color from theme
     * @param {string} themeId - Theme identifier
     * @returns {number} Random product color
     */
    getRandomProductColor(themeId) {
        const theme = this.getTheme(themeId);
        if (!theme || !theme.productColors.length) return 0x808080;
        return theme.productColors[Math.floor(Math.random() * theme.productColors.length)];
    }
};
