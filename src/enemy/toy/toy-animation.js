// ============================================
// TOY ANIMATION - Stateless Animation
// ============================================

const ToyAnimation = {
    /**
     * Animate toy running (panicked sprint)
     * @param {THREE.Group} enemyMesh
     * @param {number} walkTimer
     * @param {number} walkSpeed
     * @returns {number} Updated walk timer
     */
    animateWalk(enemyMesh, walkTimer, walkSpeed) {
        if (!enemyMesh || !enemyMesh.userData) return walkTimer;

        const t = (walkTimer || 0) * 0.55;

        if (typeof DinosaurAnimation !== 'undefined') {
            DinosaurAnimation.animateWalk(enemyMesh, t, walkSpeed);
        }

        // Cache base transforms so we don't accumulate rotation each frame
        const base = enemyMesh.userData._toyBase || {
            bodyY: enemyMesh.userData.dinosaur?.position?.y || 0,
            bodyRotX: enemyMesh.userData.dinosaur?.rotation?.x || 0,
            bodyRotZ: enemyMesh.userData.dinosaur?.rotation?.z || 0,
            headRotZ: enemyMesh.userData.head?.rotation?.z || 0
        };
        enemyMesh.userData._toyBase = base;

        // Add frantic run vibe
        const dinosaur = enemyMesh.userData.dinosaur;
        if (dinosaur) {
            dinosaur.position.y = base.bodyY + Math.abs(Math.sin(t * 1.4)) * 0.06;
            dinosaur.rotation.x = base.bodyRotX + 0.05;
            dinosaur.rotation.z = base.bodyRotZ + Math.sin(t * 1.2) * 0.03;
        }

        const head = enemyMesh.userData.head;
        const jaw = head?.userData?.jaw;
        if (head) {
            head.rotation.z = base.headRotZ + Math.sin(t * 1.6) * 0.04;
        }
        if (jaw) {
            jaw.rotation.x = 0.32 + Math.sin(t * 1.8) * 0.07;
        }

        // Keep the toy grounded (avoid floating group)
        enemyMesh.position.y = 0;

        return walkTimer;
    }
};
