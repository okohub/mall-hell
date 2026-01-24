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

    // ==========================================
    // ENEMY AI - WALL COLLISION TESTS
    // ==========================================

    test.describe('Enemy System - Wall Collision', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
            EnemySystem.maxEnemies = 10;
        });

        test.it('should stop at wall when collision check blocks X', () => {
            const e = EnemySystem.spawn('SKELETON', 5, -10, null);
            const initialX = e.position.x;
            const playerPos = { x: 20, y: 0, z: -10 }; // Player to the right

            // Collision check that blocks X movement
            const collisionCheck = (nX, nZ, oX, oZ) => ({
                blocked: true,
                blockedX: true,
                blockedZ: false
            });

            EnemySystem.updateBehavior(e, playerPos, 1, 10, { collisionCheck });

            // X should not change (blocked)
            test.assertEqual(e.position.x, initialX);
        });

        test.it('should stop at wall when collision check blocks Z', () => {
            const e = EnemySystem.spawn('SKELETON', 0, -10, null);
            const initialZ = e.position.z;
            const playerPos = { x: 0, y: 0, z: -50 }; // Player ahead

            // Collision check that blocks Z movement
            const collisionCheck = (nX, nZ, oX, oZ) => ({
                blocked: true,
                blockedX: false,
                blockedZ: true
            });

            EnemySystem.updateBehavior(e, playerPos, 1, 10, { collisionCheck });

            // Z should not change (blocked)
            test.assertEqual(e.position.z, initialZ);
        });

        test.it('should move freely when collision check allows', () => {
            const e = EnemySystem.spawn('SKELETON', 5, -10, null);
            const initialX = e.position.x;
            const playerPos = { x: 0, y: 0, z: 0 };

            // Collision check that allows movement
            const collisionCheck = () => ({
                blocked: false,
                blockedX: false,
                blockedZ: false
            });

            EnemySystem.updateBehavior(e, playerPos, 1, 10, { collisionCheck });

            // Should move towards player
            test.assertTrue(e.position.x !== initialX);
        });

        test.it('should reverse drift direction when hitting wall', () => {
            const e = EnemySystem.spawn('SKELETON', 0, -10, null);
            e.driftSpeed = 5; // Positive drift
            e.driftTimer = 0;

            const collisionCheck = () => ({
                blocked: true,
                blockedX: true,
                blockedZ: false
            });

            EnemySystem.updateBehavior(e, { x: 0, y: 0, z: 0 }, 0.1, 10, { collisionCheck });

            // Drift should reverse
            test.assertEqual(e.driftSpeed, -5);
        });
    });

    // ==========================================
    // ENEMY AI - LINE OF SIGHT TESTS
    // ==========================================

    test.describe('Enemy System - Line of Sight', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
            EnemySystem.maxEnemies = 10;
        });

        test.it('should chase when has line of sight', () => {
            const e = EnemySystem.spawn('SKELETON', 10, -10, null);
            const initialX = e.position.x;
            const playerPos = { x: 0, y: 0, z: 0 };

            // LOS check returns true
            const hasLineOfSight = () => true;

            EnemySystem.updateBehavior(e, playerPos, 1, 10, { hasLineOfSight });

            // Should move towards player
            test.assertTrue(e.position.x < initialX);
        });

        test.it('should NOT chase directly when no line of sight', () => {
            const e = EnemySystem.spawn('SKELETON', 10, -10, null);
            e.lastSeenPlayerPos = null;
            e.lostSightTimer = 10; // Lost sight for a while
            const initialPos = { x: e.position.x, z: e.position.z };
            const playerPos = { x: 0, y: 0, z: 0 };

            // LOS check returns false
            const hasLineOfSight = () => false;

            EnemySystem.updateBehavior(e, playerPos, 0.1, 10, { hasLineOfSight });

            // Should NOT move directly towards player (wander instead)
            // Movement should be much slower (wander speed is 15% of base)
            const distMoved = Math.sqrt(
                Math.pow(e.position.x - initialPos.x, 2) +
                Math.pow(e.position.z - initialPos.z, 2)
            );
            test.assertTrue(distMoved < 1); // Wander is slow
        });

        test.it('should track last seen player position', () => {
            const e = EnemySystem.spawn('SKELETON', 10, -10, null);
            const playerPos = { x: 5, y: 0, z: -5 };

            // LOS check returns true
            const hasLineOfSight = () => true;

            EnemySystem.updateBehavior(e, playerPos, 0.1, 10, { hasLineOfSight });

            // Should remember last seen position
            test.assertTrue(e.lastSeenPlayerPos !== undefined);
            test.assertEqual(e.lastSeenPlayerPos.x, 5);
            test.assertEqual(e.lastSeenPlayerPos.z, -5);
        });

        test.it('should reset lost sight timer when sees player', () => {
            const e = EnemySystem.spawn('SKELETON', 10, -10, null);
            e.lostSightTimer = 5;
            const playerPos = { x: 0, y: 0, z: 0 };

            // LOS check returns true
            const hasLineOfSight = () => true;

            EnemySystem.updateBehavior(e, playerPos, 0.1, 10, { hasLineOfSight });

            // Lost sight timer should reset
            test.assertEqual(e.lostSightTimer, 0);
        });

        test.it('should increment lost sight timer when cannot see player', () => {
            const e = EnemySystem.spawn('SKELETON', 10, -10, null);
            e.lostSightTimer = 0;
            e.lastSeenPlayerPos = null;
            const playerPos = { x: 0, y: 0, z: 0 };

            // LOS check returns false
            const hasLineOfSight = () => false;

            EnemySystem.updateBehavior(e, playerPos, 0.5, 10, { hasLineOfSight });

            // Lost sight timer should increase
            test.assertTrue(e.lostSightTimer > 0);
        });
    });

    // ==========================================
    // ENEMY AI - ENVIRONMENT COLLISION TESTS
    // ==========================================

    test.describe('Enemy System - Environment Collision', () => {
        test.beforeEach(() => {
            EnemySystem.init(Enemy, null);
            EnemySystem.maxEnemies = 10;
        });

        test.it('should push apart overlapping enemies', () => {
            // Create mock enemy mesh objects
            const enemy1 = {
                position: { x: 0, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: Enemy.get('SKELETON')
                }
            };
            const enemy2 = {
                position: { x: 1, y: 0, z: 0 }, // Overlapping (within 2.5 + 2.5 = 5)
                userData: {
                    active: true,
                    config: Enemy.get('SKELETON')
                }
            };

            EnemySystem._resolveEnvironmentCollisions(enemy1, [enemy1, enemy2], null, null);

            // Enemies should be pushed apart
            test.assertTrue(enemy1.position.x < 0);
        });

        test.it('should push enemy away from obstacle', () => {
            const enemy = {
                position: { x: 0, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: Enemy.get('SKELETON')
                }
            };
            const obstacle = {
                position: { x: 2, y: 0, z: 0 },
                userData: {
                    active: true,
                    hit: false,
                    collisionRadius: 1.5
                }
            };

            EnemySystem._resolveEnvironmentCollisions(enemy, [enemy], [obstacle], null);

            // Enemy should be pushed away from obstacle
            test.assertTrue(enemy.position.x < 0);
        });

        test.it('should ignore inactive obstacles', () => {
            const enemy = {
                position: { x: 0, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: Enemy.get('SKELETON')
                }
            };
            const obstacle = {
                position: { x: 1, y: 0, z: 0 },
                userData: {
                    active: false, // Inactive
                    hit: false,
                    collisionRadius: 1.5
                }
            };

            const initialX = enemy.position.x;
            EnemySystem._resolveEnvironmentCollisions(enemy, [enemy], [obstacle], null);

            // Enemy should not be pushed (obstacle inactive)
            test.assertEqual(enemy.position.x, initialX);
        });

        test.it('should ignore hit obstacles', () => {
            const enemy = {
                position: { x: 0, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: Enemy.get('SKELETON')
                }
            };
            const obstacle = {
                position: { x: 1, y: 0, z: 0 },
                userData: {
                    active: true,
                    hit: true, // Already hit
                    collisionRadius: 1.5
                }
            };

            const initialX = enemy.position.x;
            EnemySystem._resolveEnvironmentCollisions(enemy, [enemy], [obstacle], null);

            // Enemy should not be pushed (obstacle already hit)
            test.assertEqual(enemy.position.x, initialX);
        });

        test.it('should push enemy away from shelf', () => {
            const enemy = {
                position: { x: 0, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: Enemy.get('SKELETON')
                }
            };
            const shelf = {
                position: { x: 2, y: 0, z: 0 },
                userData: {
                    width: 4,
                    depth: 2
                }
            };

            EnemySystem._resolveEnvironmentCollisions(enemy, [enemy], null, [shelf]);

            // Enemy should be pushed away from shelf
            test.assertTrue(enemy.position.x < 0);
        });
    });

    // ==========================================
    // ENEMY COLLISION RADIUS TESTS
    // ==========================================

    test.describe('Enemy System - Collision Radii', () => {
        test.it('should have collision radius in skeleton config', () => {
            const config = Enemy.get('SKELETON');
            test.assertTrue(config.collisionRadius !== undefined);
            test.assertEqual(config.collisionRadius, 2.5);
        });

        test.it('should use config collision radius for enemy-enemy collision', () => {
            // Two enemies at distance of 4 (within 2.5 + 2.5 = 5)
            const enemy1 = {
                position: { x: 0, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: { collisionRadius: 2.5 }
                }
            };
            const enemy2 = {
                position: { x: 4, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: { collisionRadius: 2.5 }
                }
            };

            EnemySystem._resolveEnvironmentCollisions(enemy1, [enemy1, enemy2], null, null);

            // Should be pushed apart (distance 4 < minDist 5)
            test.assertTrue(enemy1.position.x < 0);
        });

        test.it('should not collide when enemies are far apart', () => {
            const enemy1 = {
                position: { x: 0, y: 0, z: 0 },
                userData: {
                    active: true,
                    config: { collisionRadius: 2.5 }
                }
            };
            const enemy2 = {
                position: { x: 10, y: 0, z: 0 }, // Far apart
                userData: {
                    active: true,
                    config: { collisionRadius: 2.5 }
                }
            };

            const initialX = enemy1.position.x;
            EnemySystem._resolveEnvironmentCollisions(enemy1, [enemy1, enemy2], null, null);

            // Should not be pushed (distance 10 > minDist 5)
            test.assertEqual(enemy1.position.x, initialX);
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
