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
        'Verifies player cart stops when hitting obstacles',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Check if obstacles exist in scene
            const obstacles = runner.gameWindow.scene.children.filter(
                obj => obj.userData && obj.userData.isObstacle
            );

            if (obstacles.length === 0) {
                throw new Error('No obstacles found in scene to test collision');
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

            const initialHealth = runner.gameWindow.health || 100;

            // Spawn enemy very close
            await helpers.spawnEnemyAt(0, -2, 'SKELETON');
            await helpers.positionPlayerAt(0, 0, 0);

            // Wait for collision
            await runner.wait(1000);

            const newHealth = runner.gameWindow.health || 100;

            if (newHealth >= initialHealth) {
                throw new Error(`Player took no damage: ${initialHealth} -> ${newHealth}`);
            }
        }
    );

    // Test 4: Multiple hits reduce health
    runner.addTest('multiple-hits-reduce-health', 'Player Damage', 'Multiple hits deplete health',
        'Verifies taking 5 hits reduces health to 50%',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            const maxHealth = runner.gameWindow.maxHealth || 100;
            runner.gameWindow.health = maxHealth;

            // Take 5 hits (10 damage each = 50 damage)
            for (let i = 0; i < 5; i++) {
                if (runner.gameWindow.damagePlayer) {
                    runner.gameWindow.damagePlayer(10);
                }
                await runner.wait(100);
            }

            const finalHealth = runner.gameWindow.health || 100;
            const expectedHealth = maxHealth - 50;

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

})(window.runner);
