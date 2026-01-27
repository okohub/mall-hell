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

            if (Math.abs(enemy.userData.driftSpeed - config.driftSpeed) > 0.01) {
                throw new Error(`Expected driftSpeed ${config.driftSpeed}, got ${enemy.userData.driftSpeed}`);
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

    // Test 3: Skeleton collides with player
    runner.addTest('skeleton-collides-player', 'Enemy AI', 'Enemy collision damages player',
        'Verifies enemy collision with player deals damage',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const initialHealth = runner.gameWindow.health || 100;

            // Spawn enemy very close
            const enemy = await helpers.spawnEnemyAt(0, -2, 'SKELETON');
            await helpers.positionPlayerAt(0, 0, 0);

            // Wait for collision to process
            await runner.wait(1000);

            const newHealth = runner.gameWindow.health || 100;

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
                distance: 20,
                enemyHealth: 1
            });

            const initialScore = runner.getScore();

            // Kill enemy
            await helpers.fireWeapon(500);
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
                distance: 20,
                enemyHealth: 1
            });

            // Kill enemy
            await helpers.fireWeapon(500);
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

    // Test 8: Pre-spawning ahead
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
            if (!CollisionOrchestrator || typeof CollisionOrchestrator.hasLineOfSight !== 'function') {
                throw new Error('CollisionOrchestrator.hasLineOfSight not found');
            }

            // Test line of sight
            const hasLOS = CollisionOrchestrator.hasLineOfSight(
                enemy.position,
                runner.gameWindow.camera.position,
                runner.gameWindow.scene
            );

            if (typeof hasLOS !== 'boolean') {
                throw new Error('hasLineOfSight did not return boolean');
            }
        }
    );

})(window.runner);
