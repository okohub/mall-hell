// ============================================
// SHELF - Pure Data Definitions
// ============================================
// Self-contained, zero external dependencies
// Defines what shelves and products ARE

const Shelf = {
    // Shelf template definitions
    templates: {
        WALL_STANDARD: {
            id: 'wall_standard',
            type: 'wall',
            frameSize: { w: 4, h: 6, d: 0.8 },
            shelfCount: 3,
            productsPerShelf: 4
        },
        WALL_TALL: {
            id: 'wall_tall',
            type: 'wall',
            frameSize: { w: 4, h: 8, d: 1.2 },
            shelfCount: 4,
            productsPerShelf: 4
        },
        FLOOR_ISLAND: {
            id: 'floor_island',
            type: 'floor',
            baseSize: { w: 5, h: 0.4, d: 5 },
            shelfCount: 2,
            productsPerLevel: 9
        },
        END_CAP: {
            id: 'end_cap',
            type: 'wall',
            frameSize: { w: 3, h: 5, d: 0.6 },
            shelfCount: 3,
            productsPerShelf: 3
        }
    },

    // Product type definitions
    productTypes: {
        BOX: {
            id: 'box',
            geometry: 'box',
            baseSize: { w: 0.5, h: 0.8, d: 0.4 },
            heightVariation: 0.4
        },
        BOTTLE: {
            id: 'bottle',
            geometry: 'cylinder',
            baseSize: { r: 0.15, h: 0.9 },
            heightVariation: 0.4
        },
        TALL_BOX: {
            id: 'tall_box',
            geometry: 'box',
            baseSize: { w: 0.5, h: 1.0, d: 0.3 },
            heightVariation: 0.3
        },
        CAN: {
            id: 'can',
            geometry: 'cylinder',
            baseSize: { r: 0.12, h: 0.4 },
            heightVariation: 0.1
        }
    },

    // Helper to get shelf template
    getTemplate(templateId) {
        return this.templates[templateId] || this.templates.WALL_STANDARD;
    },

    // Helper to get product type
    getProductType(typeId) {
        return this.productTypes[typeId] || this.productTypes.BOX;
    },

    // Get all template IDs
    getTemplateIds() {
        return Object.keys(this.templates);
    },

    // Get all product type IDs
    getProductTypeIds() {
        return Object.keys(this.productTypes);
    },

    // Pick random product type based on weights
    pickProductType(types = null, weights = null) {
        const availableTypes = types || this.getProductTypeIds();
        const typeWeights = weights || availableTypes.map(() => 1 / availableTypes.length);

        let r = Math.random();
        for (let i = 0; i < availableTypes.length; i++) {
            r -= typeWeights[i];
            if (r <= 0) return availableTypes[i];
        }
        return availableTypes[0];
    },

    // Pick random color from theme
    pickColor(themeColors) {
        if (!themeColors || themeColors.length === 0) {
            return 0x888888;
        }
        return themeColors[Math.floor(Math.random() * themeColors.length)];
    }
};
