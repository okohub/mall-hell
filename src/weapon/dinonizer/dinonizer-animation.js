// ============================================
// DINONIZER ANIMATION - Pure Animation Logic
// ============================================
// Stateless animation functions

const DinonizerAnimation = {
    /**
     * Animate FPS weapon based on state
     * @param {Object} refs - References from createFPSMesh
     * @param {Object} state - Weapon state
     * @param {number} dt - Delta time
     * @param {Object} config - Weapon config
     */
    animateFPS(refs, state, dt, config) {
        if (!refs) return;

        const { core, glowRing, gun } = refs;

        if (core) {
            const ammoPercent = state.ammo / config.ammo.max;
            core.material.emissiveIntensity = 0.6 + ammoPercent * 0.8;
        }

        if (glowRing) {
            glowRing.rotation.z += dt * 2.5;
        }

        if (gun && state.fireAnimProgress > 0) {
            gun.position.z = -0.35 + state.fireAnimProgress * 0.02;
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
        const weaponSway = turnRate * 0.02;

        weapon.rotation.z = weapon.rotation.z * 0.85 + weaponLeanAngle * 0.15;
        weapon.position.x = 0.12 + weapon.position.x * 0.9 + weaponSway * 0.1;
        weapon.position.x = Math.max(0.08, Math.min(0.18, weapon.position.x));
    }
};
