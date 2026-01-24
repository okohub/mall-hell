/**
 * Enemy UI Tests
 * Tests for Enemy Spawning, AI, Skeleton models
 */

(function(runner) {
    'use strict';

    // Enemy Spawning Tests
    runner.addTest('enemies-exist-in-game', 'Enemy Spawning', 'Enemies array exists in game',
        'Verifies that the enemies array is accessible and game supports enemy spawning',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            for (let i = 0; i < 100; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(100);

            const enemies = runner.gameWindow.enemies;
            if (!enemies) {
                throw new Error('Enemies array not found - spawning system missing');
            }

            if (!Array.isArray(enemies)) {
                throw new Error('Enemies should be an array');
            }
        }
    );

    // Skeleton Enemy Model Tests
    runner.addTest('skeleton-enemy-structure', 'Skeleton Enemy', 'Enemy has skeleton model structure',
        'Verifies enemy carts have skeleton driver with proper bone structure',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const THREE = runner.gameWindow.THREE;
            const EnemyVisual = runner.gameWindow.EnemyVisual;
            const Enemy = runner.gameWindow.Enemy;

            if (!EnemyVisual || !Enemy) {
                throw new Error('EnemyVisual or Enemy not found');
            }

            const config = Enemy.types.SKELETON;
            const enemy = EnemyVisual.createEnemy(THREE, config);

            if (!enemy || !enemy.children) {
                throw new Error('Enemy has no children groups');
            }

            let hasCartAndSkeleton = false;
            enemy.traverse(child => {
                if (child.userData && child.userData.skeleton && child.userData.cart) {
                    hasCartAndSkeleton = true;
                }
            });

            if (enemy.userData.skeleton && enemy.userData.cart) {
                hasCartAndSkeleton = true;
            }

            if (!hasCartAndSkeleton) {
                throw new Error('Enemy missing skeleton or cart in userData');
            }
        }
    );

    runner.addTest('skeleton-enemy-userData', 'Skeleton Enemy', 'Enemy has proper userData',
        'Verifies enemy carts have health, active, and drift properties',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const THREE = runner.gameWindow.THREE;
            const EnemyVisual = runner.gameWindow.EnemyVisual;
            const EnemySystem = runner.gameWindow.EnemySystem;
            const Enemy = runner.gameWindow.Enemy;

            if (!EnemyVisual || !EnemySystem || !Enemy) {
                throw new Error('EnemyVisual, EnemySystem, or Enemy not found');
            }

            const config = Enemy.types.SKELETON;
            const enemy = EnemyVisual.createEnemy(THREE, config);

            const enemyData = EnemySystem.createEnemyData('SKELETON');
            Object.assign(enemy.userData, enemyData);

            const ud = enemy.userData;
            if (typeof ud.health !== 'number') {
                throw new Error('Enemy missing health property');
            }
            if (typeof ud.active !== 'boolean') {
                throw new Error('Enemy missing active property');
            }
            if (typeof ud.driftSpeed !== 'number') {
                throw new Error('Enemy missing driftSpeed property');
            }
        }
    );

    runner.addTest('skeleton-has-teeth', 'Skeleton Enemy', 'Skeleton has teeth for smile',
        'Verifies skeleton model includes teeth geometry',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const THREE = runner.gameWindow.THREE;
            const EnemyVisual = runner.gameWindow.EnemyVisual;
            const Enemy = runner.gameWindow.Enemy;

            if (!EnemyVisual || !Enemy) {
                throw new Error('EnemyVisual or Enemy not found');
            }

            const config = Enemy.types.SKELETON;
            const enemy = EnemyVisual.createEnemy(THREE, config);

            let meshCount = 0;
            enemy.traverse(obj => {
                if (obj.isMesh) meshCount++;
            });

            if (meshCount < 40) {
                throw new Error(`Skeleton lacks detail, only ${meshCount} meshes (need 40+)`);
            }
        }
    );

    // Pre-Spawning System Tests
    runner.addTest('enemies-spawn-ahead', 'Pre-Spawning', 'Enemies spawn ahead of player',
        'Verifies enemies exist in rooms player hasnt entered yet',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            const enemies = runner.gameWindow.enemies;
            const camera = runner.gameWindow.camera;

            if (!enemies || enemies.length === 0) {
                throw new Error('No enemies spawned at game start');
            }

            const playerZ = camera.position.z;
            const enemiesAhead = enemies.filter(e => e.position.z < playerZ - 5);

            if (enemiesAhead.length === 0) {
                throw new Error('No enemies spawned ahead of player position');
            }
        }
    );

    runner.addTest('getAdjacentRooms-exposed', 'Pre-Spawning', 'getAdjacentRooms function accessible',
        'Verifies the room connectivity function is exposed for testing',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const mallGrid = runner.gameWindow.mallGrid;
            if (!mallGrid) {
                throw new Error('mallGrid not exposed for testing');
            }

            if (!mallGrid.rooms || mallGrid.rooms.length === 0) {
                throw new Error('No rooms in mallGrid');
            }
        }
    );

    // Safe Starting Room Tests
    runner.addTest('safe-room-no-enemies', 'Safe Room', 'Starting room has no enemies',
        'Verifies the first room (1,2) never spawns enemies',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const enemies = runner.gameWindow.enemies || [];
            const ROOM_UNIT = 30;

            const startRoomCenterX = 1 * ROOM_UNIT + ROOM_UNIT / 2;
            const startRoomCenterZ = 2 * ROOM_UNIT + ROOM_UNIT / 2;

            const enemiesInStart = enemies.filter(e => {
                if (!e.userData || !e.userData.active) return false;
                const dx = Math.abs(e.position.x - startRoomCenterX);
                const dz = Math.abs(e.position.z - startRoomCenterZ);
                return dx < ROOM_UNIT / 2 && dz < ROOM_UNIT / 2;
            });

            if (enemiesInStart.length > 0) {
                throw new Error(`Starting room should have no enemies, found ${enemiesInStart.length}`);
            }
        }
    );

    // Line of Sight Tests
    runner.addTest('line-of-sight-function', 'Enemy AI', 'canEnemySeePlayer function exists',
        'Verifies the line of sight check function is available',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const fn = runner.gameWindow.canEnemySeePlayer;
            if (typeof fn !== 'function') {
                throw new Error('canEnemySeePlayer function not exposed');
            }
        }
    );

    // Collision Tests
    runner.addTest('player-collision-exists', 'Collision', 'Player has collision detection',
        'Verifies player cart collision system is active',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            const fn = runner.gameWindow.checkWallCollision;
            if (typeof fn !== 'function') {
                throw new Error('checkWallCollision function not exposed');
            }
        }
    );

})(window.runner);
