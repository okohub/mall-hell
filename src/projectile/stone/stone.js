// ============================================
// STONE PROJECTILE - Type Definition
// ============================================

var ProjectileTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.ProjectileTypeRegistry = globalThis.ProjectileTypeRegistry || {})
    : {};

ProjectileTypeRegistry['stone'] = {
    id: 'stone',
    geometry: 'sphere',
    size: 0.2,
    color: 0xf39c12,
    glow: true,
    glowColor: 0xf39c12,
    emissiveIntensity: { min: 0.2, max: 0.6 },
    gravity: 0,
    lifetime: 5000,
    piercing: false,
    createMesh: (THREE, context) => StoneProjectileMesh.createMesh(THREE, context),
    animate: (mesh, dt) => StoneProjectileAnimation.animate(mesh, dt)
};
