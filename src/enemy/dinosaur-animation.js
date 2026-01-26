// ============================================
// DINOSAUR ANIMATION - Pure Animation Logic
// ============================================
// Stateless animation functions for dinosaur enemy
// Receives all data as parameters

const DinosaurAnimation = {
    /**
     * Animate dinosaur walking - heavy, menacing stomping
     * @param {THREE.Group} enemyMesh - Enemy mesh with userData references
     * @param {number} walkTimer - Current walk animation timer
     * @param {number} walkSpeed - Walk speed multiplier
     * @returns {number} Updated walk timer
     */
    animateWalk(enemyMesh, walkTimer, walkSpeed = 2.5) {
        if (!enemyMesh || !enemyMesh.userData) return walkTimer;

        const dinosaur = enemyMesh.userData.dinosaur;
        const leftLeg = enemyMesh.userData.leftLeg;
        const rightLeg = enemyMesh.userData.rightLeg;
        const leftArm = enemyMesh.userData.leftArm;
        const rightArm = enemyMesh.userData.rightArm;
        const head = enemyMesh.userData.head;
        const tail = enemyMesh.userData.tail;

        const t = walkTimer * 1.5; // Walk cycle speed

        // LEGS - Heavy stomping motion
        const legSwing = Math.sin(t) * 0.35;
        if (leftLeg) {
            leftLeg.rotation.x = legSwing;
            // Lift leg higher when stepping
            leftLeg.position.y = Math.max(0, Math.sin(t)) * 0.1;
        }
        if (rightLeg) {
            rightLeg.rotation.x = -legSwing;
            rightLeg.position.y = Math.max(0, -Math.sin(t)) * 0.1;
        }

        // ARMS - Tiny useless wobble
        const armWobble = Math.sin(t * 2) * 0.2;
        if (leftArm) {
            leftArm.rotation.z = armWobble;
            leftArm.rotation.x = Math.sin(t * 1.5) * 0.1;
        }
        if (rightArm) {
            rightArm.rotation.z = -armWobble;
            rightArm.rotation.x = -Math.sin(t * 1.5) * 0.1;
        }

        // BODY - Heavy bob and slight sway
        if (dinosaur) {
            // Bob with each step
            dinosaur.position.y = Math.abs(Math.sin(t * 2)) * 0.2;
            // Slight side-to-side sway
            dinosaur.rotation.z = Math.sin(t) * 0.025;
            // Slight forward lean when stepping
            dinosaur.rotation.x = Math.sin(t * 2) * 0.02;
        }

        // HEAD - Menacing movement and biting
        if (head) {
            // Look around slowly
            head.rotation.y = Math.sin(t * 0.5) * 0.15;
            // Bob with body
            head.rotation.z = Math.sin(t * 0.7) * 0.04;

            // JAW - Periodic snapping
            const jaw = head.userData?.jaw;
            if (jaw) {
                // Snap shut periodically
                const snapCycle = Math.sin(t * 1.2);
                const openAmount = 0.15 + Math.max(0, snapCycle) * 0.35;
                jaw.rotation.x = openAmount;
            }
        }

        // TAIL - Counterbalance swing
        if (tail) {
            // Swing opposite to body motion
            tail.rotation.y = Math.sin(t * 0.8 + Math.PI) * 0.3;
            // Slight up/down wave
            tail.rotation.x = Math.sin(t * 0.6) * 0.08;
        }

        return walkTimer;
    }
};
