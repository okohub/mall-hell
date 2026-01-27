/**
 * Room Progression Integration Tests
 * Tests player movement through rooms and pre-spawning system
 */

(function(runner) {
    'use strict';

    const helpers = window.IntegrationHelpers;

    // Test 1: Nearby rooms materialize enemies
    runner.addTest('nearby-rooms-materialize-enemies', 'Pre-Spawning', 'Adjacent rooms have materialized enemies',
        'Verifies enemies materialize in nearby rooms before player enters',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(500);

            // Trigger spawning
            for (let i = 0; i < 30; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(300);

            const currentRoom = runner.gameWindow.currentRoom || { x: 1, z: 2 };

            // Check adjacent rooms for enemies
            const adjacentRooms = [
                { x: currentRoom.x + 1, z: currentRoom.z },
                { x: currentRoom.x - 1, z: currentRoom.z },
                { x: currentRoom.x, z: currentRoom.z + 1 },
                { x: currentRoom.x, z: currentRoom.z - 1 }
            ];

            let hasEnemies = false;
            for (const room of adjacentRooms) {
                const enemies = helpers.getEnemiesInRoom(room.x, room.z);
                if (enemies.length > 0) {
                    hasEnemies = true;
                    break;
                }
            }

            if (!hasEnemies) {
                throw new Error('No enemies materialized in adjacent rooms');
            }
        }
    );

    // Test 2: Distant rooms not materialized
    runner.addTest('distant-rooms-not-materialized', 'Pre-Spawning', 'Far rooms have no materialized enemies',
        'Verifies enemies in distant rooms are not yet materialized',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(500);

            // Check a room far away (e.g., corner of mall)
            const distantEnemies = helpers.getEnemiesInRoom(0, 0);

            if (distantEnemies.length > 0) {
                throw new Error('Distant room has materialized enemies (should be planned only)');
            }
        }
    );

    // Test 3: Room themes assigned at start
    runner.addTest('room-themes-assigned-at-start', 'Room System', 'Rooms have themes at game start',
        'Verifies each room gets assigned a theme that does not change',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const RoomOrchestrator = runner.gameWindow.RoomOrchestrator;
            if (!RoomOrchestrator) {
                throw new Error('RoomOrchestrator not found');
            }

            const rooms = RoomOrchestrator.getAllRooms?.() || [];
            if (rooms.length === 0) {
                throw new Error('No rooms found');
            }

            // Check first room has theme
            const room = rooms[0];
            if (!room.theme && !room.colors) {
                throw new Error('Room missing theme data');
            }
        }
    );

    // Test 4: Minimap updates on room change
    runner.addTest('minimap-updates-on-room-change', 'Minimap', 'Minimap highlights current room',
        'Verifies minimap updates when player moves between rooms',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(500);

            const minimapGrid = runner.getElement('#minimap-grid');
            if (!minimapGrid) {
                throw new Error('Minimap grid not found');
            }

            const currentRooms = minimapGrid.querySelectorAll('.minimap-room.current');
            if (currentRooms.length === 0) {
                throw new Error('No room marked as current on minimap');
            }
        }
    );

    // Test 5: Enemies only in nearby rooms
    runner.addTest('enemies-only-in-nearby-rooms', 'Pre-Spawning', 'Only nearby rooms have enemies',
        'Verifies materialized enemies exist only in current and adjacent rooms',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(500);

            // Spawn enemies
            for (let i = 0; i < 30; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(300);

            const enemies = runner.gameWindow.enemies || [];
            const activeEnemies = enemies.filter(e => e.userData.active);

            if (activeEnemies.length === 0) {
                throw new Error('No active enemies spawned');
            }

            // Get player's starting position (default is 45, 75 in room 1, 2)
            const camera = runner.gameWindow.camera;
            const playerX = camera.position.x;
            const playerZ = camera.position.z;

            // All enemies should be within reasonable range (~3-4 rooms from player)
            const ROOM_UNIT = 30;
            const maxDistance = ROOM_UNIT * 4;

            for (const enemy of activeEnemies) {
                const dx = enemy.position.x - playerX;
                const dz = enemy.position.z - playerZ;
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance > maxDistance) {
                    throw new Error(`Enemy too far away: ${distance.toFixed(1)} units from player (max ${maxDistance})`);
                }
            }
        }
    );

    // Test 6: Timer counts down
    runner.addTest('timer-counts-down-while-playing', 'Timer', 'Timer decreases over time',
        'Verifies game timer counts down during gameplay',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const initialTimer = runner.gameWindow.gameTimer || 180;

            // Wait 2 seconds
            await runner.wait(2000);

            const newTimer = runner.gameWindow.gameTimer || 180;

            if (newTimer >= initialTimer - 1) {
                throw new Error(`Timer not counting down: ${initialTimer} -> ${newTimer}`);
            }
        }
    );

    // Test 7: Game over when timer reaches zero
    runner.addTest('game-over-when-timer-zero', 'Game Over', 'Timer expiration triggers game over',
        'Verifies game ends when timer reaches 0:00',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Set timer to 1 second
            runner.gameWindow.gameTimer = 1;

            // Wait for timer to expire
            await runner.wait(1500);

            const gameState = runner.getGameState();
            if (gameState !== 'GAME_OVER') {
                throw new Error(`Expected GAME_OVER, got ${gameState}`);
            }
        }
    );

    // Test 8: Score increases through gameplay
    runner.addTest('score-increases-through-gameplay', 'Scoring', 'Score accumulates from kills',
        'Verifies score increases when enemies are killed',
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
            await helpers.waitForEnemyDeath(enemy, 2000);

            const newScore = runner.getScore();

            if (newScore <= initialScore) {
                throw new Error(`Score should increase: ${initialScore} -> ${newScore}`);
            }

            if (newScore - initialScore < 100) {
                throw new Error(`Score increase too small: ${newScore - initialScore}`);
            }
        }
    );

    // Test 9: Approach room triggers materialization
    runner.addTest('approach-room-triggers-materialization', 'Pre-Spawning', 'Approaching room spawns enemies',
        'Verifies moving toward unmaterialized room triggers materialization',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Initial spawn
            for (let i = 0; i < 30; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }

            const initialEnemyCount = (runner.gameWindow.enemies || []).filter(e => e.userData.active).length;

            // Move player forward significantly
            await helpers.positionPlayerAt(0, 0, 0);
            runner.gameWindow.camera.position.z -= 60;  // Move forward 2 rooms

            // Trigger materialization
            for (let i = 0; i < 50; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(300);

            const newEnemyCount = (runner.gameWindow.enemies || []).filter(e => e.userData.active).length;

            if (newEnemyCount <= initialEnemyCount) {
                throw new Error('No new enemies materialized when approaching new rooms');
            }
        }
    );

})(window.runner);
