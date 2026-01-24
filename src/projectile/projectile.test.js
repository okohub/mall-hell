// ============================================
// PROJECTILE DOMAIN - Unit Tests
// ============================================

(function(test) {
    'use strict';

    // ==========================================
    // PROJECTILE DATA TESTS
    // ==========================================

    test.describe('Projectile Data', () => {
        test.it('should have stone type defined', () => {
            test.assertTrue(Projectile.types.stone !== undefined);
        });

        test.it('should have correct stone properties', () => {
            const stone = Projectile.types.stone;
            test.assertEqual(stone.id, 'stone');
            test.assertEqual(stone.geometry, 'sphere');
            test.assertEqual(stone.size, 0.2);
            test.assertTrue(stone.glow);
        });

        test.it('should get projectile by id', () => {
            const proj = Projectile.get('stone');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'stone');
        });

        test.it('should return stone for unknown type', () => {
            const proj = Projectile.get('unknown');
            test.assertEqual(proj.id, 'stone'); // Falls back to stone
        });

        test.it('should create instance data', () => {
            const instance = Projectile.createInstance(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100,
                1
            );
            test.assertEqual(instance.type, 'stone');
            test.assertEqual(instance.position.y, 1);
            test.assertEqual(instance.speed, 100);
            test.assertTrue(instance.active);
        });
    });

    // ==========================================
    // PROJECTILE SYSTEM TESTS
    // ==========================================

    test.describe('Projectile System - Initialization', () => {
        test.beforeEach(() => {
            ProjectileSystem.projectiles = [];
            ProjectileSystem.scene = null;
        });

        test.it('should initialize with data reference', () => {
            ProjectileSystem.init(Projectile, null);
            test.assertEqual(ProjectileSystem.projectileData, Projectile);
        });

        test.it('should reset clears projectiles', () => {
            ProjectileSystem.projectiles = [{ active: true }];
            ProjectileSystem.reset();
            test.assertEqual(ProjectileSystem.projectiles.length, 0);
        });
    });

    test.describe('Projectile System - Spawning', () => {
        test.beforeEach(() => {
            ProjectileSystem.init(Projectile, null);
        });

        test.it('should spawn projectile without THREE', () => {
            const p = ProjectileSystem.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100,
                1,
                0.5,
                null // No THREE
            );
            test.assertTrue(p !== null);
            test.assertEqual(p.type, 'stone');
            test.assertEqual(p.speed, 100);
            test.assertTrue(p.active);
        });

        test.it('should track spawned projectiles', () => {
            ProjectileSystem.spawn('stone', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, 100, 1, 1, null);
            ProjectileSystem.spawn('stone', { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, 100, 1, 1, null);
            test.assertEqual(ProjectileSystem.getCount(), 2);
        });

        test.it('should limit max projectiles', () => {
            ProjectileSystem.maxProjectiles = 3;
            for (let i = 0; i < 5; i++) {
                ProjectileSystem.spawn('stone', { x: i, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, 100, 1, 1, null);
            }
            test.assertEqual(ProjectileSystem.getCount(), 3);
        });
    });

    test.describe('Projectile System - Movement', () => {
        test.beforeEach(() => {
            ProjectileSystem.init(Projectile, null);
        });

        test.it('should move projectiles on update', () => {
            const p = ProjectileSystem.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            const initialZ = p.position.z;
            ProjectileSystem.update(0.1, { z: 0 }); // 0.1 seconds
            test.assertTrue(p.position.z < initialZ); // Moved forward (negative Z)
        });

        test.it('should despawn out of bounds projectiles', () => {
            const p = ProjectileSystem.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                1000, 1, 1, null
            );
            // Move far away
            ProjectileSystem.update(1, { z: 0 }); // 1 second at 1000 speed = 1000 units
            test.assertEqual(ProjectileSystem.getCount(), 0);
        });
    });

    test.describe('Projectile System - Collision', () => {
        test.beforeEach(() => {
            ProjectileSystem.init(Projectile, null);
        });

        test.it('should detect collision within radius', () => {
            const p = ProjectileSystem.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            const target = { position: { x: 0.1, y: 1, z: 0.1 } };
            const hit = ProjectileSystem.checkCollision(p, target, 1);
            test.assertTrue(hit);
        });

        test.it('should not detect collision outside radius', () => {
            const p = ProjectileSystem.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            const target = { position: { x: 5, y: 1, z: 5 } };
            const hit = ProjectileSystem.checkCollision(p, target, 1);
            test.assertFalse(hit);
        });

        test.it('should despawn non-piercing projectile on hit', () => {
            const p = ProjectileSystem.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            ProjectileSystem.onHit(p, {});
            test.assertEqual(ProjectileSystem.getCount(), 0);
        });
    });

    // ==========================================
    // PROJECTILE VISUAL TESTS
    // ==========================================

    test.describe('Projectile Visual', () => {
        test.it('should have createMesh method', () => {
            test.assertTrue(typeof ProjectileVisual.createMesh === 'function');
        });

        test.it('should have createGlowLight method', () => {
            test.assertTrue(typeof ProjectileVisual.createGlowLight === 'function');
        });

        test.it('should have createProjectileGroup method', () => {
            test.assertTrue(typeof ProjectileVisual.createProjectileGroup === 'function');
        });

        test.it('should create mesh with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const config = Projectile.get('stone');
            const mesh = ProjectileVisual.createMesh(THREE, config, 1.0);
            test.assertTrue(mesh instanceof THREE.Mesh);
        });

        test.it('should create glow light for glowing projectile', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const config = Projectile.get('stone');
            const light = ProjectileVisual.createGlowLight(THREE, config, 1.0);
            test.assertTrue(light instanceof THREE.PointLight);
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {} });
