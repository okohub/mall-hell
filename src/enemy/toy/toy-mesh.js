// ============================================
// TOY MESH - Stateless Mesh Creation
// ============================================
// Delegates to DinosaurMesh.createToy

const ToyMesh = {
    /**
     * Create toy mesh
     * @param {THREE} THREE - Three.js library
     * @returns {THREE.Group}
     */
    createMesh(THREE, config) {
        if (typeof DinosaurMesh !== 'undefined' && DinosaurMesh.createToy) {
            return DinosaurMesh.createToy(THREE);
        }
        const fallback = new THREE.Group();
        return fallback;
    },

    /**
     * Apply hit flash (no-op for toy)
     * @param {THREE.Group} enemyMesh
     * @param {number} intensity
     */
    applyHitFlash(enemyMesh, intensity) {
        if (!enemyMesh) return;
        enemyMesh.traverse((child) => {
            if (child.material && child.material.emissive) {
                child.material.emissiveIntensity = Math.max(child.material.emissiveIntensity || 0, intensity * 0.4);
            }
        });
    }
};
