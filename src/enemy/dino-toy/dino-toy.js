// ============================================
// DINO TOY - Behavioral Module
// ============================================
// Collectible toy enemy (wander behavior)

var EnemyTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.EnemyTypeRegistry = globalThis.EnemyTypeRegistry || {})
    : {};

const DinoToy = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'dino_toy',
    name: 'Dino Toy',

    // ==========================================
    // CONFIGURATION (References central config)
    // ==========================================

    get config() {
        return Enemy.types.DINO_TOY;
    },

    // ==========================================
    // MESH CREATION (Delegates to DinoToyMesh)
    // ==========================================

    createMesh(THREE, config = this.config) {
        return DinoToyMesh.createMesh(THREE, config);
    },

    // ==========================================
    // ANIMATION (Delegates to DinoToyAnimation)
    // ==========================================

    animateWalk(enemyMesh, walkTimer) {
        const walkSpeed = this.config.walkSpeed || 1.8;
        return DinoToyAnimation.animateWalk(enemyMesh, walkTimer, walkSpeed);
    },

    applyHitFlash(enemyMesh, intensity) {
        DinoToyMesh.applyHitFlash(enemyMesh, intensity);
    }
};

EnemyTypeRegistry.DINO_TOY = DinoToy;
