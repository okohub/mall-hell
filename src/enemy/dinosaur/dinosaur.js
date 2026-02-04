// ============================================
// DINOSAUR - Behavioral Module
// ============================================
// Complete dinosaur enemy module: delegates to mesh and animation
// Provides interface for enemy orchestrator

var EnemyTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.EnemyTypeRegistry = globalThis.EnemyTypeRegistry || {})
    : {};

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
    createMesh(THREE, config = this.config) {
        return DinosaurMesh.createEnemy(THREE, config);
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
    },

    /**
     * Apply hit flash effect
     * @param {THREE.Group} enemyMesh - Enemy mesh
     * @param {number} intensity - Flash intensity
     */
    applyHitFlash(enemyMesh, intensity) {
        if (typeof DinosaurMesh !== 'undefined' && DinosaurMesh.applyHitFlash) {
            DinosaurMesh.applyHitFlash(enemyMesh, intensity);
            return;
        }

        if (!enemyMesh) return;
        enemyMesh.traverse((child) => {
            if (child.material && child.material.emissive) {
                child.material.emissiveIntensity = intensity;
            }
        });
    },

    /**
     * Update dinosaur health bar
     * @param {THREE.Group} healthBar - Health bar mesh
     * @param {number} percent - Health percent 0-1
     */
    updateHealthBar(healthBar, percent) {
        if (typeof DinosaurMesh !== 'undefined' && DinosaurMesh.updateHealthBar) {
            DinosaurMesh.updateHealthBar(healthBar, percent);
        }
    }
};

EnemyTypeRegistry.DINOSAUR = Dinosaur;
