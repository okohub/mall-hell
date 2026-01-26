// ============================================
// DINOSAUR - Behavioral Module
// ============================================
// Complete dinosaur enemy module: delegates to mesh and animation
// Provides interface for enemy orchestrator

const Dinosaur = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'dinosaur',
    name: 'Dino Boss',

    // ==========================================
    // CONFIGURATION (References central config)
    // ==========================================

    get config() {
        return Enemy.types.DINOSAUR;
    },

    // ==========================================
    // THEME (Colors and visual styling)
    // ==========================================

    theme: {
        bodyColor: 0x8B5A2B,        // Dark tan/brown body
        bellyColor: 0xD2B48C,       // Light tan underbelly
        stripeColor: 0x5D3A1A,      // Dark brown stripes/accents
        headColor: 0x6B4423,        // Slightly darker head
        mouthColor: 0x4A1515,       // Deep red mouth interior
        eyeColor: 0xFFCC00,         // Fierce yellow eyes
        pupilColor: 0xFF0000,       // Red slit pupils
        teethColor: 0xFFFFF0,       // Ivory teeth
        tongueColor: 0xCC3333       // Red tongue
    },

    // ==========================================
    // MESH CREATION (Delegates to DinosaurMesh)
    // ==========================================

    /**
     * Create dinosaur mesh
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group} Dinosaur mesh group
     */
    createMesh(THREE) {
        return DinosaurMesh.createMesh(THREE, this.config);
    },

    // ==========================================
    // ANIMATION (Delegates to DinosaurAnimation)
    // ==========================================

    /**
     * Animate dinosaur walking
     * @param {THREE.Group} enemyMesh - Enemy mesh
     * @param {number} walkTimer - Walk animation timer
     * @returns {number} Updated walk timer
     */
    animateWalk(enemyMesh, walkTimer) {
        const walkSpeed = this.config.walkSpeed || 2.5;
        return DinosaurAnimation.animateWalk(enemyMesh, walkTimer, walkSpeed);
    }
};
