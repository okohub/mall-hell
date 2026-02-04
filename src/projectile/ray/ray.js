// ============================================
// RAY PROJECTILE - Type Definition
// ============================================

var ProjectileTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.ProjectileTypeRegistry = globalThis.ProjectileTypeRegistry || {})
    : {};

ProjectileTypeRegistry['ray'] = {
    id: 'ray',
    geometry: 'cylinder',
    size: 0.12,
    length: 0.6,
    color: 0xe74c3c,
    glow: true,
    glowColor: 0xff6b6b,
    emissiveIntensity: { min: 0.8, max: 1.2 },
    gravity: 0,
    lifetime: 2000,
    piercing: false,
    trail: true,
    trailColor: 0xff6b6b,
    createMesh: (THREE, context) => RayProjectileMesh.createMesh(THREE, context),
    animate: (mesh, dt) => RayProjectileAnimation.animate(mesh, dt)
};
