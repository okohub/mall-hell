// ============================================
// SLINGSHOT ANIMATION - Pure Animation Logic
// ============================================
// Stateless animation functions
// Receives refs and state as parameters

const SlingshotAnimation = {
    /**
     * Animate FPS weapon based on state
     * @param {Object} refs - References from createFPSMesh
     * @param {Object} state - Weapon state (read-only)
     * @param {number} dt - Delta time
     */
    animateFPS(refs, state, dt) {
        const { pouch, stone, bandL, bandR, hands } = refs;
        const isCharging = state.isCharging;
        const tension = state.chargeAmount;

        if (isCharging) {
            // CHARGING: Left hand pulls back based on tension
            const pullBack = tension;
            const pullZ = pullBack * 0.2;
            const pullY = pullBack * 0.03;

            if (pouch) {
                pouch.position.z = 0.08 + pullZ;
                pouch.position.y = 0.02 + pullY;
            }
            if (stone) {
                stone.position.z = 0.08 + pullZ;
                stone.position.y = 0.025 + pullY;
                stone.visible = true;
            }

            // Rubber bands stretch
            const bandStretch = 1 + pullBack * 1.8;
            const bandThin = 1 - pullBack * 0.3;
            const bandAngle = pullBack * 0.6;

            if (bandL) {
                bandL.scale.set(bandThin, bandStretch, bandThin);
                bandL.position.z = 0.04 + pullZ * 0.5;
                bandL.rotation.x = 0.3 + bandAngle;
                bandL.rotation.z = 0.1 - pullBack * 0.05;
            }
            if (bandR) {
                bandR.scale.set(bandThin, bandStretch, bandThin);
                bandR.position.z = 0.04 + pullZ * 0.5;
                bandR.rotation.x = 0.3 + bandAngle;
                bandR.rotation.z = -0.1 + pullBack * 0.05;
            }

            // Left hand follows
            if (hands && hands.userData.leftHand) {
                const leftHand = hands.userData.leftHand;
                leftHand.position.z = -0.15 + pullZ;
                leftHand.position.y = -0.08 + pullY;
                if (leftHand.userData.fingers) {
                    leftHand.userData.fingers[0].rotation.x = 0.8 + pullBack * 0.3;
                }
                if (leftHand.userData.thumb) {
                    leftHand.userData.thumb.rotation.x = 0.4 + pullBack * 0.2;
                }
            }
        } else if (state.fireAnimProgress > 0) {
            // FIRING: Quick release animation
            const snapProgress = 1 - state.fireAnimProgress;
            const snapZ = (1 - snapProgress) * 0.08;
            const snapY = (1 - snapProgress) * 0.02;

            if (pouch) {
                pouch.position.z = 0.08 + snapZ;
                pouch.position.y = 0.02 + snapY;
            }
            if (stone) {
                stone.position.z = 0.08 + snapZ;
                stone.position.y = 0.025 + snapY;
                stone.visible = state.fireAnimProgress > 0.7;
            }

            const bandSnap = 1 + (1 - snapProgress) * 0.4;
            const overshoot = snapProgress > 0.8 ? Math.sin((snapProgress - 0.8) * Math.PI * 5) * 0.1 : 0;

            if (bandL) {
                bandL.scale.set(1, bandSnap + overshoot, 1);
                bandL.position.z = 0.04 + snapZ * 0.3;
                bandL.rotation.x = 0.3 + (1 - snapProgress) * 0.3;
            }
            if (bandR) {
                bandR.scale.set(1, bandSnap + overshoot, 1);
                bandR.position.z = 0.04 + snapZ * 0.3;
                bandR.rotation.x = 0.3 + (1 - snapProgress) * 0.3;
            }

            if (hands && hands.userData.leftHand) {
                const leftHand = hands.userData.leftHand;
                leftHand.position.z = -0.15 + snapZ;
                leftHand.position.y = -0.08 + snapY;
                if (leftHand.userData.fingers) {
                    leftHand.userData.fingers[0].rotation.x = 0.8 + (1 - snapProgress) * 0.3;
                }
            }
        } else {
            // READY: Reset position
            if (pouch) {
                pouch.position.set(0, 0.02, 0.08);
            }
            if (stone) {
                stone.position.set(0, 0.025, 0.08);
                stone.visible = true;
            }
            if (bandL) {
                bandL.scale.set(1, 1, 1);
                bandL.position.z = 0.04;
                bandL.rotation.set(0.3, 0, 0.1);
            }
            if (bandR) {
                bandR.scale.set(1, 1, 1);
                bandR.position.z = 0.04;
                bandR.rotation.set(0.3, 0, -0.1);
            }
            if (hands && hands.userData.leftHand) {
                const leftHand = hands.userData.leftHand;
                leftHand.position.set(-0.05, -0.08, -0.15);
                if (leftHand.userData.fingers) {
                    leftHand.userData.fingers[0].rotation.x = 0.8;
                }
                if (leftHand.userData.thumb) {
                    leftHand.userData.thumb.rotation.x = 0.4;
                }
            }
        }
    },

    /**
     * Update FPS weapon transform (lean/sway)
     * @param {Object} weapon - Weapon mesh
     * @param {number} turnRate - Turn rate for lean
     */
    updateTransform(weapon, turnRate) {
        if (!weapon) return;

        const weaponLeanAngle = -turnRate * 0.15;
        const weaponSway = turnRate * 0.03;

        weapon.rotation.z = weapon.rotation.z * 0.85 + weaponLeanAngle * 0.15;
        weapon.position.x = 0.15 + weapon.position.x * 0.9 + weaponSway * 0.1;
        weapon.position.x = Math.max(0.1, Math.min(0.2, weapon.position.x));
    }
};
