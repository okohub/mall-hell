# Projectile Architecture (Registry + Per-Type API)

This folder defines the **projectile domain** using a single registry and per-type folders. This style is now shared with weapons and enemies.

**Core principles**
1. Each projectile type lives in its own folder.
2. The type file is the **only public API** for that type.
3. Mesh and animation logic are delegated to per-type files.
4. A single registry is the source of truth for all projectile configs.
5. Orchestrator fails fast if a type is missing required hooks.

**Registry**
`globalThis.ProjectileTypeRegistry` is the single registry used by `src/projectile/projectile.js`.

Each type file registers itself:
```
ProjectileTypeRegistry['soft-bullet'] = {
  id: 'soft-bullet',
  ...stats,
  createMesh: SoftBulletProjectileMesh.createMesh,
  animate: SoftBulletProjectileAnimation.animate
};
```

**Folder layout**
```
src/projectile/<type>/
  <type>.js               // Public API (registers type + delegates)
  <type>-mesh.js          // createMesh(THREE, context)
  <type>-animation.js     // animate(mesh, dt)
```

**Script load order (non‑module)**
Mesh → Animation → Type for each projectile, then:
`projectile.js` → `projectile-orchestrator.js`

This order avoids reference errors because type files reference mesh/animation symbols at definition time.

**How to add a new projectile**
1. Create `src/projectile/<new-type>/` with the three files above.
2. Register the type in `<new-type>.js` with `createMesh` and `animate`.
3. Update script tags in `index.html` and `tests/unit-tests.html` with the mesh → animation → type order.
4. Add tests in `src/projectile/projectile.test.js` to assert hooks exist.

**Fail‑fast contract**
`projectile-orchestrator.js` throws if `createMesh` or `animate` is missing. Tests should cover this to keep the registry consistent.
