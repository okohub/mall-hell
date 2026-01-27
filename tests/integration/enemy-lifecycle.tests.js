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

})(window.runner);
