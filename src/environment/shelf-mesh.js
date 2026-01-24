// ============================================
// SHELF VISUAL - Mesh Creation
// ============================================
// Self-contained, zero external dependencies
// Creates shelf and product meshes - receives THREE as parameter

const ShelfVisual = {
    // Default colors
    colors: {
        frame: 0x8B4513,
        metal: 0x888888,
        shelfSurface: 0xcccccc
    },

    /**
     * Create wall shelf unit
     * @param {THREE} THREE - Three.js library
     * @param {Object} template - Shelf template config
     * @param {Array} productColors - Theme colors for products
     * @returns {THREE.Group} Shelf mesh group
     */
    createWallShelf(THREE, template, productColors) {
        const group = new THREE.Group();
        const size = template.frameSize;

        const frameMat = new THREE.MeshStandardMaterial({
            color: this.colors.frame,
            roughness: 0.8,
            metalness: 0.1
        });

        const shelfMat = new THREE.MeshStandardMaterial({
            color: this.colors.shelfSurface,
            roughness: 0.6,
            metalness: 0.2
        });

        // Back panel
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(size.w, size.h, 0.1),
            frameMat
        );
        back.position.set(0, size.h / 2, -size.d / 2);
        group.add(back);

        // Side panels
        const leftSide = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, size.h, size.d),
            frameMat
        );
        leftSide.position.set(-size.w / 2, size.h / 2, 0);
        group.add(leftSide);

        const rightSide = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, size.h, size.d),
            frameMat
        );
        rightSide.position.set(size.w / 2, size.h / 2, 0);
        group.add(rightSide);

        // Shelves with products
        const shelfSpacing = size.h / (template.shelfCount + 1);

        for (let i = 0; i < template.shelfCount; i++) {
            const shelfY = shelfSpacing * (i + 1);

            // Shelf surface
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(size.w - 0.1, 0.05, size.d),
                shelfMat
            );
            shelf.position.set(0, shelfY, 0);
            group.add(shelf);

            // Add products
            this.addProductsToShelf(THREE, group, shelf, template.productsPerShelf, productColors, shelfY);
        }

        return group;
    },

    /**
     * Create floor display (island)
     * @param {THREE} THREE - Three.js library
     * @param {Object} template - Shelf template config
     * @param {Array} productColors - Theme colors for products
     * @returns {THREE.Group} Display mesh group
     */
    createFloorDisplay(THREE, template, productColors) {
        const group = new THREE.Group();
        const size = template.baseSize;

        const baseMat = new THREE.MeshStandardMaterial({
            color: this.colors.frame,
            roughness: 0.7,
            metalness: 0.2
        });

        // Base platform
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(size.w, size.h, size.d),
            baseMat
        );
        base.position.y = size.h / 2;
        group.add(base);

        // Add products on top
        const productsPerSide = Math.ceil(Math.sqrt(template.productsPerLevel));
        const spacing = size.w / (productsPerSide + 1);

        for (let x = 0; x < productsPerSide; x++) {
            for (let z = 0; z < productsPerSide; z++) {
                const product = this.createProduct(THREE, 'BOX', productColors);
                product.position.set(
                    -size.w / 2 + spacing * (x + 1),
                    size.h + 0.4,
                    -size.d / 2 + spacing * (z + 1)
                );
                group.add(product);
            }
        }

        return group;
    },

    /**
     * Add products to a shelf surface
     * @param {THREE} THREE - Three.js library
     * @param {THREE.Group} group - Parent group
     * @param {THREE.Mesh} shelf - Shelf surface mesh
     * @param {number} count - Number of products
     * @param {Array} colors - Product colors
     * @param {number} shelfY - Y position of shelf
     */
    addProductsToShelf(THREE, group, shelf, count, colors, shelfY) {
        const shelfWidth = shelf.geometry.parameters.width;
        const spacing = shelfWidth / (count + 1);

        for (let i = 0; i < count; i++) {
            const typeId = Shelf ? Shelf.pickProductType() : 'BOX';
            const product = this.createProduct(THREE, typeId, colors);

            product.position.set(
                -shelfWidth / 2 + spacing * (i + 1),
                shelfY + 0.4,
                0
            );
            group.add(product);
        }
    },

    /**
     * Create a product mesh
     * @param {THREE} THREE - Three.js library
     * @param {string} typeId - Product type ID
     * @param {Array} colors - Available colors
     * @returns {THREE.Mesh} Product mesh
     */
    createProduct(THREE, typeId, colors) {
        const type = Shelf ? Shelf.getProductType(typeId) : {
            geometry: 'box',
            baseSize: { w: 0.5, h: 0.8, d: 0.4 },
            heightVariation: 0.4
        };

        const color = colors && colors.length > 0
            ? colors[Math.floor(Math.random() * colors.length)]
            : 0x888888;

        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1
        });

        let geometry;
        const heightVar = 1 - type.heightVariation / 2 + Math.random() * type.heightVariation;

        switch (type.geometry) {
            case 'cylinder':
                const r = type.baseSize.r || 0.15;
                const h = (type.baseSize.h || 0.9) * heightVar;
                geometry = new THREE.CylinderGeometry(r, r, h, 12);
                break;
            case 'box':
            default:
                const w = type.baseSize.w || 0.5;
                const bh = (type.baseSize.h || 0.8) * heightVar;
                const d = type.baseSize.d || 0.4;
                geometry = new THREE.BoxGeometry(w, bh, d);
                break;
        }

        return new THREE.Mesh(geometry, mat);
    },

    /**
     * Create shelf based on template type
     * @param {THREE} THREE - Three.js library
     * @param {Object} template - Shelf template
     * @param {Array} productColors - Theme colors
     * @returns {THREE.Group} Shelf mesh group
     */
    createShelf(THREE, template, productColors) {
        switch (template.type) {
            case 'floor':
                return this.createFloorDisplay(THREE, template, productColors);
            case 'wall':
            default:
                return this.createWallShelf(THREE, template, productColors);
        }
    }
};
