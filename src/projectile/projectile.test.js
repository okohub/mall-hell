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

        test.it('should have water type defined', () => {
            test.assertTrue(Projectile.types.water !== undefined);
        });

        test.it('should have correct water properties', () => {
            const water = Projectile.types.water;
            test.assertEqual(water.id, 'water');
            test.assertEqual(water.geometry, 'sphere');
            test.assertEqual(water.color, 0x3498db);
            test.assertTrue(water.glow);
            test.assertTrue(water.gravity > 0);  // Water has gravity for arc
        });

        test.it('should have laser type defined', () => {
            test.assertTrue(Projectile.types.laser !== undefined);
        });

        test.it('should have correct laser properties', () => {
            const laser = Projectile.types.laser;
            test.assertEqual(laser.id, 'laser');
            test.assertEqual(laser.geometry, 'cylinder');
            test.assertTrue(laser.length > 0, 'Laser should have length for beam shape');
            test.assertEqual(laser.gravity, 0, 'Laser should have no gravity');
            test.assertTrue(laser.glow, 'Laser should glow');
            test.assertTrue(laser.emissiveIntensity.max > 0.5, 'Laser should be bright');
        });

        test.it('should have dart type defined', () => {
            test.assertTrue(Projectile.types.dart !== undefined);
        });

        test.it('should have correct dart properties', () => {
            const dart = Projectile.types.dart;
            test.assertEqual(dart.id, 'dart');
            test.assertEqual(dart.geometry, 'cylinder');
            test.assertTrue(dart.length > 0);  // Darts have length for elongated shape
            test.assertTrue(dart.gravity > 0);  // Darts have gravity for drop
        });

        test.it('should have water splash properties', () => {
            const water = Projectile.types.water;
            test.assertTrue(water.splash, 'Water should have splash enabled');
            test.assertTrue(water.splashRadius > 0, 'Water should have splash radius');
            test.assertTrue(water.splashDamage > 0, 'Water should have splash damage');
        });

        test.it('should get projectile by id', () => {
            const proj = Projectile.get('stone');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'stone');
        });

        test.it('should get water projectile by id', () => {
            const proj = Projectile.get('water');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'water');
        });

        test.it('should get dart projectile by id', () => {
            const proj = Projectile.get('dart');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'dart');
        });

        test.it('should get laser projectile by id', () => {
            const proj = Projectile.get('laser');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'laser');
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
            ProjectileOrchestrator.projectiles = [];
            ProjectileOrchestrator.scene = null;
        });

        test.it('should initialize with data reference', () => {
            ProjectileOrchestrator.init(Projectile, null);
            test.assertEqual(ProjectileOrchestrator.projectileData, Projectile);
        });

        test.it('should reset clears projectiles', () => {
            ProjectileOrchestrator.projectiles = [{ active: true }];
            ProjectileOrchestrator.reset();
            test.assertEqual(ProjectileOrchestrator.projectiles.length, 0);
        });
    });

    test.describe('Projectile System - Spawning', () => {
        test.beforeEach(() => {
            ProjectileOrchestrator.init(Projectile, null);
        });

        test.it('should spawn projectile without THREE', () => {
            const p = ProjectileOrchestrator.spawn(
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
            ProjectileOrchestrator.spawn('stone', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, 100, 1, 1, null);
            ProjectileOrchestrator.spawn('stone', { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, 100, 1, 1, null);
            test.assertEqual(ProjectileOrchestrator.getCount(), 2);
        });

        test.it('should limit max projectiles', () => {
            // maxProjectiles is now from config (50 by default)
            const maxProjectiles = ProjectileOrchestrator.maxProjectiles;
            for (let i = 0; i < maxProjectiles + 5; i++) {
                ProjectileOrchestrator.spawn('stone', { x: i, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, 100, 1, 1, null);
            }
            test.assertEqual(ProjectileOrchestrator.getCount(), maxProjectiles);
        });
    });

    test.describe('Projectile System - Movement', () => {
        test.beforeEach(() => {
            ProjectileOrchestrator.init(Projectile, null);
        });

        test.it('should move projectiles on update', () => {
            const p = ProjectileOrchestrator.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            const initialZ = p.position.z;
            ProjectileOrchestrator.update(0.1, { z: 0 }); // 0.1 seconds
            test.assertTrue(p.position.z < initialZ); // Moved forward (negative Z)
        });

        test.it('should despawn out of bounds projectiles', () => {
            const p = ProjectileOrchestrator.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                1000, 1, 1, null
            );
            // Move far away
            ProjectileOrchestrator.update(1, { z: 0 }); // 1 second at 1000 speed = 1000 units
            test.assertEqual(ProjectileOrchestrator.getCount(), 0);
        });
    });

    test.describe('Projectile System - Collision', () => {
        test.beforeEach(() => {
            ProjectileOrchestrator.init(Projectile, null);
        });

        test.it('should detect collision within radius', () => {
            const p = ProjectileOrchestrator.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            const target = { position: { x: 0.1, y: 1, z: 0.1 } };
            const hit = ProjectileOrchestrator.checkCollision(p, target, 1);
            test.assertTrue(hit);
        });

        test.it('should not detect collision outside radius', () => {
            const p = ProjectileOrchestrator.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            const target = { position: { x: 5, y: 1, z: 5 } };
            const hit = ProjectileOrchestrator.checkCollision(p, target, 1);
            test.assertFalse(hit);
        });

        test.it('should despawn non-piercing projectile on hit', () => {
            const p = ProjectileOrchestrator.spawn(
                'stone',
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: -1 },
                100, 1, 1, null
            );
            ProjectileOrchestrator.onHit(p, {});
            test.assertEqual(ProjectileOrchestrator.getCount(), 0);
        });
    });

    // ==========================================
    // PROJECTILE SYSTEM MESH CREATION TESTS
    // ==========================================

    test.describe('Projectile System - Mesh Creation', () => {
        test.it('should create stone projectile mesh with correct userData', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1);
            const pos = new THREE.Vector3(0, 1, 0);
            const mesh = ProjectileOrchestrator.createMesh(THREE, dir, pos, 100, {
                projectileType: 'stone'
            });
            test.assertTrue(mesh instanceof THREE.Group);
            test.assertEqual(mesh.userData.projectileType, 'stone');
            test.assertEqual(mesh.userData.gravity, 0);  // Stone has no gravity
        });

        test.it('should create water projectile mesh with gravity', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1);
            const pos = new THREE.Vector3(0, 1, 0);
            const mesh = ProjectileOrchestrator.createMesh(THREE, dir, pos, 80, {
                projectileType: 'water'
            });
            test.assertTrue(mesh instanceof THREE.Group);
            test.assertEqual(mesh.userData.projectileType, 'water');
            test.assertTrue(mesh.userData.gravity > 0);  // Water has gravity
        });

        test.it('should create dart projectile mesh with gravity', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1);
            const pos = new THREE.Vector3(0, 1, 0);
            const mesh = ProjectileOrchestrator.createMesh(THREE, dir, pos, 100, {
                projectileType: 'dart'
            });
            test.assertTrue(mesh instanceof THREE.Group);
            test.assertEqual(mesh.userData.projectileType, 'dart');
            test.assertTrue(mesh.userData.gravity > 0);  // Dart has gravity
        });

        test.it('should default to stone if projectileType not specified', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1);
            const pos = new THREE.Vector3(0, 1, 0);
            const mesh = ProjectileOrchestrator.createMesh(THREE, dir, pos, 100, {});
            test.assertEqual(mesh.userData.projectileType, 'stone');
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
