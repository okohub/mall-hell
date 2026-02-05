// ============================================
// ENGINE TESTS - Domain Unit Tests
// ============================================
// Tests for all engine components.
// Requires TestFramework to be available globally.

(function() {
    const test = window.TestFramework;
    if (!test) {
        console.error('TestFramework not found');
        return;
    }

    // ==========================================
    // ENGINE CONSTANTS TESTS
    // ==========================================

    test.describe('Engine Constants', () => {
        test.it('should have all game states defined', () => {
            test.assertEqual(Engine.STATES.MENU, 'MENU');
            test.assertEqual(Engine.STATES.PLAYING, 'PLAYING');
            test.assertEqual(Engine.STATES.PAUSED, 'PAUSED');
            test.assertEqual(Engine.STATES.GAME_OVER, 'GAME_OVER');
        });

        test.it('should have valid state transitions', () => {
            test.assertEqual(Engine.isValidTransition('MENU', 'PLAYING'), true, 'MENU -> PLAYING');
            test.assertEqual(Engine.isValidTransition('PLAYING', 'PAUSED'), true, 'PLAYING -> PAUSED');
            test.assertEqual(Engine.isValidTransition('PLAYING', 'GAME_OVER'), true, 'PLAYING -> GAME_OVER');
            test.assertEqual(Engine.isValidTransition('PAUSED', 'PLAYING'), true, 'PAUSED -> PLAYING');
            test.assertEqual(Engine.isValidTransition('PAUSED', 'MENU'), true, 'PAUSED -> MENU');
            test.assertEqual(Engine.isValidTransition('GAME_OVER', 'PLAYING'), true, 'GAME_OVER -> PLAYING');
            test.assertEqual(Engine.isValidTransition('GAME_OVER', 'MENU'), true, 'GAME_OVER -> MENU');
        });

        test.it('should reject invalid state transitions', () => {
            test.assertEqual(Engine.isValidTransition('MENU', 'PAUSED'), false);
            test.assertEqual(Engine.isValidTransition('MENU', 'GAME_OVER'), false);
            test.assertEqual(Engine.isValidTransition('PLAYING', 'MENU'), false);
        });

        test.it('should have default key bindings', () => {
            test.assertEqual(Engine.getActionForKey('KeyW'), 'forward');
            test.assertEqual(Engine.getActionForKey('KeyS'), 'backward');
            test.assertEqual(Engine.getActionForKey('KeyA'), 'turnLeft');
            test.assertEqual(Engine.getActionForKey('KeyD'), 'turnRight');
            test.assertEqual(Engine.getActionForKey('Space'), 'fire');
            test.assertEqual(Engine.getActionForKey('Escape'), 'pause');
            test.assertEqual(Engine.getActionForKey('KeyP'), 'freeze');
        });

        test.it('should have all actions defined', () => {
            const actions = Engine.getAllActions();
            test.assertEqual(actions.includes('forward'), true);
            test.assertEqual(actions.includes('backward'), true);
            test.assertEqual(actions.includes('turnLeft'), true);
            test.assertEqual(actions.includes('turnRight'), true);
            test.assertEqual(actions.includes('fire'), true);
            test.assertEqual(actions.includes('pause'), true);
            test.assertEqual(actions.includes('freeze'), true);
        });
    });

    // ==========================================
    // COLLISION TESTS
    // ==========================================

    test.describe('Engine: Collision Detection', () => {
        test.it('should keep projectile enemy-hit defaults unchanged', () => {
            test.assertEqual(CollisionOrchestrator.config.enemyHitboxYOffset, 1.2);
            test.assertEqual(CollisionOrchestrator.config.enemyHitRadius, 2.5);
        });

        test.it('should detect 2D distance collision', () => {
            const pos1 = { x: 0, z: 0 };
            const pos2 = { x: 3, z: 4 }; // Distance = 5

            test.assertEqual(CollisionOrchestrator.checkDistance2D(pos1, pos2, 6), true, 'Within radius');
            test.assertEqual(CollisionOrchestrator.checkDistance2D(pos1, pos2, 5), true, 'At radius');
            test.assertEqual(CollisionOrchestrator.checkDistance2D(pos1, pos2, 4), false, 'Outside radius');
        });

        test.it('should calculate 2D distance correctly', () => {
            const pos1 = { x: 0, z: 0 };
            const pos2 = { x: 3, z: 4 };

            test.assertCloseTo(CollisionOrchestrator.distance2D(pos1, pos2), 5, 0.001);
        });

        test.it('should detect 3D distance collision', () => {
            const pos1 = { x: 0, y: 0, z: 0 };
            const pos2 = { x: 0, y: 3, z: 4 }; // Distance = 5

            test.assertEqual(CollisionOrchestrator.checkDistance3D(pos1, pos2, 6), true);
            test.assertEqual(CollisionOrchestrator.checkDistance3D(pos1, pos2, 4), false);
        });

        test.it('should detect AABB collision', () => {
            const box1 = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 2, y: 2, z: 2 }
            };
            const box2 = {
                min: { x: 1, y: 1, z: 1 },
                max: { x: 3, y: 3, z: 3 }
            };
            const box3 = {
                min: { x: 5, y: 5, z: 5 },
                max: { x: 6, y: 6, z: 6 }
            };

            test.assertEqual(CollisionOrchestrator.checkAABB(box1, box2), true, 'Overlapping');
            test.assertEqual(CollisionOrchestrator.checkAABB(box1, box3), false, 'Not overlapping');
        });

        test.it('should create AABB from center and half-extents', () => {
            const aabb = CollisionOrchestrator.createAABB(
                { x: 5, y: 5, z: 5 },
                { x: 1, y: 1, z: 1 }
            );

            test.assertEqual(aabb.min.x, 4);
            test.assertEqual(aabb.min.y, 4);
            test.assertEqual(aabb.min.z, 4);
            test.assertEqual(aabb.max.x, 6);
            test.assertEqual(aabb.max.y, 6);
            test.assertEqual(aabb.max.z, 6);
        });

        test.it('should test point in AABB', () => {
            const box = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 10, y: 10, z: 10 }
            };

            test.assertEqual(CollisionOrchestrator.pointInAABB({ x: 5, y: 5, z: 5 }, box), true, 'Inside');
            test.assertEqual(CollisionOrchestrator.pointInAABB({ x: 0, y: 0, z: 0 }, box), true, 'On edge');
            test.assertEqual(CollisionOrchestrator.pointInAABB({ x: 15, y: 5, z: 5 }, box), false, 'Outside');
        });

        test.it('should perform sweep sphere test', () => {
            const prev = { x: 0, y: 0, z: 0 };
            const curr = { x: 10, y: 0, z: 0 };
            const target = { x: 5, y: 0, z: 0 };

            const hit = CollisionOrchestrator.sweepSphere(prev, curr, target, 1);
            test.assertEqual(hit !== null, true, 'Should hit');
            test.assertCloseTo(hit.t, 0.4, 0.1, 'Hit at ~40% along path');
        });

        test.it('should check obstacle collision - blocked', () => {
            const obstacles = [{
                position: { x: 5, y: 0, z: 0 },
                userData: { active: true, hit: false, collisionRadius: 2 }
            }];
            // Moving towards obstacle
            const result = CollisionOrchestrator.checkObstacleCollision(4, 0, 0, 0, obstacles, 1.5);
            test.assertTrue(result.blockedX, 'Should block X movement towards obstacle');
        });

        test.it('should check obstacle collision - not blocked when far', () => {
            const obstacles = [{
                position: { x: 20, y: 0, z: 0 },
                userData: { active: true, hit: false, collisionRadius: 2 }
            }];
            const result = CollisionOrchestrator.checkObstacleCollision(5, 0, 0, 0, obstacles, 1.5);
            test.assertFalse(result.blocked, 'Should not block when far from obstacle');
        });

        test.it('should ignore inactive obstacles', () => {
            const obstacles = [{
                position: { x: 2, y: 0, z: 0 },
                userData: { active: false, hit: false, collisionRadius: 2 }
            }];
            const result = CollisionOrchestrator.checkObstacleCollision(2, 0, 0, 0, obstacles, 1.5);
            test.assertFalse(result.blocked, 'Should ignore inactive obstacles');
        });

        test.it('should ignore hit obstacles', () => {
            const obstacles = [{
                position: { x: 2, y: 0, z: 0 },
                userData: { active: true, hit: true, collisionRadius: 2 }
            }];
            const result = CollisionOrchestrator.checkObstacleCollision(2, 0, 0, 0, obstacles, 1.5);
            test.assertFalse(result.blocked, 'Should ignore hit obstacles');
        });

        test.it('should check shelf collision - blocked', () => {
            const shelves = [{
                position: { x: 5, y: 0, z: 0 },
                userData: { width: 4, depth: 2 }
            }];
            // Moving into shelf area
            const result = CollisionOrchestrator.checkShelfCollision(4, 0, 0, 0, shelves, 1.2);
            test.assertTrue(result.blockedX, 'Should block X movement into shelf');
        });

        test.it('should check shelf collision - not blocked when outside', () => {
            const shelves = [{
                position: { x: 20, y: 0, z: 0 },
                userData: { width: 4, depth: 2 }
            }];
            const result = CollisionOrchestrator.checkShelfCollision(5, 0, 0, 0, shelves, 1.2);
            test.assertFalse(result.blocked, 'Should not block when outside shelf');
        });

        test.it('should check all collisions combined', () => {
            const obstacles = [{
                position: { x: 5, y: 0, z: 0 },
                userData: { active: true, hit: false, collisionRadius: 2 }
            }];
            const shelves = [{
                position: { x: 0, y: 0, z: 10 },
                userData: { width: 4, depth: 2 }
            }];
            // Mock grid system that allows movement
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            // Test obstacle blocking
            const result1 = CollisionOrchestrator.checkAllCollisions(4, 0, 0, 0, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves,
                playerRadius: 1.5
            });
            test.assertTrue(result1.blockedX, 'Should be blocked by obstacle');

            // Test shelf blocking
            const result2 = CollisionOrchestrator.checkAllCollisions(0, 9, 0, 0, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves,
                playerRadius: 1.2
            });
            test.assertTrue(result2.blockedZ, 'Should be blocked by shelf');
        });

        test.it('should handle null obstacles and shelves in checkAllCollisions', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const result = CollisionOrchestrator.checkAllCollisions(5, 5, 0, 0, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles: null,
                shelves: null,
                playerRadius: 1.2
            });
            test.assertFalse(result.blocked, 'Should not crash with null arrays');
        });

        test.it('should shrink doorway pass range by collision margin in wall checks', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['east']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 8 };

            const centerDoorResult = CollisionOrchestrator.checkWallCollision(
                27.2, 15.4, 26.8, 15.4, mockGrid, mockRoomConfig, 3
            );
            const edgeDoorResult = CollisionOrchestrator.checkWallCollision(
                27.2, 17.5, 26.8, 17.5, mockGrid, mockRoomConfig, 3
            );

            test.assertFalse(centerDoorResult.blockedX, 'Center of doorway should remain passable');
            test.assertTrue(edgeDoorResult.blockedX, 'Doorway edge should block when radius would clip wall');
        });

        test.it('should clamp doorway edge positions while allowing center doorway passage', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['east']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 8 };

            const edgePos = { x: 29, z: 17.5 };
            const edgeClamped = CollisionOrchestrator.clampToRoomBounds(edgePos, mockGrid, mockRoomConfig, 3);
            test.assertTrue(edgeClamped, 'Edge doorway position should clamp to room bounds');
            test.assertCloseTo(edgePos.x, 27, 0.001);

            const centerPos = { x: 29, z: 15.4 };
            const centerClamped = CollisionOrchestrator.clampToRoomBounds(centerPos, mockGrid, mockRoomConfig, 3);
            test.assertFalse(centerClamped, 'Center doorway position should remain unclamped');
            test.assertCloseTo(centerPos.x, 29, 0.001);
        });
    });

    // ==========================================
    // LINE-OF-SIGHT TESTS
    // ==========================================

    test.describe('Engine: Line-of-Sight', () => {
        test.it('lineAABB2D - should detect line intersecting AABB', () => {
            const lineStart = { x: 0, z: 0 };
            const lineEnd = { x: 10, z: 0 };
            const box = { minX: 4, maxX: 6, minZ: -2, maxZ: 2 };

            test.assertTrue(CollisionOrchestrator.lineAABB2D(lineStart, lineEnd, box), 'Line should intersect box');
        });

        test.it('lineAABB2D - should not detect when line misses AABB', () => {
            const lineStart = { x: 0, z: 0 };
            const lineEnd = { x: 10, z: 0 };
            const box = { minX: 4, maxX: 6, minZ: 5, maxZ: 10 };

            test.assertFalse(CollisionOrchestrator.lineAABB2D(lineStart, lineEnd, box), 'Line should miss box');
        });

        test.it('lineAABB2D - should handle diagonal lines', () => {
            const lineStart = { x: 0, z: 0 };
            const lineEnd = { x: 10, z: 10 };
            const box = { minX: 4, maxX: 6, minZ: 4, maxZ: 6 };

            test.assertTrue(CollisionOrchestrator.lineAABB2D(lineStart, lineEnd, box), 'Diagonal should intersect');
        });

        test.it('lineAABB2D - should handle line starting inside AABB', () => {
            const lineStart = { x: 5, z: 0 };
            const lineEnd = { x: 10, z: 0 };
            const box = { minX: 4, maxX: 6, minZ: -2, maxZ: 2 };

            test.assertTrue(CollisionOrchestrator.lineAABB2D(lineStart, lineEnd, box), 'Line starting inside should intersect');
        });

        test.it('lineAABB2D - should handle parallel line not intersecting', () => {
            const lineStart = { x: 0, z: 10 };
            const lineEnd = { x: 10, z: 10 };
            const box = { minX: 4, maxX: 6, minZ: 0, maxZ: 5 };

            test.assertFalse(CollisionOrchestrator.lineAABB2D(lineStart, lineEnd, box), 'Parallel line should not intersect');
        });

        test.it('hasLineOfSightWithPhysicals - should pass with no obstacles', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const result = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 10, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles: [],
                shelves: [],
                playerRadius: 1.2
            });
            test.assertTrue(result, 'Should have LOS with no obstacles');
        });

        test.it('hasLineOfSightWithPhysicals - should be blocked by obstacle in path', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const obstacles = [{
                position: { x: 5, z: 5 },
                userData: { active: true, hit: false, collisionRadius: 2 }
            }];

            const result = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 10, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves: [],
                playerRadius: 1.2
            });
            test.assertFalse(result, 'Should be blocked by obstacle in path');
        });

        test.it('hasLineOfSightWithPhysicals - should not be blocked by obstacle off to side', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const obstacles = [{
                position: { x: 20, z: 5 },
                userData: { active: true, hit: false, collisionRadius: 2 }
            }];

            const result = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 10, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves: [],
                playerRadius: 1.2
            });
            test.assertTrue(result, 'Should not be blocked by distant obstacle');
        });

        test.it('hasLineOfSightWithPhysicals - should be blocked by shelf in path', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const shelves = [{
                position: { x: 5, z: 0 },
                userData: { width: 4, depth: 2 }
            }];

            const result = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 0, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles: [],
                shelves,
                playerRadius: 1.2
            });
            test.assertFalse(result, 'Should be blocked by shelf in path');
        });

        test.it('hasLineOfSightWithPhysicals - should ignore inactive obstacles', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const obstacles = [{
                position: { x: 5, z: 5 },
                userData: { active: false, hit: false, collisionRadius: 2 }
            }];

            const result = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 10, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves: [],
                playerRadius: 1.2
            });
            test.assertTrue(result, 'Should ignore inactive obstacle');
        });

        test.it('hasLineOfSightWithPhysicals - should ignore hit obstacles', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const obstacles = [{
                position: { x: 5, z: 5 },
                userData: { active: true, hit: true, collisionRadius: 2 }
            }];

            const result = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 10, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves: [],
                playerRadius: 1.2
            });
            test.assertTrue(result, 'Should ignore hit obstacle');
        });

        test.it('hasLineOfSightWithPhysicals - should honor dynamic playerRadius margin', () => {
            const mockGrid = {
                getRoomAtWorld: () => ({
                    gridX: 0, gridZ: 0,
                    doors: ['north', 'south', 'east', 'west']
                })
            };
            const mockRoomConfig = { UNIT: 30, DOOR_WIDTH: 6 };

            const obstacles = [{
                position: { x: 5, z: 1.6 },
                userData: { active: true, hit: false, collisionRadius: 1.0 }
            }];

            const narrowResult = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 0, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves: [],
                playerRadius: 0.2
            });
            const wideResult = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 0, {
                gridOrchestrator: mockGrid,
                roomConfig: mockRoomConfig,
                obstacles,
                shelves: [],
                playerRadius: 2.0
            });

            test.assertTrue(narrowResult, 'Narrow collision margin should keep LOS open');
            test.assertFalse(wideResult, 'Wider collision margin should block LOS');
        });

        test.it('hasLineOfSightWithPhysicals - should handle null options gracefully', () => {
            const result = CollisionOrchestrator.hasLineOfSightWithPhysicals(0, 0, 10, 10, {
                gridOrchestrator: null,
                roomConfig: null,
                obstacles: null,
                shelves: null,
                playerRadius: 1.2
            });
            test.assertTrue(result, 'Should pass with null options');
        });
    });

    // ==========================================
    // SPLASH DAMAGE TESTS
    // ==========================================

    test.describe('Engine Collision: Splash Damage', () => {
        test.it('should have processSplashDamage method', () => {
            test.assertTrue(typeof CollisionOrchestrator.processSplashDamage === 'function');
        });

        test.it('should damage enemies within splash radius', () => {
            const impactPos = { x: 10, y: 2, z: 10 };
            const enemies = [
                { position: { x: 12, z: 12 }, userData: { active: true, health: 10 } },  // Within radius
                { position: { x: 100, z: 100 }, userData: { active: true, health: 10 } }  // Outside radius
            ];
            let hitCount = 0;

            CollisionOrchestrator.processSplashDamage(impactPos, 5, 2, enemies, null, (enemy, damage, result) => {
                hitCount++;
            });

            test.assertEqual(hitCount, 1, 'Should hit 1 enemy within radius');
        });

        test.it('should apply falloff damage based on distance', () => {
            const impactPos = { x: 0, y: 2, z: 0 };
            const enemies = [
                { position: { x: 1, z: 0 }, userData: { active: true, health: 10 } },  // Close
                { position: { x: 4, z: 0 }, userData: { active: true, health: 10 } }   // Far
            ];
            const damages = [];

            CollisionOrchestrator.processSplashDamage(impactPos, 5, 2, enemies, null, (enemy, damage, result) => {
                damages.push(damage);
            });

            test.assertEqual(damages.length, 2, 'Should hit both enemies');
            test.assertTrue(damages[0] > damages[1], 'Closer enemy should take more damage');
        });

        test.it('should skip directly hit enemy', () => {
            const impactPos = { x: 10, y: 2, z: 10 };
            const directHit = { position: { x: 10, z: 10 }, userData: { active: true, health: 10 } };
            const enemies = [
                directHit,
                { position: { x: 12, z: 12 }, userData: { active: true, health: 10 } }
            ];
            let hitCount = 0;

            CollisionOrchestrator.processSplashDamage(impactPos, 5, 2, enemies, directHit, (enemy, damage, result) => {
                hitCount++;
            });

            test.assertEqual(hitCount, 1, 'Should skip directly hit enemy');
        });

        test.it('should skip inactive enemies', () => {
            const impactPos = { x: 10, y: 2, z: 10 };
            const enemies = [
                { position: { x: 11, z: 11 }, userData: { active: false, health: 10 } },
                { position: { x: 12, z: 12 }, userData: { active: true, health: 10 } }
            ];
            let hitCount = 0;

            CollisionOrchestrator.processSplashDamage(impactPos, 5, 2, enemies, null, (enemy, damage, result) => {
                hitCount++;
            });

            test.assertEqual(hitCount, 1, 'Should skip inactive enemy');
        });

        test.it('should not damage if splashRadius is 0', () => {
            const impactPos = { x: 10, y: 2, z: 10 };
            const enemies = [
                { position: { x: 11, z: 11 }, userData: { active: true, health: 10 } }
            ];
            let hitCount = 0;

            CollisionOrchestrator.processSplashDamage(impactPos, 0, 2, enemies, null, () => { hitCount++; });
            test.assertEqual(hitCount, 0, 'Should not damage with 0 radius');
        });
    });

    // ==========================================
    // INPUT TESTS
    // ==========================================

    test.describe('Engine: Input System', () => {
        test.beforeEach(() => {
            InputOrchestrator.init();
        });

        test.afterEach(() => {
            InputOrchestrator.destroy();
            InputOrchestrator.clearAllCallbacks();
        });

        test.it('should initialize with default bindings', () => {
            test.assertEqual(InputOrchestrator.getBinding('KeyW'), 'forward');
            test.assertEqual(InputOrchestrator.getBinding('Space'), 'fire');
            test.assertEqual(InputOrchestrator.getBinding('KeyP'), 'freeze');
        });

        test.it('should track key states', () => {
            test.assertEqual(InputOrchestrator.keys.forward, false);
            test.assertEqual(InputOrchestrator.keys.backward, false);
            test.assertEqual(InputOrchestrator.keys.turnLeft, false);
            test.assertEqual(InputOrchestrator.keys.turnRight, false);
        });

        test.it('should return movement input', () => {
            const movement = InputOrchestrator.getMovement();
            test.assertEqual(movement.forward, 0);
            test.assertEqual(movement.turn, 0);
        });

        test.it('should reset key states', () => {
            InputOrchestrator.keys.forward = true;
            InputOrchestrator.keys.turnLeft = true;
            InputOrchestrator.reset();
            test.assertEqual(InputOrchestrator.keys.forward, false);
            test.assertEqual(InputOrchestrator.keys.turnLeft, false);
        });

        test.it('should allow custom bindings', () => {
            InputOrchestrator.setBinding('KeyX', 'customAction');
            test.assertEqual(InputOrchestrator.getBinding('KeyX'), 'customAction');
        });

        test.it('should report initialization state', () => {
            test.assertEqual(InputOrchestrator.isInitialized(), true);
            InputOrchestrator.destroy();
            test.assertEqual(InputOrchestrator.isInitialized(), false);
        });
    });

    // ==========================================
    // GAME STATE TESTS
    // ==========================================

    test.describe('Engine: State System', () => {
        test.beforeEach(() => {
            StateOrchestrator.clearAllCallbacks();
            StateOrchestrator.init('MENU');
        });

        test.it('should initialize to specified state', () => {
            test.assertEqual(StateOrchestrator.get(), 'MENU');
        });

        test.it('should check current state', () => {
            test.assertEqual(StateOrchestrator.is('MENU'), true);
            test.assertEqual(StateOrchestrator.is('PLAYING'), false);
        });

        test.it('should check multiple states with isAny', () => {
            test.assertEqual(StateOrchestrator.isAny('MENU', 'PLAYING'), true);
            test.assertEqual(StateOrchestrator.isAny('PAUSED', 'GAME_OVER'), false);
        });

        test.it('should transition to valid state', () => {
            const result = StateOrchestrator.transition('PLAYING');
            test.assertEqual(result, true);
            test.assertEqual(StateOrchestrator.get(), 'PLAYING');
        });

        test.it('should reject invalid transition', () => {
            const result = StateOrchestrator.transition('PAUSED');
            test.assertEqual(result, false);
            test.assertEqual(StateOrchestrator.get(), 'MENU');
        });

        test.it('should report valid transitions', () => {
            const valid = StateOrchestrator.getValidTransitions();
            test.assertEqual(valid.includes('PLAYING'), true);
            test.assertEqual(valid.includes('PAUSED'), false);
        });

        test.it('should fire enter callback on transition', () => {
            let entered = false;
            StateOrchestrator.onStateEnter('PLAYING', () => { entered = true; });
            StateOrchestrator.transition('PLAYING');
            test.assertEqual(entered, true);
        });

        test.it('should fire exit callback on transition', () => {
            let exited = false;
            StateOrchestrator.onStateExit('MENU', () => { exited = true; });
            StateOrchestrator.transition('PLAYING');
            test.assertEqual(exited, true);
        });

        test.it('should fire global change callback', () => {
            let prevState = null;
            let newState = null;
            StateOrchestrator.onChange((prev, next) => {
                prevState = prev;
                newState = next;
            });
            StateOrchestrator.transition('PLAYING');
            test.assertEqual(prevState, 'MENU');
            test.assertEqual(newState, 'PLAYING');
        });

        test.it('should have convenience methods', () => {
            test.assertEqual(StateOrchestrator.isMenu(), true);
            test.assertEqual(StateOrchestrator.isPlaying(), false);

            StateOrchestrator.transition('PLAYING');
            test.assertEqual(StateOrchestrator.isPlaying(), true);

            StateOrchestrator.transition('PAUSED');
            test.assertEqual(StateOrchestrator.isPaused(), true);

            StateOrchestrator.transition('MENU');
            StateOrchestrator.forceTransition('GAME_OVER');
            test.assertEqual(StateOrchestrator.isGameOver(), true);
        });
    });

    // ==========================================
    // GAME LOOP TESTS
    // ==========================================

    test.describe('Engine: Loop System', () => {
        test.beforeEach(() => {
            // Initialize with mock THREE
            LoopOrchestrator.init({ Clock: function() {
                this.start = () => {};
                this.getDelta = () => 0.016;
            }});
        });

        test.it('should not be running initially', () => {
            test.assertEqual(LoopOrchestrator.isRunning(), false);
        });

        test.it('should track frame count', () => {
            test.assertEqual(LoopOrchestrator.getFrameCount(), 0);
        });

        test.it('should have configurable max delta time', () => {
            LoopOrchestrator.setMaxDeltaTime(0.05);
            test.assertEqual(LoopOrchestrator.getMaxDeltaTime(), 0.05);
        });

        test.it('should accept update callback', () => {
            let called = false;
            LoopOrchestrator.setUpdateCallback(() => { called = true; });
            // Note: callback won't fire until loop starts
            test.assertEqual(called, false);
        });

        test.it('should accept render callback', () => {
            let called = false;
            LoopOrchestrator.setRenderCallback(() => { called = true; });
            test.assertEqual(called, false);
        });

        test.it('should manage pre-update callbacks', () => {
            const cb = () => {};
            LoopOrchestrator.addPreUpdate(cb);
            LoopOrchestrator.removePreUpdate(cb);
            // No error means success
        });

        test.it('should manage post-update callbacks', () => {
            const cb = () => {};
            LoopOrchestrator.addPostUpdate(cb);
            LoopOrchestrator.removePostUpdate(cb);
        });
    });

    // ==========================================
    // SCENE MANAGER TESTS
    // ==========================================

    test.describe('Engine: Scene System', () => {
        // Note: These tests require THREE.js to be loaded
        test.it('should initialize with THREE reference', () => {
            if (typeof THREE === 'undefined') {
                // Skip if THREE not available
                return;
            }

            const container = document.createElement('div');
            SceneOrchestrator.init(THREE, container);

            test.assertEqual(SceneOrchestrator.scene !== null, true, 'Scene created');
            test.assertEqual(SceneOrchestrator.camera !== null, true, 'Camera created');
            test.assertEqual(SceneOrchestrator.renderer !== null, true, 'Renderer created');

            SceneOrchestrator.dispose();
        });

        test.it('should create and manage groups', () => {
            if (typeof THREE === 'undefined') return;

            const container = document.createElement('div');
            SceneOrchestrator.init(THREE, container);

            const group = SceneOrchestrator.createGroup('testGroup');
            test.assertEqual(group !== null, true, 'Group created');
            test.assertEqual(SceneOrchestrator.getGroup('testGroup'), group, 'Group retrieved');

            SceneOrchestrator.dispose();
        });

        test.it('should add objects to groups', () => {
            if (typeof THREE === 'undefined') return;

            const container = document.createElement('div');
            SceneOrchestrator.init(THREE, container);

            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial()
            );

            SceneOrchestrator.createGroup('test');
            const result = SceneOrchestrator.addToGroup('test', mesh);
            test.assertEqual(result, true);

            SceneOrchestrator.dispose();
        });
    });

    // ==========================================
    // ENTITY MANAGER TESTS
    // ==========================================

    test.describe('Engine: Entity System', () => {
        test.beforeEach(() => {
            // Mock scene
            const mockScene = {
                add: () => {},
                remove: () => {}
            };
            EntityOrchestrator.init(mockScene);
        });

        test.it('should register entity types', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 5 });
            test.assertEqual(EntityOrchestrator.hasType('enemy'), true);
        });

        test.it('should spawn entities', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 5 });
            const mockMesh = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const entity = EntityOrchestrator.spawn('enemy', mockMesh, { health: 3 });

            test.assertEqual(entity !== null, true, 'Entity spawned');
            test.assertEqual(entity.type, 'enemy');
            test.assertEqual(entity.data.health, 3);
            test.assertEqual(entity.active, true);
        });

        test.it('should respect max count', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 2 });

            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 1, y: 0, z: 0 }, userData: {} };
            const mesh3 = { position: { x: 2, y: 0, z: 0 }, userData: {} };

            EntityOrchestrator.spawn('enemy', mesh1);
            EntityOrchestrator.spawn('enemy', mesh2);
            const result = EntityOrchestrator.spawn('enemy', mesh3);

            test.assertEqual(result, null, 'Third spawn rejected');
            test.assertEqual(EntityOrchestrator.getCount('enemy'), 2);
        });

        test.it('should despawn entities', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 5 });
            const mockMesh = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const entity = EntityOrchestrator.spawn('enemy', mockMesh);

            EntityOrchestrator.despawn('enemy', entity);
            test.assertEqual(EntityOrchestrator.getCount('enemy'), 0);
        });

        test.it('should get active entities', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 1, y: 0, z: 0 }, userData: {} };

            EntityOrchestrator.spawn('enemy', mesh1);
            EntityOrchestrator.spawn('enemy', mesh2);

            const active = EntityOrchestrator.getActive('enemy');
            test.assertEqual(active.length, 2);
        });

        test.it('should check capacity', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 1 });
            test.assertEqual(EntityOrchestrator.isAtCapacity('enemy'), false);

            const mockMesh = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            EntityOrchestrator.spawn('enemy', mockMesh);
            test.assertEqual(EntityOrchestrator.isAtCapacity('enemy'), true);
        });

        test.it('should iterate with forEach', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 1, y: 0, z: 0 }, userData: {} };

            EntityOrchestrator.spawn('enemy', mesh1);
            EntityOrchestrator.spawn('enemy', mesh2);

            let count = 0;
            EntityOrchestrator.forEach('enemy', () => { count++; });
            test.assertEqual(count, 2);
        });

        test.it('should filter entities', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            const mesh2 = { position: { x: 5, y: 0, z: 0 }, userData: {} };

            EntityOrchestrator.spawn('enemy', mesh1, { damage: 10 });
            EntityOrchestrator.spawn('enemy', mesh2, { damage: 20 });

            const highDamage = EntityOrchestrator.filter('enemy', e => e.data.damage > 15);
            test.assertEqual(highDamage.length, 1);
        });

        test.it('should reset all entities', () => {
            EntityOrchestrator.registerType('enemy', { maxCount: 5 });
            const mesh1 = { position: { x: 0, y: 0, z: 0 }, userData: {} };
            EntityOrchestrator.spawn('enemy', mesh1);

            EntityOrchestrator.reset();
            test.assertEqual(EntityOrchestrator.getCount('enemy'), 0);
        });
    });

    // ==========================================
    // ANALYTICS SYSTEM TESTS
    // ==========================================

    test.describe('Engine AnalyticsOrchestrator - Initialization', () => {
        test.it('should have init method', () => {
            test.assertTrue(typeof AnalyticsOrchestrator.init === 'function');
        });

        test.it('should have track method', () => {
            test.assertTrue(typeof AnalyticsOrchestrator.track === 'function');
        });

        test.it('should initialize without errors', () => {
            // Should not throw even with no gtag
            AnalyticsOrchestrator.init({ provider: 'none', debug: false });
            test.assertTrue(AnalyticsOrchestrator.initialized);
        });

        test.it('should support disabling analytics', () => {
            AnalyticsOrchestrator.init({ enabled: true });
            test.assertTrue(AnalyticsOrchestrator.config.enabled);
            AnalyticsOrchestrator.disable();
            test.assertFalse(AnalyticsOrchestrator.config.enabled);
            AnalyticsOrchestrator.enable();
            test.assertTrue(AnalyticsOrchestrator.config.enabled);
        });
    });

    test.describe('Engine AnalyticsOrchestrator - Failsafe Tracking', () => {
        test.beforeEach(() => {
            AnalyticsOrchestrator.init({ provider: 'none', debug: false });
        });

        test.it('should track events without throwing', () => {
            // All these should complete without errors
            let errorThrown = false;
            try {
                AnalyticsOrchestrator.track('test_event', { value: 1 });
                AnalyticsOrchestrator.gameStart();
                AnalyticsOrchestrator.gameOver({ score: 1000, playTime: 60, died: false, rating: 'test' });
                AnalyticsOrchestrator.weaponSwitch('watergun', 'slingshot');
                AnalyticsOrchestrator.enemyKill('skeleton', 300);
                AnalyticsOrchestrator.damageTaken(20, 'enemy', 80);
                AnalyticsOrchestrator.pickupCollected('weapon', 'nerfgun');
                AnalyticsOrchestrator.obstacleHit('barrel', 150);
            } catch (e) {
                errorThrown = true;
            }
            test.assertFalse(errorThrown, 'No errors should be thrown');
        });

        test.it('should handle missing provider gracefully', () => {
            AnalyticsOrchestrator.config.provider = 'nonexistent';
            let errorThrown = false;
            try {
                AnalyticsOrchestrator.track('test_event');
            } catch (e) {
                errorThrown = true;
            }
            test.assertFalse(errorThrown);
        });

        test.it('should handle disabled state gracefully', () => {
            AnalyticsOrchestrator.disable();
            let errorThrown = false;
            try {
                AnalyticsOrchestrator.gameStart();
                AnalyticsOrchestrator.gameOver({ score: 500 });
            } catch (e) {
                errorThrown = true;
            }
            test.assertFalse(errorThrown);
        });
    });

    test.describe('Engine AnalyticsOrchestrator - Custom Provider', () => {
        test.it('should register custom provider', () => {
            const events = [];
            const customProvider = {
                isReady: () => true,
                track: (name, params) => events.push({ name, params })
            };

            const result = AnalyticsOrchestrator.registerProvider('custom', customProvider);
            test.assertTrue(result);
            test.assertTrue(AnalyticsOrchestrator.providers['custom'] !== undefined);
        });

        test.it('should reject invalid provider', () => {
            const result = AnalyticsOrchestrator.registerProvider('invalid', { foo: 'bar' });
            test.assertFalse(result);
        });
    });

})();
