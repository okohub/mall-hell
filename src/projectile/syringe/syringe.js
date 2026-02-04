// ============================================
// SYRINGE PROJECTILE - Type Definition
// ============================================

var ProjectileTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.ProjectileTypeRegistry = globalThis.ProjectileTypeRegistry || {})
    : {};

ProjectileTypeRegistry['syringe'] = {
    id: 'syringe',
    geometry: 'cylinder',
    size: 0.16,
    length: 0.9,
    color: 0xf2f6ff,
    glow: true,
    glowColor: 0xff7b6a,
    emissiveIntensity: { min: 0.5, max: 1.1 },
    gravity: 0,
    lifetime: 1600,
    piercing: false,
    transformToToy: true,
    createMesh: (THREE, context) => SyringeProjectileMesh.createMesh(THREE, context),
    animate: (mesh, dt) => SyringeProjectileAnimation.animate(mesh, dt)
};
