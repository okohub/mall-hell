// ============================================
// BLOB PROJECTILE - Type Definition
// ============================================

var ProjectileTypeRegistry = (typeof globalThis !== 'undefined')
    ? (globalThis.ProjectileTypeRegistry = globalThis.ProjectileTypeRegistry || {})
    : {};

ProjectileTypeRegistry['blob'] = {
    id: 'blob',
    geometry: 'sphere',
    size: 0.5,
    color: 0x3498db,
    glow: true,
    glowColor: 0x5dade2,
    emissiveIntensity: { min: 0.5, max: 0.8 },
    gravity: 18,
    lifetime: 3000,
    piercing: false,
    splash: true,
    splashRadius: 5,
    splashDamage: 0.5,
    slow: {
        enabled: true,
        duration: 2.0,
        speedMultiplier: 0.5
    },
    createMesh: (THREE, context) => BlobProjectileMesh.createMesh(THREE, context),
    animate: (mesh, dt) => BlobProjectileAnimation.animate(mesh, dt)
};
