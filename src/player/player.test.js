// ============================================
// PLAYER DOMAIN - Unit Tests
// ============================================
// Tests for Player data, PlayerVisual, and PlayerOrchestrator

(function(test) {
    'use strict';

    // ==========================================
    // PLAYER DATA TESTS
    // ==========================================

    test.describe('Player Data', () => {
        test.it('should have movement constants', () => {
            test.assertTrue(Player.movement.SPEED > 0, 'SPEED should be positive');
            test.assertTrue(Player.movement.TURN_SPEED > 0, 'TURN_SPEED should be positive');
            test.assertTrue(Player.movement.MAX_SPEED >= Player.movement.SPEED, 'MAX_SPEED should be >= SPEED');
            test.assertTrue(Player.movement.ACCELERATION > 0, 'ACCELERATION should be positive');
            test.assertTrue(Player.movement.FRICTION > 0, 'FRICTION should be positive');
        });

        test.it('should have visual constants', () => {
            test.assertTrue(Player.visual.LEAN_ANGLE > 0, 'LEAN_ANGLE should be positive');
            test.assertTrue(Player.visual.CAMERA_HEIGHT > 0, 'CAMERA_HEIGHT should be positive');
            test.assertTrue(Player.visual.COLLISION_RADIUS > 0, 'COLLISION_RADIUS should be positive');
        });

        test.it('should have health constants', () => {
            test.assertEqual(Player.health.MAX, 100, 'MAX health should be 100');
            test.assertTrue(Player.health.ENEMY_DAMAGE > 0, 'ENEMY_DAMAGE should be positive');
            test.assertTrue(Player.health.OBSTACLE_DAMAGE > 0, 'OBSTACLE_DAMAGE should be positive');
            test.assertTrue(Player.health.INVULNERABILITY_DURATION > 0, 'INVULNERABILITY_DURATION should be positive');
        });

        test.it('should have start position defined', () => {
            test.assertTrue(Player.startPosition !== undefined, 'should have startPosition');
        });

        test.it('should have start position', () => {
            test.assertTrue(Player.startPosition.x > 0, 'start x should be positive');
            test.assertTrue(Player.startPosition.z > 0, 'start z should be positive');
            test.assertEqual(Player.startPosition.rotation, 0, 'start rotation should be 0');
        });

        test.it('should have helper methods', () => {
            test.assertTrue(typeof Player.getMovement === 'function', 'getMovement should be a function');
            test.assertTrue(typeof Player.getHealth === 'function', 'getHealth should be a function');
            test.assertTrue(typeof Player.getVisual === 'function', 'getVisual should be a function');
            test.assertEqual(Player.getMovement('SPEED'), Player.movement.SPEED, 'getMovement should return correct value');
            test.assertEqual(Player.getHealth('MAX'), Player.health.MAX, 'getHealth should return correct value');
        });
    });

    // ==========================================
    // PLAYER SYSTEM TESTS
    // ==========================================

    test.describe('Player System - Initialization', () => {
        test.it('should initialize with player data', () => {
            PlayerOrchestrator.init(Player);
            test.assertEqual(PlayerOrchestrator.playerData, Player, 'playerData should be set');
        });

        test.it('should reset to starting position', () => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.reset();
            test.assertEqual(PlayerOrchestrator.position.x, Player.startPosition.x, 'x should match start position');
            test.assertEqual(PlayerOrchestrator.position.z, Player.startPosition.z, 'z should match start position');
            test.assertEqual(PlayerOrchestrator.rotation, Player.startPosition.rotation, 'rotation should match start');
        });

        test.it('should reset health to max', () => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.health = 50;
            PlayerOrchestrator.reset();
            test.assertEqual(PlayerOrchestrator.health, Player.health.MAX, 'health should reset to max');
        });

        test.it('should reset speed and turn rate', () => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.speed = 5;
            PlayerOrchestrator.currentTurnRate = 1;
            PlayerOrchestrator.reset();
            test.assertEqual(PlayerOrchestrator.speed, 0, 'speed should reset to 0');
            test.assertEqual(PlayerOrchestrator.currentTurnRate, 0, 'turn rate should reset to 0');
        });
    });

    test.describe('Player System - Movement', () => {
        test.beforeEach(() => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.reset();
        });

        test.it('should update turning', () => {
            const initialRotation = PlayerOrchestrator.rotation;
            PlayerOrchestrator.updateTurning(true, false, 0.1); // Turn left for 0.1s
            test.assertTrue(PlayerOrchestrator.rotation > initialRotation, 'rotation should increase when turning left');
        });

        test.it('should update speed with forward input', () => {
            PlayerOrchestrator.updateSpeed(true, false, 0.1); // Accelerate for 0.1s
            test.assertTrue(PlayerOrchestrator.speed > 0, 'speed should increase with forward input');
        });

        test.it('should decelerate with backward input', () => {
            PlayerOrchestrator.speed = 5;
            PlayerOrchestrator.updateSpeed(false, true, 0.1); // Brake for 0.1s
            test.assertTrue(PlayerOrchestrator.speed < 5, 'speed should decrease with backward input');
        });

        test.it('should apply friction when no input', () => {
            PlayerOrchestrator.speed = 5;
            PlayerOrchestrator.updateSpeed(false, false, 0.1); // No input for 0.1s
            test.assertTrue(PlayerOrchestrator.speed < 5, 'speed should decrease with friction');
        });

        test.it('should clamp speed to max', () => {
            PlayerOrchestrator.speed = 100;
            PlayerOrchestrator.updateSpeed(true, false, 0.1);
            const config = PlayerOrchestrator.getMovementConfig();
            test.assertTrue(PlayerOrchestrator.speed <= config.MAX_SPEED, 'speed should be clamped to max');
        });

        test.it('should clamp speed to reverse max', () => {
            PlayerOrchestrator.speed = -100;
            PlayerOrchestrator.updateSpeed(false, true, 0.1);
            const config = PlayerOrchestrator.getMovementConfig();
            test.assertTrue(PlayerOrchestrator.speed >= -config.REVERSE_SPEED, 'speed should be clamped to reverse max');
        });

        test.it('should calculate velocity from rotation and speed', () => {
            PlayerOrchestrator.speed = 10;
            PlayerOrchestrator.rotation = 0;
            const velocity = PlayerOrchestrator.getVelocity();
            test.assertTrue(velocity.z < 0, 'velocity z should be negative (forward)');
            test.assertEqual(velocity.x, 0, 'velocity x should be 0 when facing forward');
        });

        test.it('should calculate new position', () => {
            PlayerOrchestrator.speed = 10;
            PlayerOrchestrator.rotation = 0;
            const oldZ = PlayerOrchestrator.position.z;
            const newPos = PlayerOrchestrator.calculateNewPosition(0.1);
            test.assertTrue(newPos.z < oldZ, 'new z position should be less (moving forward)');
        });
    });

    test.describe('Player System - Collision', () => {
        test.beforeEach(() => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.reset();
        });

        test.it('should apply movement when no collision', () => {
            const newPos = { x: 50, z: 80 };
            const noCollision = { blocked: false, blockedX: false, blockedZ: false };
            PlayerOrchestrator.applyMovement(newPos, noCollision);
            test.assertEqual(PlayerOrchestrator.position.x, 50, 'x should update');
            test.assertEqual(PlayerOrchestrator.position.z, 80, 'z should update');
        });

        test.it('should block x movement on x collision', () => {
            const oldX = PlayerOrchestrator.position.x;
            const newPos = { x: 50, z: 80 };
            const collisionX = { blocked: true, blockedX: true, blockedZ: false };
            PlayerOrchestrator.applyMovement(newPos, collisionX);
            test.assertEqual(PlayerOrchestrator.position.x, oldX, 'x should not change');
            test.assertEqual(PlayerOrchestrator.position.z, 80, 'z should update');
        });

        test.it('should block z movement on z collision', () => {
            const oldZ = PlayerOrchestrator.position.z;
            const newPos = { x: 50, z: 80 };
            const collisionZ = { blocked: true, blockedX: false, blockedZ: true };
            PlayerOrchestrator.applyMovement(newPos, collisionZ);
            test.assertEqual(PlayerOrchestrator.position.x, 50, 'x should update');
            test.assertEqual(PlayerOrchestrator.position.z, oldZ, 'z should not change');
        });

        test.it('should trigger wall bump on collision with speed', () => {
            PlayerOrchestrator.speed = 8;
            const newPos = { x: 50, z: 80 };
            const collision = { blocked: true, blockedX: true, blockedZ: false };
            PlayerOrchestrator.applyMovement(newPos, collision);
            test.assertTrue(PlayerOrchestrator.wallBumpIntensity > 0, 'wall bump should be triggered');
            test.assertTrue(PlayerOrchestrator.speed < 8, 'speed should be reduced on impact');
        });

        test.it('should decay wall bump', () => {
            PlayerOrchestrator.wallBumpIntensity = 0.5;
            PlayerOrchestrator.updateWallBump();
            test.assertTrue(PlayerOrchestrator.wallBumpIntensity < 0.5, 'bump intensity should decay');
        });
    });

    test.describe('Player System - Health', () => {
        test.beforeEach(() => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.reset();
        });

        test.it('should return correct health', () => {
            test.assertEqual(PlayerOrchestrator.getHealth(), Player.health.MAX, 'health should be max');
        });

        test.it('should damage player', () => {
            PlayerOrchestrator.damage(20);
            test.assertEqual(PlayerOrchestrator.health, 80, 'health should decrease by damage amount');
        });

        test.it('should not damage when invulnerable', () => {
            PlayerOrchestrator.isInvulnerable = true;
            const result = PlayerOrchestrator.damage(20);
            test.assertFalse(result, 'damage should return false when invulnerable');
            test.assertEqual(PlayerOrchestrator.health, Player.health.MAX, 'health should not change');
        });

        test.it('should set invulnerability on damage', () => {
            PlayerOrchestrator.damage(20);
            test.assertTrue(PlayerOrchestrator.isInvulnerable, 'should be invulnerable after damage');
            test.assertTrue(PlayerOrchestrator.lastDamageTime > 0, 'lastDamageTime should be set');
        });

        test.it('should not go below 0 health', () => {
            PlayerOrchestrator.damage(200);
            test.assertEqual(PlayerOrchestrator.health, 0, 'health should be clamped to 0');
        });

        test.it('should detect death', () => {
            test.assertFalse(PlayerOrchestrator.isDead(), 'should not be dead at max health');
            PlayerOrchestrator.health = 0;
            test.assertTrue(PlayerOrchestrator.isDead(), 'should be dead at 0 health');
        });

        test.it('should detect low health', () => {
            test.assertFalse(PlayerOrchestrator.isLowHealth(), 'should not be low health at max');
            PlayerOrchestrator.health = 25;
            test.assertTrue(PlayerOrchestrator.isLowHealth(), 'should be low health at 25');
        });

        test.it('should damage from enemy', () => {
            PlayerOrchestrator.damageFromEnemy();
            test.assertEqual(PlayerOrchestrator.health, Player.health.MAX - Player.health.ENEMY_DAMAGE, 'should take enemy damage');
        });

        test.it('should damage from obstacle', () => {
            PlayerOrchestrator.damageFromObstacle();
            test.assertEqual(PlayerOrchestrator.health, Player.health.MAX - Player.health.OBSTACLE_DAMAGE, 'should take obstacle damage');
        });

        test.it('should heal player', () => {
            PlayerOrchestrator.health = 50;
            PlayerOrchestrator.heal(30);
            test.assertEqual(PlayerOrchestrator.health, 80, 'health should increase');
        });

        test.it('should not heal above max', () => {
            PlayerOrchestrator.heal(50);
            test.assertEqual(PlayerOrchestrator.health, Player.health.MAX, 'health should be clamped to max');
        });

        test.it('should calculate health percent', () => {
            test.assertEqual(PlayerOrchestrator.getHealthPercent(), 100, 'health percent should be 100 at max');
            PlayerOrchestrator.health = 50;
            test.assertEqual(PlayerOrchestrator.getHealthPercent(), 50, 'health percent should be 50');
        });
    });

    test.describe('Player System - Camera', () => {
        test.beforeEach(() => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.reset();
        });

        test.it('should return camera state', () => {
            const cameraState = PlayerOrchestrator.getCameraState();
            test.assertTrue(cameraState.x !== undefined, 'should have x');
            test.assertTrue(cameraState.y !== undefined, 'should have y');
            test.assertTrue(cameraState.z !== undefined, 'should have z');
            test.assertTrue(cameraState.rotationX !== undefined, 'should have rotationX');
            test.assertTrue(cameraState.rotationY !== undefined, 'should have rotationY');
            test.assertTrue(cameraState.rotationZ !== undefined, 'should have rotationZ');
        });

        test.it('should include bump offset in camera state', () => {
            PlayerOrchestrator.wallBumpIntensity = 1.0;
            PlayerOrchestrator.wallBumpDirection = { x: 1, z: 0 };
            const cameraState = PlayerOrchestrator.getCameraState();
            test.assertTrue(cameraState.x !== PlayerOrchestrator.position.x, 'camera x should include bump offset');
        });
    });

    test.describe('Player System - Getters/Setters', () => {
        test.beforeEach(() => {
            PlayerOrchestrator.init(Player);
            PlayerOrchestrator.reset();
        });

        test.it('should get position', () => {
            const pos = PlayerOrchestrator.getPosition();
            test.assertEqual(pos.x, PlayerOrchestrator.position.x, 'x should match');
            test.assertEqual(pos.z, PlayerOrchestrator.position.z, 'z should match');
        });

        test.it('should set position', () => {
            PlayerOrchestrator.setPosition(100, 200);
            test.assertEqual(PlayerOrchestrator.position.x, 100, 'x should be set');
            test.assertEqual(PlayerOrchestrator.position.z, 200, 'z should be set');
        });

        test.it('should get/set rotation', () => {
            PlayerOrchestrator.setRotation(1.5);
            test.assertEqual(PlayerOrchestrator.getRotation(), 1.5, 'rotation should match');
        });

        test.it('should get speed', () => {
            PlayerOrchestrator.speed = 5;
            test.assertEqual(PlayerOrchestrator.getSpeed(), 5, 'speed should match');
        });

        test.it('should get lean angle', () => {
            PlayerOrchestrator.currentLeanAngle = 0.1;
            test.assertEqual(PlayerOrchestrator.getLeanAngle(), 0.1, 'lean angle should match');
        });
    });

    // ==========================================
    // PLAYER THEME TESTS
    // ==========================================

    test.describe('Player Theme', () => {
        test.it('should have cart colors', () => {
            test.assertTrue(PlayerTheme.cart !== undefined, 'should have cart colors');
            test.assertTrue(PlayerTheme.cart.chrome !== undefined, 'should have chrome color');
            test.assertTrue(PlayerTheme.cart.redPlastic !== undefined, 'should have redPlastic color');
        });

        test.it('should have child colors', () => {
            test.assertTrue(PlayerTheme.child !== undefined, 'should have child colors');
            test.assertTrue(PlayerTheme.child.skin !== undefined, 'should have skin color');
            test.assertTrue(PlayerTheme.child.shirt !== undefined, 'should have shirt color');
        });

        test.it('should have slingshot colors', () => {
            test.assertTrue(PlayerTheme.slingshot !== undefined, 'should have slingshot colors');
            test.assertTrue(PlayerTheme.slingshot.wood !== undefined, 'should have wood color');
        });

        test.it('should get all colors as flat object', () => {
            const colors = PlayerTheme.getAllColors();
            test.assertTrue(colors.chrome !== undefined, 'should have chrome');
            test.assertTrue(colors.skin !== undefined, 'should have skin');
            test.assertTrue(colors.wood !== undefined, 'should have wood');
        });
    });

    // ==========================================
    // PLAYER MESH TESTS
    // ==========================================

    test.describe('Player Mesh', () => {
        test.it('should have createPlayerCart method', () => {
            test.assertTrue(typeof PlayerMesh.createPlayerCart === 'function', 'createPlayerCart should be a function');
        });

        test.it('should have updateCartLean method', () => {
            test.assertTrue(typeof PlayerMesh.updateCartLean === 'function', 'updateCartLean should be a function');
        });

        // Mesh creation tests require THREE.js - run in browser context
        test.it('should create player cart with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const result = PlayerMesh.createPlayerCart(THREE, PlayerTheme.getAllColors());
            test.assertTrue(result.cart instanceof THREE.Group, 'cart should be a THREE.Group');
            test.assertTrue(result.cart.children.length > 0, 'cart should have children');
        });

        // Note: child and slingshot tests removed - FPS-only mode (commit f3930c7)
        // The game no longer creates third-person child character or slingshot meshes

        test.it('should update cart lean with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const result = PlayerMesh.createPlayerCart(THREE, PlayerTheme.getAllColors());
            PlayerMesh.updateCartLean(result.cart, 0.1);
            test.assertEqual(result.cart.rotation.z, 0.1, 'cart should lean correctly');
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {}, skip: () => {} });
