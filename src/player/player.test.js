// ============================================
// PLAYER DOMAIN - Unit Tests
// ============================================
// Tests for Player data, PlayerVisual, and PlayerSystem

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
            PlayerSystem.init(Player);
            test.assertEqual(PlayerSystem.playerData, Player, 'playerData should be set');
        });

        test.it('should reset to starting position', () => {
            PlayerSystem.init(Player);
            PlayerSystem.reset();
            test.assertEqual(PlayerSystem.position.x, Player.startPosition.x, 'x should match start position');
            test.assertEqual(PlayerSystem.position.z, Player.startPosition.z, 'z should match start position');
            test.assertEqual(PlayerSystem.rotation, Player.startPosition.rotation, 'rotation should match start');
        });

        test.it('should reset health to max', () => {
            PlayerSystem.init(Player);
            PlayerSystem.health = 50;
            PlayerSystem.reset();
            test.assertEqual(PlayerSystem.health, Player.health.MAX, 'health should reset to max');
        });

        test.it('should reset speed and turn rate', () => {
            PlayerSystem.init(Player);
            PlayerSystem.speed = 5;
            PlayerSystem.currentTurnRate = 1;
            PlayerSystem.reset();
            test.assertEqual(PlayerSystem.speed, 0, 'speed should reset to 0');
            test.assertEqual(PlayerSystem.currentTurnRate, 0, 'turn rate should reset to 0');
        });
    });

    test.describe('Player System - Movement', () => {
        test.beforeEach(() => {
            PlayerSystem.init(Player);
            PlayerSystem.reset();
        });

        test.it('should update turning', () => {
            const initialRotation = PlayerSystem.rotation;
            PlayerSystem.updateTurning(true, false, 0.1); // Turn left for 0.1s
            test.assertTrue(PlayerSystem.rotation > initialRotation, 'rotation should increase when turning left');
        });

        test.it('should update speed with forward input', () => {
            PlayerSystem.updateSpeed(true, false, 0.1); // Accelerate for 0.1s
            test.assertTrue(PlayerSystem.speed > 0, 'speed should increase with forward input');
        });

        test.it('should decelerate with backward input', () => {
            PlayerSystem.speed = 5;
            PlayerSystem.updateSpeed(false, true, 0.1); // Brake for 0.1s
            test.assertTrue(PlayerSystem.speed < 5, 'speed should decrease with backward input');
        });

        test.it('should apply friction when no input', () => {
            PlayerSystem.speed = 5;
            PlayerSystem.updateSpeed(false, false, 0.1); // No input for 0.1s
            test.assertTrue(PlayerSystem.speed < 5, 'speed should decrease with friction');
        });

        test.it('should clamp speed to max', () => {
            PlayerSystem.speed = 100;
            PlayerSystem.updateSpeed(true, false, 0.1);
            const config = PlayerSystem.getMovementConfig();
            test.assertTrue(PlayerSystem.speed <= config.MAX_SPEED, 'speed should be clamped to max');
        });

        test.it('should clamp speed to reverse max', () => {
            PlayerSystem.speed = -100;
            PlayerSystem.updateSpeed(false, true, 0.1);
            const config = PlayerSystem.getMovementConfig();
            test.assertTrue(PlayerSystem.speed >= -config.REVERSE_SPEED, 'speed should be clamped to reverse max');
        });

        test.it('should calculate velocity from rotation and speed', () => {
            PlayerSystem.speed = 10;
            PlayerSystem.rotation = 0;
            const velocity = PlayerSystem.getVelocity();
            test.assertTrue(velocity.z < 0, 'velocity z should be negative (forward)');
            test.assertEqual(velocity.x, 0, 'velocity x should be 0 when facing forward');
        });

        test.it('should calculate new position', () => {
            PlayerSystem.speed = 10;
            PlayerSystem.rotation = 0;
            const oldZ = PlayerSystem.position.z;
            const newPos = PlayerSystem.calculateNewPosition(0.1);
            test.assertTrue(newPos.z < oldZ, 'new z position should be less (moving forward)');
        });
    });

    test.describe('Player System - Collision', () => {
        test.beforeEach(() => {
            PlayerSystem.init(Player);
            PlayerSystem.reset();
        });

        test.it('should apply movement when no collision', () => {
            const newPos = { x: 50, z: 80 };
            const noCollision = { blocked: false, blockedX: false, blockedZ: false };
            PlayerSystem.applyMovement(newPos, noCollision);
            test.assertEqual(PlayerSystem.position.x, 50, 'x should update');
            test.assertEqual(PlayerSystem.position.z, 80, 'z should update');
        });

        test.it('should block x movement on x collision', () => {
            const oldX = PlayerSystem.position.x;
            const newPos = { x: 50, z: 80 };
            const collisionX = { blocked: true, blockedX: true, blockedZ: false };
            PlayerSystem.applyMovement(newPos, collisionX);
            test.assertEqual(PlayerSystem.position.x, oldX, 'x should not change');
            test.assertEqual(PlayerSystem.position.z, 80, 'z should update');
        });

        test.it('should block z movement on z collision', () => {
            const oldZ = PlayerSystem.position.z;
            const newPos = { x: 50, z: 80 };
            const collisionZ = { blocked: true, blockedX: false, blockedZ: true };
            PlayerSystem.applyMovement(newPos, collisionZ);
            test.assertEqual(PlayerSystem.position.x, 50, 'x should update');
            test.assertEqual(PlayerSystem.position.z, oldZ, 'z should not change');
        });

        test.it('should trigger wall bump on collision with speed', () => {
            PlayerSystem.speed = 8;
            const newPos = { x: 50, z: 80 };
            const collision = { blocked: true, blockedX: true, blockedZ: false };
            PlayerSystem.applyMovement(newPos, collision);
            test.assertTrue(PlayerSystem.wallBumpIntensity > 0, 'wall bump should be triggered');
            test.assertTrue(PlayerSystem.speed < 8, 'speed should be reduced on impact');
        });

        test.it('should decay wall bump', () => {
            PlayerSystem.wallBumpIntensity = 0.5;
            PlayerSystem.updateWallBump();
            test.assertTrue(PlayerSystem.wallBumpIntensity < 0.5, 'bump intensity should decay');
        });
    });

    test.describe('Player System - Health', () => {
        test.beforeEach(() => {
            PlayerSystem.init(Player);
            PlayerSystem.reset();
        });

        test.it('should return correct health', () => {
            test.assertEqual(PlayerSystem.getHealth(), Player.health.MAX, 'health should be max');
        });

        test.it('should damage player', () => {
            PlayerSystem.damage(20);
            test.assertEqual(PlayerSystem.health, 80, 'health should decrease by damage amount');
        });

        test.it('should not damage when invulnerable', () => {
            PlayerSystem.isInvulnerable = true;
            const result = PlayerSystem.damage(20);
            test.assertFalse(result, 'damage should return false when invulnerable');
            test.assertEqual(PlayerSystem.health, Player.health.MAX, 'health should not change');
        });

        test.it('should set invulnerability on damage', () => {
            PlayerSystem.damage(20);
            test.assertTrue(PlayerSystem.isInvulnerable, 'should be invulnerable after damage');
            test.assertTrue(PlayerSystem.lastDamageTime > 0, 'lastDamageTime should be set');
        });

        test.it('should not go below 0 health', () => {
            PlayerSystem.damage(200);
            test.assertEqual(PlayerSystem.health, 0, 'health should be clamped to 0');
        });

        test.it('should detect death', () => {
            test.assertFalse(PlayerSystem.isDead(), 'should not be dead at max health');
            PlayerSystem.health = 0;
            test.assertTrue(PlayerSystem.isDead(), 'should be dead at 0 health');
        });

        test.it('should detect low health', () => {
            test.assertFalse(PlayerSystem.isLowHealth(), 'should not be low health at max');
            PlayerSystem.health = 25;
            test.assertTrue(PlayerSystem.isLowHealth(), 'should be low health at 25');
        });

        test.it('should damage from enemy', () => {
            PlayerSystem.damageFromEnemy();
            test.assertEqual(PlayerSystem.health, Player.health.MAX - Player.health.ENEMY_DAMAGE, 'should take enemy damage');
        });

        test.it('should damage from obstacle', () => {
            PlayerSystem.damageFromObstacle();
            test.assertEqual(PlayerSystem.health, Player.health.MAX - Player.health.OBSTACLE_DAMAGE, 'should take obstacle damage');
        });

        test.it('should heal player', () => {
            PlayerSystem.health = 50;
            PlayerSystem.heal(30);
            test.assertEqual(PlayerSystem.health, 80, 'health should increase');
        });

        test.it('should not heal above max', () => {
            PlayerSystem.heal(50);
            test.assertEqual(PlayerSystem.health, Player.health.MAX, 'health should be clamped to max');
        });

        test.it('should calculate health percent', () => {
            test.assertEqual(PlayerSystem.getHealthPercent(), 100, 'health percent should be 100 at max');
            PlayerSystem.health = 50;
            test.assertEqual(PlayerSystem.getHealthPercent(), 50, 'health percent should be 50');
        });
    });

    test.describe('Player System - Camera', () => {
        test.beforeEach(() => {
            PlayerSystem.init(Player);
            PlayerSystem.reset();
        });

        test.it('should return camera state', () => {
            const cameraState = PlayerSystem.getCameraState();
            test.assertTrue(cameraState.x !== undefined, 'should have x');
            test.assertTrue(cameraState.y !== undefined, 'should have y');
            test.assertTrue(cameraState.z !== undefined, 'should have z');
            test.assertTrue(cameraState.rotationX !== undefined, 'should have rotationX');
            test.assertTrue(cameraState.rotationY !== undefined, 'should have rotationY');
            test.assertTrue(cameraState.rotationZ !== undefined, 'should have rotationZ');
        });

        test.it('should include bump offset in camera state', () => {
            PlayerSystem.wallBumpIntensity = 1.0;
            PlayerSystem.wallBumpDirection = { x: 1, z: 0 };
            const cameraState = PlayerSystem.getCameraState();
            test.assertTrue(cameraState.x !== PlayerSystem.position.x, 'camera x should include bump offset');
        });
    });

    test.describe('Player System - Getters/Setters', () => {
        test.beforeEach(() => {
            PlayerSystem.init(Player);
            PlayerSystem.reset();
        });

        test.it('should get position', () => {
            const pos = PlayerSystem.getPosition();
            test.assertEqual(pos.x, PlayerSystem.position.x, 'x should match');
            test.assertEqual(pos.z, PlayerSystem.position.z, 'z should match');
        });

        test.it('should set position', () => {
            PlayerSystem.setPosition(100, 200);
            test.assertEqual(PlayerSystem.position.x, 100, 'x should be set');
            test.assertEqual(PlayerSystem.position.z, 200, 'z should be set');
        });

        test.it('should get/set rotation', () => {
            PlayerSystem.setRotation(1.5);
            test.assertEqual(PlayerSystem.getRotation(), 1.5, 'rotation should match');
        });

        test.it('should get speed', () => {
            PlayerSystem.speed = 5;
            test.assertEqual(PlayerSystem.getSpeed(), 5, 'speed should match');
        });

        test.it('should get lean angle', () => {
            PlayerSystem.currentLeanAngle = 0.1;
            test.assertEqual(PlayerSystem.getLeanAngle(), 0.1, 'lean angle should match');
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

        test.it('should create child character with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const result = PlayerMesh.createPlayerCart(THREE, PlayerTheme.getAllColors());
            test.assertTrue(result.child instanceof THREE.Group, 'child should be a THREE.Group');
            test.assertTrue(result.child.children.length > 0, 'child should have body parts');
        });

        test.it('should create slingshot with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const result = PlayerMesh.createPlayerCart(THREE, PlayerTheme.getAllColors());
            test.assertTrue(result.slingshot instanceof THREE.Group, 'slingshot should be a THREE.Group');
            test.assertTrue(result.slingshot.children.length > 0, 'slingshot should have components');
        });

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
