// ============================================
// ENEMY DOMAIN - Unit Tests
// ============================================

(function(test) {
    'use strict';

    // ==========================================
    // ENEMY DATA TESTS
    // ==========================================

    test.describe('Enemy Data', () => {
        test.it('should have CART type defined', () => {
            test.assertTrue(Enemy.types.CART !== undefined);
        });

        test.it('should have correct cart properties', () => {
            const cart = Enemy.types.CART;
            test.assertEqual(cart.id, 'cart');
            test.assertEqual(cart.health, 3);
            test.assertEqual(cart.speed, 0.4);
            test.assertEqual(cart.damage, 20);
            test.assertEqual(cart.behavior, 'chase');
            test.assertEqual(cart.scoreHit, 100);
            test.assertEqual(cart.scoreDestroy, 300);
        });

        test.it('should get enemy by id', () => {
            const enemy = Enemy.get('CART');
            test.assertTrue(enemy !== null);
            test.assertEqual(enemy.id, 'cart');
        });

        test.it('should return null for unknown enemy', () => {
            const enemy = Enemy.get('UNKNOWN');
            test.assertEqual(enemy, null);
        });

        test.it('should create instance data', () => {
            const instance = Enemy.createInstance('CART', { x: 5, y: 0, z: -10 });
            test.assertEqual(instance.type, 'CART');
            test.assertEqual(instance.health, 3);
            test.assertEqual(instance.maxHealth, 3);
            test.assertEqual(instance.position.x, 5);
            test.assertTrue(instance.active);
        });

        test.it('should check if alive', () => {
            const instance = Enemy.createInstance('CART', { x: 0, y: 0, z: 0 });
            test.assertTrue(Enemy.isAlive(instance));

            instance.health = 0;
            test.assertFalse(Enemy.isAlive(instance));
        });

        test.it('should get health percent', () => {
            const instance = Enemy.createInstance('CART', { x: 0, y: 0, z: 0 });
            test.assertEqual(Enemy.getHealthPercent(instance), 1);

            instance.health = 1;
            test.assertTrue(Math.abs(Enemy.getHealthPercent(instance) - 0.333) < 0.01);
        });
    });

    // ==========================================
    // ENEMY SYSTEM TESTS
    // ==========================================

    test.describe('Enemy System - Initialization', () => {
        test.beforeEach(() => {
            EnemySystem.enemies = [];
            EnemySystem.scene = null;
        });

        test.it('should initialize with data reference', () => {
            EnemySystem.init(Enemy, null);
            test.assertEqual(EnemySystem.enemyData, Enemy);
        });

        test.it('should reset clears enemies', () => {
            EnemySystem.enemies = [{ active: true }];
            EnemySystem.reset();
            test.assertEqual(EnemySystem.enemies.length, 0);
        });
    });

    test.describe('Enemy System - Spawning', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
        });

        test.it('should spawn enemy without THREE', () => {
            const e = EnemySystem.spawn('CART', 5, -20, null);
            test.assertTrue(e !== null);
            test.assertEqual(e.type, 'CART');
            test.assertEqual(e.position.x, 5);
            test.assertEqual(e.position.z, -20);
        });

        test.it('should track spawned enemies', () => {
            EnemySystem.spawn('CART', 0, -10, null);
            EnemySystem.spawn('CART', 5, -20, null);
            test.assertEqual(EnemySystem.getCount(), 2);
        });

        test.it('should limit max enemies', () => {
            EnemySystem.maxEnemies = 3;
            for (let i = 0; i < 5; i++) {
                EnemySystem.spawn('CART', i, -10 * i, null);
            }
            test.assertEqual(EnemySystem.getCount(), 3);
        });

        test.it('should check canSpawn', () => {
            EnemySystem.maxEnemies = 2;
            test.assertTrue(EnemySystem.canSpawn());

            EnemySystem.spawn('CART', 0, 0, null);
            EnemySystem.spawn('CART', 0, 0, null);
            test.assertFalse(EnemySystem.canSpawn());
        });
    });

    test.describe('Enemy System - Damage', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
        });

        test.it('should damage enemy', () => {
            const e = EnemySystem.spawn('CART', 0, 0, null);
            const result = EnemySystem.damage(e, 1);

            test.assertTrue(result.hit);
            test.assertFalse(result.destroyed);
            test.assertEqual(result.scoreHit, 100);
            test.assertEqual(result.scoreDestroy, 0);
            test.assertEqual(e.health, 2);
        });

        test.it('should destroy enemy at 0 health', () => {
            const e = EnemySystem.spawn('CART', 0, 0, null);
            EnemySystem.damage(e, 1);
            EnemySystem.damage(e, 1);
            const result = EnemySystem.damage(e, 1);

            test.assertTrue(result.destroyed);
            test.assertEqual(result.scoreDestroy, 300);
            test.assertEqual(result.totalScore, 400);
            test.assertFalse(e.active);
        });

        test.it('should set hit flash on damage', () => {
            const e = EnemySystem.spawn('CART', 0, 0, null);
            EnemySystem.damage(e, 1);
            test.assertEqual(e.hitFlash, 1);
        });
    });

    test.describe('Enemy System - AI Behavior', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
        });

        test.it('should chase player', () => {
            const e = EnemySystem.spawn('CART', 10, -10, null);
            const initialX = e.position.x;
            const playerPos = { x: 0, y: 0, z: 0 };

            EnemySystem.updateBehavior(e, playerPos, 1, 10);

            // Should move towards player (x = 0)
            test.assertTrue(e.position.x < initialX);
        });

        test.it('should update drift', () => {
            const e = EnemySystem.spawn('CART', 0, -10, null);
            e.driftTimer = 10; // Force drift change

            EnemySystem.updateBehavior(e, { x: 0, y: 0, z: 0 }, 0.1, 10);

            // Drift timer should reset
            test.assertTrue(e.driftTimer < 1);
        });
    });

    test.describe('Enemy System - Cleanup', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
        });

        test.it('should despawn enemies behind camera', () => {
            const e = EnemySystem.spawn('CART', 0, 25, null); // 25 units behind camera at z=0 (> despawnDistance of 20)
            EnemySystem.update({ x: 0, y: 0, z: 0 }, { z: 0 }, 0.1, 10);
            test.assertEqual(EnemySystem.getCount(), 0);
        });

        test.it('should despawn destroyed enemies', () => {
            const e = EnemySystem.spawn('CART', 0, -10, null);
            e.active = false;
            EnemySystem.update({ x: 0, y: 0, z: 0 }, { z: 0 }, 0.1, 10);
            test.assertEqual(EnemySystem.getCount(), 0);
        });
    });

    // ==========================================
    // ENEMY VISUAL TESTS
    // ==========================================

    test.describe('Enemy Visual', () => {
        test.it('should have createCartMesh method', () => {
            test.assertTrue(typeof EnemyVisual.createCartMesh === 'function');
        });

        test.it('should have createHealthBar method', () => {
            test.assertTrue(typeof EnemyVisual.createHealthBar === 'function');
        });

        test.it('should have updateHealthBar method', () => {
            test.assertTrue(typeof EnemyVisual.updateHealthBar === 'function');
        });

        test.it('should have applyHitFlash method', () => {
            test.assertTrue(typeof EnemyVisual.applyHitFlash === 'function');
        });

        test.it('should create cart mesh with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const config = Enemy.get('CART');
            const mesh = EnemyVisual.createCartMesh(THREE, config);
            test.assertTrue(mesh instanceof THREE.Group);
        });

        test.it('should create health bar with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const healthBar = EnemyVisual.createHealthBar(THREE, 2);
            test.assertTrue(healthBar instanceof THREE.Group);
            test.assertTrue(healthBar.userData.fill !== undefined);
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {} });
