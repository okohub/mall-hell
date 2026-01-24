// ============================================
// MATERIALS LIBRARY - Shared Material Definitions
// ============================================
// Centralized material definitions for consistent appearance.
// Must be initialized with THREE.js before use.

const Materials = {
    // Chrome for cart frames
    chrome: null,
    darkChrome: null,
    // Skin tones
    skin: null,
    skinDark: null,
    nail: null,
    // Environment
    wood: null,
    rubber: null,
    redPlastic: null,
    blackRubber: null,
    // Product colors for instanced rendering
    products: [],

    // Initialization state
    _initialized: false,

    /**
     * Initialize the material library
     * Must be called after THREE.js is loaded
     * @param {THREE} THREE - Three.js library
     */
    init(THREE) {
        if (this._initialized) return;

        // Chrome - Physical material for better reflections
        this.chrome = new THREE.MeshPhysicalMaterial({
            color: 0xc0c0c0,
            metalness: 1.0,
            roughness: 0.15,
            clearcoat: 0.3,
            clearcoatRoughness: 0.2,
            reflectivity: 0.9
        });

        this.darkChrome = new THREE.MeshPhysicalMaterial({
            color: 0x606060,
            metalness: 0.9,
            roughness: 0.25,
            clearcoat: 0.2
        });

        // Skin tones
        this.skin = new THREE.MeshStandardMaterial({
            color: 0xf5d0c5,
            roughness: 0.7,
            metalness: 0.0
        });

        this.skinDark = new THREE.MeshStandardMaterial({
            color: 0xe8c4b8,
            roughness: 0.8,
            metalness: 0.0
        });

        this.nail = new THREE.MeshStandardMaterial({
            color: 0xfce4dc,
            roughness: 0.3,
            metalness: 0.1
        });

        // Environment materials
        this.wood = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });

        this.rubber = new THREE.MeshStandardMaterial({
            color: 0xc0392b,
            roughness: 0.5,
            metalness: 0.1
        });

        this.redPlastic = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            metalness: 0.1,
            roughness: 0.6
        });

        this.blackRubber = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.9
        });

        // Product colors for instanced rendering
        this.products = [
            new THREE.MeshStandardMaterial({ color: 0xe74c3c }),
            new THREE.MeshStandardMaterial({ color: 0x3498db }),
            new THREE.MeshStandardMaterial({ color: 0x2ecc71 }),
            new THREE.MeshStandardMaterial({ color: 0xf1c40f }),
            new THREE.MeshStandardMaterial({ color: 0x9b59b6 }),
            new THREE.MeshStandardMaterial({ color: 0xe67e22 })
        ];

        this._initialized = true;
    },

    /**
     * Check if materials are initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this._initialized;
    },

    /**
     * Get a random product material
     * @returns {THREE.Material}
     */
    getRandomProduct() {
        return this.products[Math.floor(Math.random() * this.products.length)];
    },

    /**
     * Dispose all materials (cleanup)
     */
    dispose() {
        const materialProps = [
            'chrome', 'darkChrome', 'skin', 'skinDark', 'nail',
            'wood', 'rubber', 'redPlastic', 'blackRubber'
        ];

        materialProps.forEach(prop => {
            if (this[prop] && this[prop].dispose) {
                this[prop].dispose();
                this[prop] = null;
            }
        });

        this.products.forEach(mat => {
            if (mat && mat.dispose) mat.dispose();
        });
        this.products = [];

        this._initialized = false;
    }
};
