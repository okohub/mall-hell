// ============================================
// SOFT BULLET PROJECTILE ANIMATION
// ============================================

const SoftBulletProjectileAnimation = {
    animate(mesh, dt) {
        if (!mesh) return;
        mesh.rotation.z += dt * 12;
    }
};
