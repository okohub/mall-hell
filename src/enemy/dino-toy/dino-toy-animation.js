// ============================================
// DINO TOY ANIMATION - Stateless Animation
// ============================================

const DinoToyAnimation = {
    /**
     * Animate toy walking (optional no-op or gentle bob)
     * @param {THREE.Group} enemyMesh
     * @param {number} walkTimer
     * @param {number} walkSpeed
     * @returns {number} Updated walk timer
     */
    animateWalk(enemyMesh, walkTimer, walkSpeed) {
        if (!enemyMesh) return walkTimer;
        const t = (walkTimer || 0) + walkSpeed * 0.02;
        enemyMesh.position.y = Math.sin(t) * 0.03;
        return t;
    }
};
