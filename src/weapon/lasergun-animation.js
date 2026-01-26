// ============================================
// LASERGUN ANIMATION - Pure Animation Logic
// ============================================
// Stateless animation functions
// Receives refs and state as parameters

const LaserGunAnimation = {
    /**
     * Animate FPS weapon based on state
     * @param {Object} refs - References from createFPSMesh
     * @param {Object} state - Weapon state (read-only)
     * @param {number} dt - Delta time
     * @param {Object} config - Weapon config for ammo max
     */
    animateFPS(refs, state, dt, config) {
        if (!refs) return;

        const { cell, emitter, glowRing, trigger, laserGun } = refs;

        // Animate energy cell based on ammo
        if (cell) {
            const ammoPercent = state.ammo / config.ammo.max;
            cell.scale.y = Math.max(0.2, ammoPercent);
            cell.material.emissiveIntensity = 0.2 + ammoPercent * 0.4;
        }

        // Pulse emitter glow when firing or idle
        if (emitter) {
            const pulse = Math.sin(state.glowPulse) * 0.3 + 0.7;
            const intensity = state.isFiring ? 1.2 : pulse * 0.8;
            emitter.material.emissiveIntensity = intensity;
        }

        if (glowRing) {
            glowRing.rotation.z += dt * 3;
        }

        // Trigger animation
        if (trigger) {
            trigger.rotation.x = state.isFiring ? 0.5 : 0.3;
        }

        // Recoil
        if (laserGun && state.fireAnimProgress > 0) {
            laserGun.position.z = -0.35 + state.fireAnimProgress * 0.015;
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
