// ============================================
// TOY - Behavioral Module
// ============================================
// Collectible toy enemy (flee behavior)

var EnemyTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.EnemyTypeRegistry = globalThis.EnemyTypeRegistry || {})
    : {};

const Toy = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'toy',
    name: 'Toy',

    // ==========================================
    // CONFIGURATION (References central config)
    // ==========================================

    get config() {
        return Enemy.types.TOY;
    },

    // ==========================================
    // MESH CREATION (Delegates to ToyMesh)
    // ==========================================

    createMesh(THREE, config = this.config) {
        return ToyMesh.createMesh(THREE, config);
    },

    // ==========================================
    // ANIMATION (Delegates to ToyAnimation)
    // ==========================================

    animateWalk(enemyMesh, walkTimer) {
        const walkSpeed = this.config.walkSpeed || 1.8;
        return ToyAnimation.animateWalk(enemyMesh, walkTimer, walkSpeed);
    },

    applyHitFlash(enemyMesh, intensity) {
        ToyMesh.applyHitFlash(enemyMesh, intensity);
    }
};

EnemyTypeRegistry.TOY = Toy;
