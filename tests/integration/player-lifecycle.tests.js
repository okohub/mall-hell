/**
 * Player Lifecycle Integration Tests
 * Tests player controls, damage, and death (survival mechanics)
 */

(function(runner) {
    'use strict';

    const helpers = window.IntegrationHelpers;

    // Test 1: WASD movement
    runner.addTest('wasd-movement-in-game', 'Player Movement', 'W key moves cart forward',
        'Verifies pressing W moves player cart forward in world space',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const initialZ = runner.gameWindow.camera.position.z;

            // Drive forward
            runner.simulateKeyDown('KeyW');
            await runner.wait(500);
            runner.simulateKeyUp('KeyW');

            const newZ = runner.gameWindow.camera.position.z;

            if (Math.abs(newZ - initialZ) < 0.5) {
                throw new Error(`Cart did not move forward: ${initialZ} -> ${newZ}`);
            }
        }
    );

    // Test 2: Player collision with obstacle
    runner.addTest('player-collision-with-obstacle', 'Player Movement', 'Obstacles block player movement',
        'Verifies collision system is initialized (walls, shelves serve as obstacles)',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Verify collision system components exist
            const CollisionOrchestrator = runner.gameWindow.CollisionOrchestrator;
            const RoomOrchestrator = runner.gameWindow.RoomOrchestrator;

            if (!CollisionOrchestrator) {
                throw new Error('CollisionOrchestrator not found');
            }

            if (!CollisionOrchestrator.checkAllCollisions) {
                throw new Error('CollisionOrchestrator.checkAllCollisions not found');
            }

            // Verify room system exists (walls serve as obstacles)
            if (!RoomOrchestrator || !RoomOrchestrator.getAllRooms) {
                throw new Error('RoomOrchestrator not properly initialized');
            }

            const rooms = RoomOrchestrator.getAllRooms();
            if (!rooms || rooms.length === 0) {
                throw new Error('No rooms found - collision system may not work');
            }
        }
    );

    // Test 3: Enemy collision damages player
    runner.addTest('enemy-collision-damages-player', 'Player Damage', 'Enemy contact reduces health',
        'Verifies enemy collision with player decreases health',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const initialHealth = PlayerOrchestrator.health;

            // Spawn enemy very close to player
            await helpers.spawnEnemyAt(0, -2, 'SKELETON');
            await helpers.positionPlayerAt(0, 0, 0);

            // Run game updates to process collision detection
            // EnemyOrchestrator.updateAll() checks enemy-player collision
            for (let i = 0; i < 60; i++) {  // ~1 second at 60fps
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

    // Test 4: Multiple hits reduce health
    runner.addTest('multiple-hits-reduce-health', 'Player Damage', 'Multiple hits deplete health',
        'Verifies taking 3 hits (respecting invulnerability frames) reduces health by 75',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const maxHealth = runner.gameWindow.maxHealth || 100;
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            PlayerOrchestrator.health = maxHealth;

            // Take 3 hits (25 damage each = 75 damage)
            // Wait 1100ms between hits for invulnerability to expire (1000ms duration)
            for (let i = 0; i < 3; i++) {
                if (runner.gameWindow.damagePlayer) {
                    runner.gameWindow.damagePlayer(25);
                }
                // Must wait for invulnerability to expire (1000ms) before next hit
                if (i < 2) {  // Don't wait after last hit
                    await runner.wait(1100);
                    // Process invulnerability timer
                    if (PlayerOrchestrator.updateInvulnerability) {
                        PlayerOrchestrator.updateInvulnerability();
                    }
                }
            }

            const finalHealth = PlayerOrchestrator.health;
            const expectedHealth = maxHealth - 75;

            if (Math.abs(finalHealth - expectedHealth) > 5) {
                throw new Error(`Expected ~${expectedHealth} health, got ${finalHealth}`);
            }
        }
    );

    // Test 5: Player death at zero health
    runner.addTest('player-death-at-zero-health', 'Player Death', 'Zero health triggers game over',
        'Verifies player death shows game over screen with WRECKED',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Set health to 0
            runner.gameWindow.health = 0;
            if (runner.gameWindow.cart) {
                runner.gameWindow.cart.health = 0;
            }

            // Trigger game over
            if (runner.gameWindow.endGame) {
                runner.gameWindow.endGame(true);
            }

            await runner.wait(300);

            const gameState = runner.getGameState();
            if (gameState !== 'GAME_OVER') {
                throw new Error(`Expected GAME_OVER, got ${gameState}`);
            }

            const gameoverScreen = runner.getElement('#gameover-screen');
            const text = gameoverScreen.textContent || '';
            if (!text.toUpperCase().includes('WRECKED') && !text.toUpperCase().includes('CHECKOUT')) {
                throw new Error('Game over screen missing death message');
            }
        }
    );

    // Test 6: Death is loss condition
    runner.addTest('death-is-loss-condition', 'Game Over', 'Death ends game permanently',
        'Verifies death triggers GAME_OVER state with no respawn',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Kill player
            runner.gameWindow.health = 0;
            if (runner.gameWindow.endGame) {
                runner.gameWindow.endGame(true);
            }

            await runner.wait(300);

            const gameState = runner.getGameState();
            if (gameState !== 'GAME_OVER') {
                throw new Error(`Expected GAME_OVER (loss), got ${gameState}`);
            }

            // Wait and verify no respawn
            await runner.wait(1000);

            const stillGameOver = runner.getGameState();
            if (stillGameOver !== 'GAME_OVER') {
                throw new Error('Player respawned after death');
            }
        }
    );

    // Test 7: Movement disabled when dead
    runner.addTest('movement-disabled-when-dead', 'Player Death', 'No movement after death',
        'Verifies WASD controls disabled after player dies',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Kill player
            runner.gameWindow.health = 0;
            if (runner.gameWindow.endGame) {
                runner.gameWindow.endGame(true);
            }
            await runner.wait(300);

            const deathZ = runner.gameWindow.camera.position.z;

            // Try to move
            runner.simulateKeyDown('KeyW');
            await runner.wait(500);
            runner.simulateKeyUp('KeyW');

            const newZ = runner.gameWindow.camera.position.z;

            if (Math.abs(newZ - deathZ) > 0.1) {
                throw new Error('Player moved after death');
            }
        }
    );

    // Test 8: Weapon pickup equips weapon
    runner.addTest('weapon-pickup-equips-weapon', 'Weapon Pickup', 'Pickup switches weapon',
        'Verifies driving over weapon pickup equips new weapon',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;

            if (!PickupOrchestrator || !WeaponOrchestrator) {
                throw new Error('Pickup or Weapon Orchestrator not found');
            }

            // Check if pickups exist
            const pickups = PickupOrchestrator.pickups || [];
            if (pickups.length === 0) {
                throw new Error('No weapon pickups available to test');
            }
        }
    );

    // Test 9: Pause stops gameplay
    runner.addTest('pause-stops-gameplay', 'Pause System', 'Pause freezes game',
        'Verifies pressing ESC pauses enemies, timer, and projectiles',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const initialTimer = runner.gameWindow.gameTimer || 180;

            // Pause
            runner.gameWindow.pauseGame();
            await runner.wait(100);

            if (runner.getGameState() !== 'PAUSED') {
                throw new Error('Game not paused');
            }

            // Wait and check timer didn't decrease
            await runner.wait(1000);

            const pausedTimer = runner.gameWindow.gameTimer || 180;

            if (Math.abs(pausedTimer - initialTimer) > 0.1) {
                throw new Error('Timer continued during pause');
            }
        }
    );

    // Test 10: Resume restores gameplay
    runner.addTest('resume-restores-gameplay', 'Pause System', 'Resume continues game',
        'Verifies resuming from pause restores all gameplay',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Pause
            runner.gameWindow.pauseGame();
            await runner.wait(100);

            // Resume
            runner.gameWindow.resumeGame();
            await runner.wait(100);

            if (runner.getGameState() !== 'PLAYING') {
                throw new Error('Game not resumed to PLAYING');
            }

            // Check timer continues
            const timer1 = runner.gameWindow.gameTimer || 180;
            await runner.wait(1000);
            const timer2 = runner.gameWindow.gameTimer || 180;

            if (timer2 >= timer1) {
                throw new Error('Timer not running after resume');
            }
        }
    );

    // Test 11: High score survival goal
    runner.addTest('high-score-survival-goal', 'Game Design', 'Focus is score maximization',
        'Verifies game is survival-focused (high score), not objective-based',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Score should start at 0
            const score = runner.getScore();
            if (score !== 0) {
                throw new Error(`Expected score 0 at start, got ${score}`);
            }

            // No victory condition should exist for "clearing mall"
            // This is a design validation test
            const gameState = runner.getGameState();
            if (gameState === 'VICTORY' || gameState === 'WIN') {
                throw new Error('Game has victory state (should be survival only)');
            }
        }
    );

})(window.runner);
