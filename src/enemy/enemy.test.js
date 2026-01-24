// ============================================
// ENEMY DOMAIN - Unit Tests
// ============================================

(function(test) {
    'use strict';

    // ==========================================
    // ENEMY DATA TESTS
    // ==========================================

    test.describe('Enemy Data', () => {
        test.it('should have SKELETON type defined', () => {
            test.assertTrue(Enemy.types.SKELETON !== undefined);
        });

        test.it('should have correct skeleton properties', () => {
            const skeleton = Enemy.types.SKELETON;
            test.assertEqual(skeleton.id, 'skeleton');
            test.assertEqual(skeleton.health, 4);
            test.assertEqual(skeleton.speed, 0.45);
            test.assertEqual(skeleton.damage, 25);
            test.assertEqual(skeleton.behavior, 'chase');
            test.assertEqual(skeleton.scoreHit, 150);
            test.assertEqual(skeleton.scoreDestroy, 400);
        });

        test.it('should get skeleton by id', () => {
            const enemy = Enemy.get('SKELETON');
            test.assertTrue(enemy !== null);
            test.assertEqual(enemy.id, 'skeleton');
        });

        test.it('should default to skeleton for unknown type', () => {
            const enemy = Enemy.get('UNKNOWN');
            test.assertTrue(enemy !== null);
            test.assertEqual(enemy.id, 'skeleton'); // Defaults to skeleton
        });

        test.it('should create skeleton instance data', () => {
            const instance = Enemy.createInstance('SKELETON', { x: 5, y: 0, z: -10 });
            test.assertEqual(instance.type, 'SKELETON');
            test.assertEqual(instance.health, 4);
            test.assertEqual(instance.maxHealth, 4);
            test.assertEqual(instance.position.x, 5);
            test.assertTrue(instance.active);
        });

        test.it('should have walkTimer in instance data', () => {
            const instance = Enemy.createInstance('SKELETON', { x: 0, y: 0, z: 0 });
            test.assertTrue(instance.walkTimer !== undefined);
            test.assertTrue(typeof instance.walkTimer === 'number');
        });

        test.it('should check if alive', () => {
            const instance = Enemy.createInstance('SKELETON', { x: 0, y: 0, z: 0 });
            test.assertTrue(Enemy.isAlive(instance));

            instance.health = 0;
            test.assertFalse(Enemy.isAlive(instance));
        });

        test.it('should get health percent', () => {
            const instance = Enemy.createInstance('SKELETON', { x: 0, y: 0, z: 0 });
            test.assertEqual(Enemy.getHealthPercent(instance), 1);

            instance.health = 1;
            test.assertEqual(Enemy.getHealthPercent(instance), 0.25); // 1/4 = 0.25
        });

        test.it('should have skeleton visual properties', () => {
            const skeleton = Enemy.types.SKELETON;
            test.assertTrue(skeleton.visual.boneColor !== undefined);
            test.assertTrue(skeleton.visual.eyeColor !== undefined);
            test.assertTrue(skeleton.visual.smileColor !== undefined);
            test.assertTrue(skeleton.visual.cartColor !== undefined);
            test.assertTrue(skeleton.visual.hornColor !== undefined);
        });

        test.it('should have walkSpeed in skeleton config', () => {
            const skeleton = Enemy.types.SKELETON;
            test.assertTrue(skeleton.walkSpeed !== undefined);
            test.assertEqual(skeleton.walkSpeed, 3.5);
        });

        test.it('should have defaultType property', () => {
            test.assertEqual(Enemy.defaultType, 'SKELETON');
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
            EnemySystem.maxEnemies = 10; // Reset to default
        });

        test.it('should spawn skeleton enemy without THREE', () => {
            const e = EnemySystem.spawn('SKELETON', 5, -20, null);
            test.assertTrue(e !== null);
            test.assertEqual(e.type, 'SKELETON');
            test.assertEqual(e.position.x, 5);
            test.assertEqual(e.position.z, -20);
        });

        test.it('should track spawned enemies', () => {
            EnemySystem.spawn('SKELETON', 0, -10, null);
            EnemySystem.spawn('SKELETON', 5, -20, null);
            test.assertEqual(EnemySystem.getCount(), 2);
        });

        test.it('should limit max enemies', () => {
            EnemySystem.maxEnemies = 3;
            for (let i = 0; i < 5; i++) {
                EnemySystem.spawn('SKELETON', i, -10 * i, null);
            }
            test.assertEqual(EnemySystem.getCount(), 3);
        });

        test.it('should check canSpawn', () => {
            EnemySystem.maxEnemies = 2;
            test.assertTrue(EnemySystem.canSpawn());

            EnemySystem.spawn('SKELETON', 0, 0, null);
            EnemySystem.spawn('SKELETON', 0, 0, null);
            test.assertFalse(EnemySystem.canSpawn());
        });

        test.it('should spawn skeleton with correct properties', () => {
            const e = EnemySystem.spawn('SKELETON', 5, -20, null);
            test.assertTrue(e !== null);
            test.assertEqual(e.type, 'SKELETON');
            test.assertEqual(e.health, 4);
            test.assertEqual(e.config.damage, 25);
            test.assertTrue(e.walkTimer !== undefined);
        });

        test.it('should handle multiple skeleton spawns', () => {
            EnemySystem.spawn('SKELETON', 0, -10, null);
            EnemySystem.spawn('SKELETON', 5, -20, null);
            EnemySystem.spawn('SKELETON', 10, -30, null);
            test.assertEqual(EnemySystem.getCount(), 3);

            const active = EnemySystem.getActive();
            const types = active.map(e => e.type);
            test.assertTrue(types.every(t => t === 'SKELETON'));
        });
    });

    test.describe('Enemy System - Damage', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
            EnemySystem.maxEnemies = 10;
        });

        test.it('should damage skeleton', () => {
            const e = EnemySystem.spawn('SKELETON', 0, 0, null);
            const result = EnemySystem.damage(e, 1);

            test.assertTrue(result.hit);
            test.assertFalse(result.destroyed);
            test.assertEqual(result.scoreHit, 150);  // Skeleton scoreHit
            test.assertEqual(result.scoreDestroy, 0);
            test.assertEqual(e.health, 3);  // 4 - 1 = 3
        });

        test.it('should destroy skeleton at 0 health', () => {
            const e = EnemySystem.spawn('SKELETON', 0, 0, null);
            EnemySystem.damage(e, 1);
            EnemySystem.damage(e, 1);
            EnemySystem.damage(e, 1);
            const result = EnemySystem.damage(e, 1);  // 4th hit destroys

            test.assertTrue(result.destroyed);
            test.assertEqual(result.scoreDestroy, 400);  // Skeleton scoreDestroy
            test.assertEqual(result.totalScore, 550);    // 150 + 400
            test.assertFalse(e.active);
        });

        test.it('should set hit flash on damage', () => {
            const e = EnemySystem.spawn('SKELETON', 0, 0, null);
            EnemySystem.damage(e, 1);
            test.assertEqual(e.hitFlash, 1);
        });
    });

    test.describe('Enemy System - AI Behavior', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
            EnemySystem.maxEnemies = 10;
        });

        test.it('should chase player', () => {
            const e = EnemySystem.spawn('SKELETON', 10, -10, null);
            const initialX = e.position.x;
            const playerPos = { x: 0, y: 0, z: 0 };

            EnemySystem.updateBehavior(e, playerPos, 1, 10);

            // Should move towards player (x = 0)
            test.assertTrue(e.position.x < initialX);
        });

        test.it('should update drift', () => {
            const e = EnemySystem.spawn('SKELETON', 0, -10, null);
            e.driftTimer = 10; // Force drift change

            EnemySystem.updateBehavior(e, { x: 0, y: 0, z: 0 }, 0.1, 10);

            // Drift timer should reset
            test.assertTrue(e.driftTimer < 1);
        });
    });

    test.describe('Enemy System - Cleanup', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
            EnemySystem.maxEnemies = 10;
        });

        test.it('should despawn enemies behind camera', () => {
            const e = EnemySystem.spawn('SKELETON', 0, 25, null); // 25 units behind camera at z=0 (> despawnDistance of 20)
            EnemySystem.update({ x: 0, y: 0, z: 0 }, { z: 0 }, 0.1, 10);
            test.assertEqual(EnemySystem.getCount(), 0);
        });

        test.it('should despawn destroyed enemies', () => {
            const e = EnemySystem.spawn('SKELETON', 0, -10, null);
            e.active = false;
            EnemySystem.update({ x: 0, y: 0, z: 0 }, { z: 0 }, 0.1, 10);
            test.assertEqual(EnemySystem.getCount(), 0);
        });
    });

    // ==========================================
    // ENEMY VISUAL TESTS
    // ==========================================

    test.describe('Enemy Visual', () => {
        test.it('should have createSkeletonMesh method', () => {
            test.assertTrue(typeof EnemyVisual.createSkeletonMesh === 'function');
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

        test.it('should have animateSkeletonEyes method', () => {
            test.assertTrue(typeof EnemyVisual.animateSkeletonEyes === 'function');
        });

        test.it('should have animateSkeletonWalk method', () => {
            test.assertTrue(typeof EnemyVisual.animateSkeletonWalk === 'function');
        });

        test.it('should create skeleton mesh with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const config = Enemy.get('SKELETON');
            const mesh = EnemyVisual.createSkeletonMesh(THREE, config);
            test.assertTrue(mesh instanceof THREE.Group);
            test.assertTrue(mesh.userData.skull !== undefined);
            test.assertTrue(mesh.userData.skeleton !== undefined);
        });

        test.it('should create skeleton mesh with legs for walking', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const config = Enemy.get('SKELETON');
            const mesh = EnemyVisual.createSkeletonMesh(THREE, config);
            test.assertTrue(mesh.userData.leftLeg !== undefined);
            test.assertTrue(mesh.userData.rightLeg !== undefined);
            test.assertTrue(mesh.userData.pelvis !== undefined);
        });

        test.it('should create skeleton mesh with arms', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const config = Enemy.get('SKELETON');
            const mesh = EnemyVisual.createSkeletonMesh(THREE, config);
            test.assertTrue(mesh.userData.leftArm !== undefined);
            test.assertTrue(mesh.userData.rightArm !== undefined);
        });

        test.it('should create enemy with skeleton', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const config = Enemy.get('SKELETON');
            const enemy = EnemyVisual.createEnemy(THREE, config);
            test.assertTrue(enemy instanceof THREE.Group);
            test.assertTrue(enemy.userData.skeleton !== undefined);
            test.assertTrue(enemy.userData.leftLeg !== undefined);
            test.assertTrue(enemy.userData.rightLeg !== undefined);
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

    // ==========================================
    // ENEMY THEME TESTS
    // ==========================================

    test.describe('Enemy Theme', () => {
        test.it('should have skeleton theme', () => {
            test.assertTrue(EnemyTheme.skeleton !== undefined);
            test.assertTrue(EnemyTheme.skeleton.bone !== undefined);
            test.assertTrue(EnemyTheme.skeleton.eyes !== undefined);
            test.assertTrue(EnemyTheme.skeleton.smile !== undefined);
            test.assertTrue(EnemyTheme.skeleton.cart !== undefined);
        });

        test.it('should have skeleton eye properties', () => {
            test.assertTrue(EnemyTheme.skeleton.eyes.socket !== undefined);
            test.assertTrue(EnemyTheme.skeleton.eyes.glow !== undefined);
            test.assertTrue(EnemyTheme.skeleton.eyes.emissiveIntensity !== undefined);
        });

        test.it('should have skeleton smile properties', () => {
            test.assertTrue(EnemyTheme.skeleton.smile.color !== undefined);
            test.assertTrue(EnemyTheme.skeleton.smile.teeth !== undefined);
        });

        test.it('should have skeleton cart properties', () => {
            test.assertTrue(EnemyTheme.skeleton.cart.body !== undefined);
            test.assertTrue(EnemyTheme.skeleton.cart.horns !== undefined);
        });

        test.it('should get skeleton theme for any type', () => {
            const theme = EnemyTheme.getTheme('SKELETON');
            test.assertEqual(theme, EnemyTheme.skeleton);

            // Any type should return skeleton (only type available)
            const theme2 = EnemyTheme.getTheme('UNKNOWN');
            test.assertEqual(theme2, EnemyTheme.skeleton);
        });

        test.it('should have damage flash config', () => {
            test.assertTrue(EnemyTheme.damageFlash !== undefined);
            test.assertTrue(EnemyTheme.damageFlash.color !== undefined);
            test.assertTrue(EnemyTheme.damageFlash.duration !== undefined);
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {} });
