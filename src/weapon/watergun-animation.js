// ============================================
// WATERGUN ANIMATION - Pure Animation Logic
// ============================================
// Stateless animation functions
// Receives refs and state as parameters

const WaterGunAnimation = {
    /**
     * Animate FPS weapon based on state
     * @param {Object} refs - References from createFPSMesh
     * @param {Object} state - Weapon state (read-only)
     * @param {number} dt - Delta time
     * @param {Object} config - Weapon config for ammo max
     */
    animateFPS(refs, state, dt, config) {
        if (!refs) return;

        const { water, pump, trigger, leftHand, waterGun } = refs;

        // Animate water level based on ammo
        if (water) {
            const ammoPercent = state.ammo / config.ammo.max;
            water.scale.y = Math.max(0.1, ammoPercent);
            water.position.y = 0.14 - (1 - ammoPercent) * 0.06;
        }

        // Pump animation (pull back on fire)
        if (pump && state.pumpAnim > 0) {
            const pumpOffset = state.pumpAnim * 0.08;
            pump.position.z = -0.2 + pumpOffset;
        }

        // Left hand follows pump
        if (leftHand && state.pumpAnim > 0) {
            const handOffset = state.pumpAnim * 0.08;
            leftHand.position.z = -0.48 + handOffset;
        }

        // Trigger press on fire
        if (trigger) {
            if (state.fireAnimProgress > 0.5) {
                trigger.rotation.x = 0.5;
            } else {
                trigger.rotation.x = 0.3;
            }
        }

        // Slight recoil
        if (waterGun && state.pumpAnim > 0) {
            waterGun.rotation.x = 0.08 + state.pumpAnim * 0.05;
        } else if (waterGun) {
            waterGun.rotation.x = 0.08;
        }
    },

    /**
     * Update FPS weapon transform (lean/sway)
     * @param {Object} weapon - Weapon mesh
     * @param {number} turnRate - Turn rate for lean
     */
    updateTransform(weapon, turnRate) {
        if (!weapon) return;

        const weaponLeanAngle = -turnRate * 0.12;
        const weaponSway = turnRate * 0.025;

        weapon.rotation.z = weapon.rotation.z * 0.85 + weaponLeanAngle * 0.15;
        weapon.position.x = 0.12 + weapon.position.x * 0.9 + weaponSway * 0.1;
        weapon.position.x = Math.max(0.08, Math.min(0.18, weapon.position.x));
    }
};
