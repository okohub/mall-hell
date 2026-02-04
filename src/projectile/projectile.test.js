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

        test.it('should have blob type defined', () => {
            test.assertTrue(Projectile.types.blob !== undefined);
        });

        test.it('should have correct blob properties', () => {
            const blob = Projectile.types.blob;
            test.assertEqual(blob.id, 'blob');
            test.assertEqual(blob.geometry, 'sphere');
            test.assertEqual(blob.color, 0x3498db);
            test.assertTrue(blob.glow);
            test.assertTrue(blob.gravity > 0);  // Blob has gravity for arc
        });

        test.it('should have ray type defined', () => {
            test.assertTrue(Projectile.types.ray !== undefined);
        });

        test.it('should have correct ray properties', () => {
            const ray = Projectile.types.ray;
            test.assertEqual(ray.id, 'ray');
            test.assertEqual(ray.geometry, 'cylinder');
            test.assertTrue(ray.length > 0, 'Ray should have length for beam shape');
            test.assertEqual(ray.gravity, 0, 'Ray should have no gravity');
            test.assertTrue(ray.glow, 'Ray should glow');
            test.assertTrue(ray.emissiveIntensity.max > 0.5, 'Ray should be bright');
        });

        test.it('should have soft-bullet type defined', () => {
            test.assertTrue(Projectile.types['soft-bullet'] !== undefined);
        });

        test.it('should have correct soft-bullet properties', () => {
            const softBullet = Projectile.types['soft-bullet'];
            test.assertEqual(softBullet.id, 'soft-bullet');
            test.assertEqual(softBullet.geometry, 'cylinder');
            test.assertTrue(softBullet.length > 0);  // Soft bullets have length
            test.assertTrue(softBullet.gravity > 0);  // Soft bullets have gravity for drop
        });

        test.it('should have blob splash properties', () => {
            const blob = Projectile.types.blob;
            test.assertTrue(blob.splash, 'Blob should have splash enabled');
            test.assertTrue(blob.splashRadius > 0, 'Blob should have splash radius');
            test.assertTrue(blob.splashDamage > 0, 'Blob should have splash damage');
        });

        test.it('should get projectile by id', () => {
            const proj = Projectile.get('stone');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'stone');
        });

        test.it('should get blob projectile by id', () => {
            const proj = Projectile.get('blob');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'blob');
        });

        test.it('should get soft-bullet projectile by id', () => {
            const proj = Projectile.get('soft-bullet');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'soft-bullet');
        });

        test.it('should get ray projectile by id', () => {
            const proj = Projectile.get('ray');
            test.assertTrue(proj !== null);
            test.assertEqual(proj.id, 'ray');
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

        test.it('should create blob projectile mesh with gravity', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1);
            const pos = new THREE.Vector3(0, 1, 0);
            const mesh = ProjectileOrchestrator.createMesh(THREE, dir, pos, 80, {
                projectileType: 'blob'
            });
            test.assertTrue(mesh instanceof THREE.Group);
            test.assertEqual(mesh.userData.projectileType, 'blob');
            test.assertTrue(mesh.userData.gravity > 0);  // Water has gravity
        });

        test.it('should create soft-bullet projectile mesh with gravity', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1);
            const pos = new THREE.Vector3(0, 1, 0);
            const mesh = ProjectileOrchestrator.createMesh(THREE, dir, pos, 100, {
                projectileType: 'soft-bullet'
            });
            test.assertTrue(mesh instanceof THREE.Group);
            test.assertEqual(mesh.userData.projectileType, 'soft-bullet');
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
    // PROJECTILE REGISTRY HOOKS
    // ==========================================

    test.describe('Projectile Registry Hooks', () => {
        test.it('should expose createMesh and animate for each type', () => {
            const types = ['stone', 'blob', 'ray', 'soft-bullet', 'syringe'];
            types.forEach((typeId) => {
                const config = Projectile.get(typeId);
                test.assertTrue(typeof config.createMesh === 'function', `${typeId} missing createMesh`);
                test.assertTrue(typeof config.animate === 'function', `${typeId} missing animate`);
            });
        });

        test.it('should create mesh for ray and syringe', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const ray = Projectile.get('ray');
            const syringe = Projectile.get('syringe');
            const rayMesh = ray.createMesh(THREE, {
                baseSize: ray.size,
                baseColor: ray.color,
                glowColor: ray.glowColor,
                hasGlow: ray.glow,
                sizeScale: 1,
                emissiveIntensity: ray.emissiveIntensity.max,
                glowOpacity: 0.4,
                length: ray.length
            });
            const syringeMesh = syringe.createMesh(THREE, {
                baseSize: syringe.size,
                baseColor: syringe.color,
                glowColor: syringe.glowColor,
                hasGlow: syringe.glow,
                sizeScale: 1,
                emissiveIntensity: syringe.emissiveIntensity.max,
                glowOpacity: 0.4,
                length: syringe.length
            });
            test.assertTrue(rayMesh instanceof THREE.Group);
            test.assertTrue(syringeMesh instanceof THREE.Group);
        });

        test.it('should animate soft-bullet without errors', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const mesh = new THREE.Group();
            const initialRotation = mesh.rotation.z;
            const softBullet = Projectile.get('soft-bullet');
            softBullet.animate(mesh, 0.1);
            test.assertTrue(mesh.rotation.z !== initialRotation);
        });

        test.it('should throw if createMesh is missing', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const original = Projectile.get('stone');
            Projectile.types['__bad'] = {
                ...original,
                createMesh: null,
                animate: () => {}
            };
            test.assertThrows(() => {
                const dir = new THREE.Vector3(0, 0, -1);
                const pos = new THREE.Vector3(0, 1, 0);
                ProjectileOrchestrator.createMesh(THREE, dir, pos, 100, {
                    projectileType: '__bad'
                });
            });
            delete Projectile.types['__bad'];
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {} });
