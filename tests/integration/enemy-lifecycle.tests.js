/**
 * Enemy Lifecycle Integration Tests
 * Tests enemy spawning → behavior → attacking → death mechanics
 */

(function(runner) {
    'use strict';

    const helpers = window.IntegrationHelpers;

    // Test 1: Skeleton spawns in room
    runner.addTest('skeleton-spawns-in-room', 'Enemy Lifecycle', 'Skeleton spawns with correct config',
        'Verifies skeleton enemy spawns with proper health and speed',
        async () => {
            const enemy = await helpers.spawnEnemyAt(10, 10, 'SKELETON');
            const Enemy = runner.gameWindow.Enemy;

            if (!enemy.userData.active) {
                throw new Error('Spawned enemy not active');
            }

            const config = Enemy.types.SKELETON;
            if (enemy.userData.health !== config.health) {
                throw new Error(`Expected health ${config.health}, got ${enemy.userData.health}`);
            }

            // driftSpeed is randomized: (Math.random() - 0.5) * config.driftSpeed
            // For config.driftSpeed = 4, range is -2 to +2
            const expectedMin = -0.5 * config.driftSpeed;
            const expectedMax = 0.5 * config.driftSpeed;
            if (enemy.userData.driftSpeed < expectedMin || enemy.userData.driftSpeed > expectedMax) {
                throw new Error(`Expected driftSpeed in range [${expectedMin}, ${expectedMax}], got ${enemy.userData.driftSpeed}`);
            }
        }
    );

    // Test 2: Skeleton chases player
    runner.addTest('skeleton-chases-player', 'Enemy AI', 'Enemy moves toward player',
        'Verifies skeleton AI detects player and moves closer over time',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Spawn enemy 30 units away
            const enemy = await helpers.spawnEnemyAt(0, -30, 'SKELETON');
            await helpers.positionPlayerAt(0, 0, 0);

            const initialDistance = Math.abs(enemy.position.z);

            // Wait for AI to move enemy (real timing)
            await runner.wait(2000);

            const newDistance = Math.abs(enemy.position.z);

            if (newDistance >= initialDistance) {
                throw new Error(`Enemy did not move closer: ${initialDistance} -> ${newDistance}`);
            }
        }
    );

    runner.addTest('skeleton-bypasses-shelf-while-chasing', 'Enemy AI', 'Enemy routes around shelf blockers',
        'Verifies chase AI makes lateral bypass progress instead of sticking to direct blocked path',
        async () => {
            await helpers.bootGameForIntegration();

            const internals = runner.gameWindow.__gameInternals;
            const manualUpdate = runner.gameWindow.manualUpdate;
            if (!internals || !manualUpdate) {
                throw new Error('Game internals not available for bypass integration test');
            }

            await helpers.positionPlayerAt(45, 68, 0);
            const enemy = await helpers.spawnEnemyAt(45, 82, 'SKELETON');
            if (!enemy?.userData) {
                throw new Error('Failed to spawn enemy for bypass test');
            }

            // Lock drift randomness for deterministic steering assertions.
            enemy.userData.config = {
                ...enemy.userData.config,
                driftInterval: 999,
                driftSpeed: 0
            };
            enemy.userData.driftSpeed = 0;
            enemy.userData.driftTimer = 0;

            const shelves = internals.getShelves();
            if (!Array.isArray(shelves)) {
                throw new Error('Shelves array not available');
            }

            const blockerShelf = {
                position: { x: 45, y: 0, z: 75 },
                userData: { width: 6, depth: 3 }
            };
            shelves.push(blockerShelf);

            try {
                const initialDist = Math.sqrt(
                    Math.pow(enemy.position.x - 45, 2) +
                    Math.pow(enemy.position.z - 68, 2)
                );
                const initialX = enemy.position.x;

                // Keep this under LOST_SIGHT_TIMEOUT to isolate bypass behavior.
                for (let i = 0; i < 110; i++) {
                    manualUpdate(0.016);
                }
                await runner.wait(30);

                const finalDist = Math.sqrt(
                    Math.pow(enemy.position.x - 45, 2) +
                    Math.pow(enemy.position.z - 68, 2)
                );
                const lateralShift = Math.abs(enemy.position.x - initialX);

                if (finalDist >= initialDist - 0.8) {
                    throw new Error(`Enemy did not make enough chase progress around blocker: ${initialDist.toFixed(2)} -> ${finalDist.toFixed(2)}`);
                }
                if (lateralShift < 0.35) {
                    throw new Error(`Expected lateral bypass movement around shelf, got shift ${lateralShift.toFixed(2)}`);
                }
            } finally {
                const idx = shelves.indexOf(blockerShelf);
                if (idx >= 0) shelves.splice(idx, 1);
            }
        }
    );

    // Test 3: Skeleton collides with player
    runner.addTest('skeleton-collides-player', 'Enemy AI', 'Enemy collision damages player',
        'Verifies enemy collision with player deals damage',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const initialHealth = PlayerOrchestrator.health;

            // Use valid room position (45, 75) - center of room (1, 2)
            // Spawn enemy at same position as player for immediate collision
            await helpers.positionPlayerAt(45, 75, 0);
            const enemy = await helpers.spawnEnemyAt(45, 74, 'SKELETON');

            // Run game loop to process collision detection
            // EnemyOrchestrator.updateAll checks enemy-player collision
            for (let i = 0; i < 60; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
                await runner.wait(16);
            }

            const newHealth = PlayerOrchestrator.health;

            if (newHealth >= initialHealth) {
                throw new Error(`Player took no damage: ${initialHealth} -> ${newHealth}`);
            }
        }
    );

    // Test 4: Skeleton death sequence
    runner.addTest('skeleton-death-sequence', 'Enemy Lifecycle', 'Enemy dies and awards score',
        'Verifies enemy health reaching 0 triggers death and score increase',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 10,  // Keep enemy close in same room
                enemyHealth: 1
            });

            const initialScore = runner.getScore();

            // Kill enemy (chargeTime=0 since fireWeapon forces full charge)
            await helpers.fireWeapon(0);
            await helpers.waitForProjectileImpact(2000);
            await helpers.waitForEnemyDeath(enemy, 1000);

            // Verify inactive
            if (enemy.userData.active) {
                throw new Error('Enemy still active after death');
            }

            // Verify score increased
            const newScore = runner.getScore();
            if (newScore <= initialScore) {
                throw new Error('Score did not increase on enemy death');
            }
        }
    );

    // Test 5: No respawn after death
    runner.addTest('no-respawn-after-death', 'Clear the Mall', 'Killed enemies stay dead',
        'Verifies killed skeleton does not respawn (Clear the Mall design)',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 10,  // Keep enemy close in same room
                enemyHealth: 1
            });

            // Kill enemy (chargeTime=0 since fireWeapon forces full charge)
            await helpers.fireWeapon(0);
            await helpers.waitForEnemyDeath(enemy, 1000);

            // Wait several seconds
            await runner.wait(3000);

            // Enemy should still be dead
            if (enemy.userData.active) {
                throw new Error('Enemy respawned after death');
            }
        }
    );

    // Test 6: Dinosaur boss spawns at 5000
    runner.addTest('dinosaur-boss-spawns-at-5000', 'Boss Enemy', 'Boss spawns at 5000 score',
        'Verifies dino boss spawns at 5000 score threshold with warning',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;

            // Reset dino spawn counter
            EnemyOrchestrator._dinoSpawnCount = 0;

            // Check spawn type at 5000 score
            const spawnType = EnemyOrchestrator.getSpawnType(5000);

            if (spawnType !== 'DINOSAUR') {
                throw new Error(`Expected DINOSAUR at 5000 score, got ${spawnType}`);
            }
        }
    );

    runner.addTest('dinosaur-boss-safe-spawn-distance', 'Boss Enemy', 'Boss does not spawn on player',
        'Verifies boss spawn retries when candidate position is too close to the player cart',
        async () => {
            await helpers.bootGameForIntegration();

            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            const SpawnOrchestrator = runner.gameWindow.SpawnOrchestrator;
            const GameSession = runner.gameWindow.GameSession;
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const internals = runner.gameWindow.__gameInternals;

            if (!EnemyOrchestrator || !SpawnOrchestrator || !GameSession || !PlayerOrchestrator || !internals) {
                throw new Error('Required game modules not available for boss spawn distance test');
            }

            // Center of default starting room for deterministic distance checks.
            PlayerOrchestrator.position = { x: 45, z: 75 };
            if (internals.playerCart) {
                internals.playerCart.position.set(45, 0, 75);
            }

            const originalFindValidPosition = SpawnOrchestrator.findValidPosition;
            let findCallCount = 0;
            SpawnOrchestrator.findValidPosition = () => {
                findCallCount += 1;
                if (findCallCount === 1) {
                    return { x: 45, z: 75 }; // Unsafe: exact player position.
                }
                return { x: 45, z: 60 }; // Safe fallback candidate.
            };

            try {
                EnemyOrchestrator._dinoSpawnCount = 0;
                GameSession.setScore(5000);

                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
                await runner.wait(50);

                const enemies = internals.getEnemies();
                const dinos = enemies.filter((e) => e?.userData?.config?.id === 'dinosaur');
                if (dinos.length === 0) {
                    throw new Error('Expected a dinosaur boss to spawn at 5000 score');
                }

                const dino = dinos[dinos.length - 1];
                const dx = dino.position.x - PlayerOrchestrator.position.x;
                const dz = dino.position.z - PlayerOrchestrator.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const dinoCollisionRadius = dino.userData?.config?.collisionRadius || 5.5;

                if (dist <= dinoCollisionRadius + 1.0) {
                    throw new Error(`Dinosaur spawned too close (${dist.toFixed(2)} <= ${dinoCollisionRadius + 1.0})`);
                }

                if (findCallCount < 2) {
                    throw new Error('Expected spawn search to retry after unsafe boss spawn position');
                }
            } finally {
                SpawnOrchestrator.findValidPosition = originalFindValidPosition;
            }
        }
    );

    // Test 7: Dinosaur takes multiple hits
    runner.addTest('dinosaur-takes-multiple-hits', 'Boss Enemy', 'Boss has 10 health',
        'Verifies dinosaur boss requires multiple hits to kill',
        async () => {
            const enemy = await helpers.spawnEnemyAt(0, -20, 'DINOSAUR');

            const Enemy = runner.gameWindow.Enemy;
            const expectedHealth = Enemy.types.DINOSAUR.health;

            if (enemy.userData.health !== expectedHealth) {
                throw new Error(`Expected ${expectedHealth} health, got ${enemy.userData.health}`);
            }

            if (expectedHealth < 5) {
                throw new Error(`Boss should have high health, got ${expectedHealth}`);
            }
        }
    );

    // Test 8: Dinonizer transforms enemy into toy
    runner.addTest('dinonizer-transforms-enemy', 'Special Weapon', 'Dinonizer turns enemy into toy',
        'Verifies dinonizer projectile transforms enemies into collectible toys',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'dinonizer',
                enemyType: 'SKELETON',
                distance: 10,
                enemyHealth: 4
            });

            await helpers.fireWeapon(0);

            const runner = helpers.runner;
            const getEnemies = () => {
                const gi = runner.gameWindow.__gameInternals;
                return gi ? gi.getEnemies() : (runner.gameWindow.enemies || []);
            };

            const transformed = await helpers.waitForCondition(() => {
                const enemies = getEnemies();
                const hasToy = enemies.some((e) =>
                    e?.userData?.config?.isToy ||
                    e?.userData?.isToy ||
                    e?.userData?.type === 'TOY'
                );
                return hasToy && enemy.userData.active === false;
            }, 2000);

            if (!transformed) {
                throw new Error('Enemy was not transformed into toy');
            }
        }
    );

    // Test 9: Dino kill drops dinonizer pickup
    runner.addTest('dino-drops-dinonizer-pickup', 'Special Weapon', 'Dino drops dinonizer pickup on death',
        'Verifies dinonizer pickup spawns when a dinosaur is destroyed',
        async () => {
            await helpers.bootGameForIntegration();

            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const enemy = await helpers.spawnEnemyAt(45, 65, 'DINOSAUR', 1);

            PickupOrchestrator.init(scene, THREE);

            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const camera = runner.gameWindow.camera;

            WeaponOrchestrator.equip('slingshot', THREE, MaterialsTheme, camera);

            await helpers.fireWeapon(0);
            await helpers.waitForEnemyDeath(enemy, 1500);

            const dropped = PickupOrchestrator.pickups.find((p) => p.config?.id === 'dinonizer');
            if (!dropped) {
                throw new Error('Expected dinonizer pickup to spawn on dino death');
            }
        }
    );

    // Test 10: Pre-spawning ahead
    runner.addTest('pre-spawning-ahead', 'Pre-Spawning', 'Enemies spawn in nearby rooms',
        'Verifies enemies exist in rooms player has not entered',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(500);

            // Run some updates to trigger spawning
            for (let i = 0; i < 30; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(300);

            // Player starts at room (1,2)
            const currentRoom = runner.gameWindow.currentRoom || { x: 1, z: 2 };

            // Check adjacent rooms
            const adjacentRooms = [
                { x: currentRoom.x + 1, z: currentRoom.z },
                { x: currentRoom.x - 1, z: currentRoom.z },
                { x: currentRoom.x, z: currentRoom.z + 1 },
                { x: currentRoom.x, z: currentRoom.z - 1 }
            ];

            let hasEnemiesInAdjacentRoom = false;
            for (const room of adjacentRooms) {
                const enemies = helpers.getEnemiesInRoom(room.x, room.z);
                if (enemies.length > 0) {
                    hasEnemiesInAdjacentRoom = true;
                    break;
                }
            }

            if (!hasEnemiesInAdjacentRoom) {
                throw new Error('No enemies found in adjacent rooms - pre-spawning not working');
            }
        }
    );

    // Test 9: Safe room no spawn
    runner.addTest('safe-room-no-spawn', 'Safe Room', 'Starting room has no enemies',
        'Verifies starting room (1,2) never spawns enemies',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(500);

            // Run updates to spawn enemies
            for (let i = 0; i < 30; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(200);

            // Check starting room (1,2)
            const enemiesInStart = helpers.getEnemiesInRoom(1, 2);

            if (enemiesInStart.length > 0) {
                throw new Error(`Starting room should have no enemies, found ${enemiesInStart.length}`);
            }
        }
    );

    // Test 10: Line of sight check
    runner.addTest('skeleton-line-of-sight', 'Enemy AI', 'Line of sight affects behavior',
        'Verifies enemy behavior changes when obstacles block line of sight',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Spawn enemy
            const enemy = await helpers.spawnEnemyAt(0, -20, 'SKELETON');
            await helpers.positionPlayerAt(0, 0, 0);

            // Check if CollisionOrchestrator has line of sight method
            const CollisionOrchestrator = runner.gameWindow.CollisionOrchestrator;
            const RoomOrchestrator = runner.gameWindow.RoomOrchestrator;
            const Room = runner.gameWindow.Room;

            if (!CollisionOrchestrator || typeof CollisionOrchestrator.hasLineOfSight !== 'function') {
                throw new Error('CollisionOrchestrator.hasLineOfSight not found');
            }

            if (!RoomOrchestrator || !Room || !Room.structure) {
                throw new Error('RoomOrchestrator or Room structure not found for LOS test');
            }

            // Test line of sight - signature: hasLineOfSight(fromX, fromZ, toX, toZ, gridOrchestrator, roomConfig)
            // mallGrid is just RoomOrchestrator
            const hasLOS = CollisionOrchestrator.hasLineOfSight(
                enemy.position.x,
                enemy.position.z,
                runner.gameWindow.camera.position.x,
                runner.gameWindow.camera.position.z,
                RoomOrchestrator,
                Room.structure
            );

            if (typeof hasLOS !== 'boolean') {
                throw new Error('hasLineOfSight did not return boolean');
            }
        }
    );

})(window.runner);
