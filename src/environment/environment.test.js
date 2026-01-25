// ============================================
// ENVIRONMENT DOMAIN - Unit Tests
// ============================================

(function(test) {
    'use strict';

    // ==========================================
    // OBSTACLE DATA TESTS
    // ==========================================

    test.describe('Obstacle Data', () => {
        test.it('should have STACK type defined', () => {
            test.assertTrue(Obstacle.types.STACK !== undefined);
        });

        test.it('should have BARREL type defined', () => {
            test.assertTrue(Obstacle.types.BARREL !== undefined);
        });

        test.it('should have DISPLAY type defined', () => {
            test.assertTrue(Obstacle.types.DISPLAY !== undefined);
        });

        test.it('should have correct stack properties', () => {
            const stack = Obstacle.types.STACK;
            test.assertEqual(stack.id, 'stack');
            test.assertEqual(stack.shape, 'pyramid');
            test.assertEqual(stack.scoreHit, 150);
        });

        test.it('should get obstacle by id', () => {
            const obs = Obstacle.get('BARREL');
            test.assertTrue(obs !== null);
            test.assertEqual(obs.id, 'barrel');
        });

        test.it('should return null for unknown obstacle', () => {
            const obs = Obstacle.get('UNKNOWN');
            test.assertEqual(obs, null);
        });

        test.it('should get random type', () => {
            const typeId = Obstacle.getRandomType();
            test.assertTrue(Obstacle.get(typeId) !== null);
        });

        test.it('should create instance data', () => {
            const instance = Obstacle.createInstance('STACK', { x: 5, y: 0, z: -10 });
            test.assertEqual(instance.type, 'STACK');
            test.assertEqual(instance.position.x, 5);
            test.assertTrue(instance.active);
            test.assertFalse(instance.falling);
        });
    });

    // ==========================================
    // SHELF DATA TESTS
    // ==========================================

    test.describe('Shelf Data', () => {
        test.it('should have WALL_STANDARD template', () => {
            test.assertTrue(Shelf.templates.WALL_STANDARD !== undefined);
        });

        test.it('should have FLOOR_ISLAND template', () => {
            test.assertTrue(Shelf.templates.FLOOR_ISLAND !== undefined);
        });

        test.it('should have BOX product type', () => {
            test.assertTrue(Shelf.productTypes.BOX !== undefined);
        });

        test.it('should have BOTTLE product type', () => {
            test.assertTrue(Shelf.productTypes.BOTTLE !== undefined);
        });

        test.it('should get template by id', () => {
            const template = Shelf.getTemplate('WALL_STANDARD');
            test.assertEqual(template.id, 'wall_standard');
            test.assertEqual(template.type, 'wall');
        });

        test.it('should fall back to WALL_STANDARD for unknown', () => {
            const template = Shelf.getTemplate('UNKNOWN');
            test.assertEqual(template.id, 'wall_standard');
        });

        test.it('should get product type by id', () => {
            const type = Shelf.getProductType('BOTTLE');
            test.assertEqual(type.id, 'bottle');
            test.assertEqual(type.geometry, 'cylinder');
        });

        test.it('should pick random product type', () => {
            const typeId = Shelf.pickProductType();
            test.assertTrue(Shelf.getProductType(typeId) !== undefined);
        });

        test.it('should pick color from theme', () => {
            const colors = [0xff0000, 0x00ff00, 0x0000ff];
            const color = Shelf.pickColor(colors);
            test.assertTrue(colors.includes(color));
        });

        test.it('should return default color for empty theme', () => {
            const color = Shelf.pickColor([]);
            test.assertEqual(color, 0x888888);
        });
    });

    // ==========================================
    // ENVIRONMENT SYSTEM TESTS
    // ==========================================

    test.describe('Environment System - Initialization', () => {
        test.beforeEach(() => {
            EnvironmentSystem.obstacles = [];
            EnvironmentSystem.shelves = [];
            EnvironmentSystem.scene = null;
        });

        test.it('should initialize with data references', () => {
            EnvironmentSystem.init(Obstacle, Shelf, null);
            test.assertEqual(EnvironmentSystem.obstacleData, Obstacle);
            test.assertEqual(EnvironmentSystem.shelfData, Shelf);
        });

        test.it('should reset clears obstacles and shelves', () => {
            EnvironmentSystem.obstacles = [{ active: true }];
            EnvironmentSystem.shelves = [{ mesh: null }];
            EnvironmentSystem.reset();
            test.assertEqual(EnvironmentSystem.obstacles.length, 0);
            test.assertEqual(EnvironmentSystem.shelves.length, 0);
        });
    });

    test.describe('Environment System - Obstacles', () => {
        test.beforeEach(() => {
            EnvironmentSystem.init(Obstacle, Shelf, null);
        });

        test.it('should spawn obstacle without THREE', () => {
            const obs = EnvironmentSystem.spawnObstacle('STACK', 5, -20, null);
            test.assertTrue(obs !== null);
            test.assertEqual(obs.type, 'STACK');
            test.assertEqual(obs.position.x, 5);
        });

        test.it('should track spawned obstacles', () => {
            EnvironmentSystem.spawnObstacle('STACK', 0, -10, null);
            EnvironmentSystem.spawnObstacle('BARREL', 5, -20, null);
            test.assertEqual(EnvironmentSystem.getObstacleCount(), 2);
        });

        test.it('should limit max obstacles', () => {
            // maxObstacles is now from config (15 by default)
            const maxObstacles = EnvironmentSystem.maxObstacles;
            for (let i = 0; i < maxObstacles + 5; i++) {
                EnvironmentSystem.spawnObstacle('STACK', i, -10 * i, null);
            }
            test.assertEqual(EnvironmentSystem.getObstacleCount(), maxObstacles);
        });

        test.it('should hit obstacle and return score', () => {
            const obs = EnvironmentSystem.spawnObstacle('STACK', 0, 0, null);
            const result = EnvironmentSystem.hitObstacle(obs);
            test.assertTrue(result.hit);
            test.assertEqual(result.score, 150);
            test.assertTrue(obs.falling);
        });

        test.it('should despawn fallen obstacles', () => {
            const obs = EnvironmentSystem.spawnObstacle('STACK', 0, 0, null);
            obs.falling = true;
            obs.fallProgress = 1.5; // Fully fallen
            EnvironmentSystem.updateObstacles({ z: 0 }, 0.1);
            test.assertEqual(EnvironmentSystem.getObstacleCount(), 0);
        });
    });

    test.describe('Environment System - Shelves', () => {
        test.beforeEach(() => {
            EnvironmentSystem.init(Obstacle, Shelf, null);
        });

        test.it('should create shelf without THREE', () => {
            const shelf = EnvironmentSystem.createShelf(
                'WALL_STANDARD',
                { x: -10, y: 0, z: -5 },
                Math.PI / 2,
                null,
                null
            );
            test.assertTrue(shelf !== null);
            test.assertEqual(shelf.template, 'WALL_STANDARD');
            test.assertEqual(shelf.position.x, -10);
        });

        test.it('should track created shelves', () => {
            EnvironmentSystem.createShelf('WALL_STANDARD', { x: 0, y: 0, z: 0 }, 0, null, null);
            EnvironmentSystem.createShelf('FLOOR_ISLAND', { x: 5, y: 0, z: -10 }, 0, null, null);
            test.assertEqual(EnvironmentSystem.getShelfCount(), 2);
        });
    });

    // ==========================================
    // OBSTACLE VISUAL TESTS
    // ==========================================

    test.describe('Obstacle Visual', () => {
        test.it('should have createMesh method', () => {
            test.assertTrue(typeof ObstacleVisual.createMesh === 'function');
        });

        test.it('should have createStack method', () => {
            test.assertTrue(typeof ObstacleVisual.createStack === 'function');
        });

        test.it('should have createBarrel method', () => {
            test.assertTrue(typeof ObstacleVisual.createBarrel === 'function');
        });

        test.it('should have createDisplay method', () => {
            test.assertTrue(typeof ObstacleVisual.createDisplay === 'function');
        });

        test.it('should have animateFall method', () => {
            test.assertTrue(typeof ObstacleVisual.animateFall === 'function');
        });
    });

    // ==========================================
    // SHELF VISUAL TESTS
    // ==========================================

    test.describe('Shelf Visual', () => {
        test.it('should have createWallShelf method', () => {
            test.assertTrue(typeof ShelfVisual.createWallShelf === 'function');
        });

        test.it('should have createFloorDisplay method', () => {
            test.assertTrue(typeof ShelfVisual.createFloorDisplay === 'function');
        });

        test.it('should have createProduct method', () => {
            test.assertTrue(typeof ShelfVisual.createProduct === 'function');
        });

        test.it('should have createShelf method', () => {
            test.assertTrue(typeof ShelfVisual.createShelf === 'function');
        });
    });

    // ==========================================
    // SPAWN SYSTEM TESTS
    // ==========================================

    test.describe('Spawn System - Runtime Pickup Spawning', () => {
        test.it('should have tryRuntimePickupSpawn method', () => {
            test.assertTrue(typeof SpawnSystem.tryRuntimePickupSpawn === 'function');
        });

        test.it('should have pickupRuntimeConfig defined', () => {
            test.assertTrue(SpawnSystem.pickupRuntimeConfig !== undefined);
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.maxPickups > 0);
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.spawnInterval > 0);
        });

        test.it('should not spawn if max pickups reached', () => {
            const mockPickupSystem = {
                getCount: () => 10,  // More than max
                trySpawnForRoom: () => true
            };

            const result = SpawnSystem.tryRuntimePickupSpawn({
                currentRoom: { gridX: 0, gridZ: 0 },
                playerPosition: { x: 15, z: 15 },
                visitedRooms: new Set(['0_0', '1_0']),
                gridSystem: { getRoomAtWorld: () => ({ gridX: 1, gridZ: 0, theme: 'NORMAL', worldX: 45, worldZ: 15 }) },
                roomConfig: { UNIT: 30, DOOR_WIDTH: 6 },
                currentPickupCount: 10,  // >= max
                dt: 5.0,  // Exceed interval
                pickupSystem: mockPickupSystem,
                obstacles: [],
                shelves: []
            });

            test.assertEqual(result, false, 'Should not spawn when max reached');
        });

        test.it('should respect spawn interval timing', () => {
            SpawnSystem._lastPickupSpawnTime = 0;

            const result = SpawnSystem.tryRuntimePickupSpawn({
                currentRoom: null,
                playerPosition: { x: 15, z: 15 },
                visitedRooms: new Set(),
                gridSystem: { getRoomAtWorld: () => null },
                roomConfig: { UNIT: 30, DOOR_WIDTH: 6 },
                currentPickupCount: 0,
                dt: 0.1,  // Less than interval
                pickupSystem: null,
                obstacles: [],
                shelves: []
            });

            test.assertEqual(result, false, 'Should not spawn before interval');
        });

        test.it('should have valid config values', () => {
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.maxPickups >= 1);
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.spawnInterval >= 1);
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.minDistanceFromPlayer > 0);
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.maxDistanceFromPlayer > SpawnSystem.pickupRuntimeConfig.minDistanceFromPlayer);
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.spawnChancePerAttempt > 0);
            test.assertTrue(SpawnSystem.pickupRuntimeConfig.spawnChancePerAttempt <= 1);
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {} });
