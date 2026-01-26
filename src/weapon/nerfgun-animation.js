// ============================================
// NERFGUN ANIMATION - Pure Animation Logic
// ============================================
// Stateless animation functions
// Receives refs and state as parameters

const NerfGunAnimation = {
    /**
     * Animate FPS weapon based on state
     * @param {Object} refs - References from createFPSMesh
     * @param {Object} state - Weapon state (read-only)
     * @param {number} dt - Delta time
     */
    animateFPS(refs, state, dt) {
        if (!refs) return;

        const { slide, trigger, dart, nerfGun } = refs;

        // Animate dart visibility based on ammo
        if (dart) {
            dart.visible = state.ammo > 0;
        }

        // Animate slide recoil
        if (slide && state.slideAnim > 0) {
            slide.position.z = -0.05 + state.slideAnim * 0.08;
        } else if (slide) {
            slide.position.z = -0.05;
        }

        // Animate trigger
        if (trigger) {
            if (state.fireAnimProgress > 0.5) {
                trigger.rotation.x = 0.2 + 0.3;  // Pressed
            } else {
                trigger.rotation.x = 0.2;  // Released
            }
        }

        // Subtle recoil
        if (nerfGun && state.fireAnimProgress > 0) {
            const recoil = state.fireAnimProgress * 0.02;
            const kickUp = state.fireAnimProgress * 0.03;
            nerfGun.position.z = -0.32 + recoil;
            nerfGun.rotation.x = 0.08 - kickUp;
        } else if (nerfGun) {
            nerfGun.position.z = -0.32;
            nerfGun.rotation.x = 0.08;
        }
    },

    /**
     * Update FPS weapon transform (lean/sway)
     * @param {Object} weapon - Weapon mesh
     * @param {number} turnRate - Turn rate for lean
     */
    updateTransform(weapon, turnRate) {
        if (!weapon) return;

        const weaponLeanAngle = -turnRate * 0.1;
        const weaponSway = turnRate * 0.02;

        weapon.rotation.z = weapon.rotation.z * 0.85 + weaponLeanAngle * 0.15;
        weapon.position.x = 0.1 + weapon.position.x * 0.9 + weaponSway * 0.1;
        weapon.position.x = Math.max(0.06, Math.min(0.16, weapon.position.x));
    }
};
