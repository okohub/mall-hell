// ============================================
// SKELETON ANIMATION - Pure Animation Logic
// ============================================
// Stateless animation functions for skeleton enemy
// Receives all data as parameters

const SkeletonAnimation = {
    /**
     * Animate skeleton eyes to track player
     * Skull is rotated 180° to face player, so eyes are on the +Z side (from skeleton's perspective)
     * but in local skull coordinates they're still at -Z
     * @param {THREE.Group} enemyMesh - Enemy mesh with userData references
     * @param {THREE.Vector3} targetPos - Target position to track
     */
    animateEyes(enemyMesh, targetPos) {
        if (!enemyMesh || !enemyMesh.userData.leftEye) return;

        const leftEye = enemyMesh.userData.leftEye;
        const rightEye = enemyMesh.userData.rightEye;

        // Calculate look direction from enemy to target
        const dx = targetPos.x - enemyMesh.position.x;
        const dz = targetPos.z - enemyMesh.position.z;

        // Since skull is rotated 180°, X movement is inverted, Z tracks normally
        const lookX = Math.max(-0.025, Math.min(0.025, -dx * 0.012));
        const lookZ = Math.max(-0.015, Math.min(0.015, dz * 0.008));

        // Move eyes within sockets (base positions from _createSkull, in local skull coords)
        leftEye.position.x = -0.1 + lookX;
        leftEye.position.z = -0.32 + lookZ;
        rightEye.position.x = 0.1 + lookX;
        rightEye.position.z = -0.32 + lookZ;
    },

    /**
     * Animate skeleton walking - pushing cart with menacing effort
     * @param {THREE.Group} enemyMesh - Enemy mesh with userData references
     * @param {number} walkTimer - Current walk animation timer
     * @param {number} walkSpeed - Walk speed multiplier
     * @returns {number} Updated walk timer
     */
    animateWalk(enemyMesh, walkTimer, walkSpeed = 3.5) {
        if (!enemyMesh || !enemyMesh.userData) return walkTimer;

        const skeleton = enemyMesh.userData.skeleton;
        const leftLeg = enemyMesh.userData.leftLeg;
        const rightLeg = enemyMesh.userData.rightLeg;
        const leftArm = enemyMesh.userData.leftArm;
        const rightArm = enemyMesh.userData.rightArm;
        const skull = enemyMesh.userData.skull;
        const torso = enemyMesh.userData.torso;

        // Walking cycle
        const legSwing = Math.sin(walkTimer) * 0.3;
        const armPush = Math.sin(walkTimer * 0.8) * 0.06;
        const bodyBob = Math.abs(Math.sin(walkTimer * 2)) * 0.03;
        const bodySway = Math.sin(walkTimer) * 0.02;
        const pushLean = -0.1; // Lean forward (negative X rotation since facing -Z)

        // Animate legs (opposite phase walking motion)
        if (leftLeg) leftLeg.rotation.x = -legSwing;
        if (rightLeg) rightLeg.rotation.x = legSwing;

        // Animate arms (subtle pushing motion on handle)
        if (leftArm) {
            leftArm.rotation.x = -armPush * 0.25;
            leftArm.position.z = -armPush * 0.04;
        }
        if (rightArm) {
            rightArm.rotation.x = armPush * 0.25;
            rightArm.position.z = armPush * 0.04;
        }

        // Body movement - bob and sway while pushing
        if (skeleton) {
            skeleton.position.y = bodyBob;
            skeleton.rotation.x = pushLean;
            skeleton.rotation.z = bodySway;
        }

        // Head movement - skull already rotated 180° to face player
        // Add subtle nodding/swaying for menacing effect
        if (skull) {
            skull.rotation.x = Math.sin(walkTimer * 0.7) * 0.05; // Subtle nod
            skull.rotation.z = -bodySway * 0.5; // Sway with body
        }

        return walkTimer;
    }
};
