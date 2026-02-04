// ============================================
// SOFT BULLET PROJECTILE - Type Definition
// ============================================

var ProjectileTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.ProjectileTypeRegistry = globalThis.ProjectileTypeRegistry || {})
    : {};

ProjectileTypeRegistry['soft-bullet'] = {
    id: 'soft-bullet',
    geometry: 'cylinder',
    size: 0.18,
    length: 0.5,
    color: 0xe67e22,
    glow: true,
    glowColor: 0xf39c12,
    emissiveIntensity: { min: 0.2, max: 0.4 },
    gravity: 1,
    lifetime: 4000,
    piercing: false,
    spin: true,
    createMesh: (THREE, context) => SoftBulletProjectileMesh.createMesh(THREE, context),
    animate: (mesh, dt) => SoftBulletProjectileAnimation.animate(mesh, dt)
};
