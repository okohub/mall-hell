// ============================================
// SKELETON - Behavioral Module
// ============================================
// Complete skeleton enemy module: delegates to mesh and animation
// Provides interface for enemy orchestrator

const Skeleton = {
    // ==========================================
    // IDENTITY
    // ==========================================

    id: 'skeleton',
    name: 'Skeleton Driver',

    // ==========================================
    // CONFIGURATION (References central config)
    // ==========================================

    get config() {
        return Enemy.types.SKELETON;
    },

    // ==========================================
    // THEME (Colors and visual styling)
    // ==========================================

    theme: {
        boneColor: 0xf5f5dc,      // Bone white
        eyeColor: 0xff0000,       // Blood red eyes
        smileColor: 0x8b0000,     // Dark red smile
        cartColor: 0x1a1a1a,      // Dark cart
        hornColor: 0x8b0000       // Devil horns
    },

    // ==========================================
    // MESH CREATION (Delegates to SkeletonMesh)
    // ==========================================

    /**
     * Create skeleton mesh
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group} Skeleton mesh group
     */
    createMesh(THREE) {
        return SkeletonMesh.createMesh(THREE, this.config);
    },

    // ==========================================
    // ANIMATION (Delegates to SkeletonAnimation)
    // ==========================================

    /**
     * Animate skeleton eyes to track target
     * @param {THREE.Group} enemyMesh - Enemy mesh
     * @param {THREE.Vector3} targetPos - Target position
     */
    animateEyes(enemyMesh, targetPos) {
        SkeletonAnimation.animateEyes(enemyMesh, targetPos);
    },

    /**
     * Animate skeleton walking
     * @param {THREE.Group} enemyMesh - Enemy mesh
     * @param {number} walkTimer - Walk animation timer
     * @returns {number} Updated walk timer
     */
    animateWalk(enemyMesh, walkTimer) {
        const walkSpeed = this.config.walkSpeed || 3.5;
        return SkeletonAnimation.animateWalk(enemyMesh, walkTimer, walkSpeed);
    }
};
