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

        const t = (walkTimer || 0) * 0.8;

        const body = enemyMesh.userData.body || enemyMesh;
        const head = enemyMesh.userData.head;
        const jaw = enemyMesh.userData.jaw || head?.userData?.jaw;
        const leftLeg = enemyMesh.userData.leftLeg;
        const rightLeg = enemyMesh.userData.rightLeg;
        const leftArm = enemyMesh.userData.leftArm;
        const rightArm = enemyMesh.userData.rightArm;
        const tail = enemyMesh.userData.tail;

        // Cache base transforms so we don't accumulate rotation each frame
        const base = enemyMesh.userData._toyBase || {
            bodyY: body.position?.y || 0,
            bodyRotX: body.rotation?.x || 0,
            bodyRotZ: body.rotation?.z || 0,
            headRotX: head?.rotation?.x || 0,
            headRotZ: head?.rotation?.z || 0,
            tailRotY: tail?.rotation?.y || 0,
            leftLegRotX: leftLeg?.rotation?.x || 0,
            rightLegRotX: rightLeg?.rotation?.x || 0,
            leftArmRotX: leftArm?.rotation?.x || 0,
            rightArmRotX: rightArm?.rotation?.x || 0,
            jawRotX: jaw?.rotation?.x || 0
        };
        enemyMesh.userData._toyBase = base;

        // Cute sprint vibe (small bob + lively limbs)
        if (body) {
            body.position.y = base.bodyY + Math.abs(Math.sin(t * 1.6)) * 0.04;
            body.rotation.x = base.bodyRotX + 0.03;
            body.rotation.z = base.bodyRotZ + Math.sin(t * 1.2) * 0.03;
        }

        const legSwing = Math.sin(t * 2.2) * 0.65;
        if (leftLeg) leftLeg.rotation.x = base.leftLegRotX + legSwing;
        if (rightLeg) rightLeg.rotation.x = base.rightLegRotX - legSwing;

        const armSwing = Math.sin(t * 2.2 + Math.PI) * 0.35;
        if (leftArm) leftArm.rotation.x = base.leftArmRotX + armSwing;
        if (rightArm) rightArm.rotation.x = base.rightArmRotX - armSwing;

        if (tail) {
            tail.rotation.y = base.tailRotY + Math.sin(t * 1.4) * 0.25;
        }

        if (head) {
            head.rotation.x = base.headRotX + Math.sin(t * 1.1) * 0.08;
            head.rotation.z = base.headRotZ + Math.sin(t * 1.6) * 0.04;
        }
        if (jaw) {
            jaw.rotation.x = base.jawRotX + 0.35 + Math.sin(t * 1.8) * 0.08;
        }

        // Keep the toy grounded (avoid floating group)
        enemyMesh.position.y = 0;

        return walkTimer;
    }
};
