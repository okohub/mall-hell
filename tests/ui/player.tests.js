/**
 * Player UI Tests
 * Tests for Player Movement, Health UI, Controls
 */

(function(runner) {
    'use strict';

    // Player Movement Tests
    runner.addTest('movement-wasd-forward', 'Player Movement', 'W key drives cart forward',
        'Verifies pressing W moves the cart forward',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            const initialZ = runner.gameWindow.playerPosition?.z || 0;
            runner.simulateKeyDown('KeyW');
            await runner.wait(300);
            const newZ = runner.gameWindow.playerPosition?.z || 0;
            runner.simulateKeyUp('KeyW');
            if (Math.abs(newZ - initialZ) < 0.1) {
                throw new Error(`Cart did not move. Initial Z: ${initialZ}, New Z: ${newZ}`);
            }
        }
    );

    runner.addTest('movement-wasd-turn', 'Player Movement', 'A/D keys turn cart',
        'Verifies pressing A/D rotates the cart',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            const initialRot = runner.gameWindow.playerRotation || 0;
            runner.simulateKeyDown('KeyA');
            await runner.wait(300);
            const newRot = runner.gameWindow.playerRotation || 0;
            runner.simulateKeyUp('KeyA');
            if (Math.abs(newRot - initialRot) < 0.01) {
                throw new Error(`Cart did not turn. Initial: ${initialRot}, New: ${newRot}`);
            }
        }
    );

    runner.addTest('wasd-keys', 'Keyboard Controls', 'WASD keys control driving',
        'Verifies WASD keys set movement keys for driving',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            runner.simulateKeyDown('KeyW');
            await runner.wait(50);
            if (!runner.gameWindow.keys.forward) {
                throw new Error('W did not set keys.forward');
            }
            runner.simulateKeyUp('KeyW');

            runner.simulateKeyDown('KeyA');
            await runner.wait(50);
            if (!runner.gameWindow.keys.turnLeft) {
                throw new Error('A did not set keys.turnLeft');
            }
            runner.simulateKeyUp('KeyA');
        }
    );

    runner.addTest('movement-bounds-check', 'Player Movement', 'Cart stays within bounds',
        'Verifies cart cannot move outside game boundaries',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            const MOVEMENT_BOUND = 10;

            runner.simulateKeyDown('ArrowLeft');
            await runner.wait(400);
            runner.simulateKeyUp('ArrowLeft');
            await runner.wait(100);

            const leftX = runner.gameWindow.playerX || 0;
            if (leftX < -MOVEMENT_BOUND - 0.5) {
                throw new Error(`Cart moved outside left boundary. X position: ${leftX}, Min allowed: ${-MOVEMENT_BOUND}`);
            }

            runner.simulateKeyDown('ArrowRight');
            await runner.wait(800);
            runner.simulateKeyUp('ArrowRight');
            await runner.wait(100);

            const rightX = runner.gameWindow.playerX || 0;
            if (rightX > MOVEMENT_BOUND + 0.5) {
                throw new Error(`Cart moved outside right boundary. X position: ${rightX}, Max allowed: ${MOVEMENT_BOUND}`);
            }
        }
    );

    runner.addTest('movement-disabled-when-paused', 'Player Movement', 'Controls disabled when paused',
        'Verifies movement controls do not work when game is paused',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            runner.simulateKeyDown('Escape');
            await runner.wait(200);

            if (runner.getGameState() !== 'PAUSED') {
                throw new Error('Game not paused');
            }

            const initialX = runner.gameWindow.playerX || 0;

            runner.simulateKeyDown('ArrowLeft');
            runner.simulateKeyDown('ArrowRight');
            await runner.wait(100);

            const newX = runner.gameWindow.playerX || 0;
            if (newX !== initialX) {
                throw new Error(`Cart moved while paused. Initial: ${initialX}, New: ${newX}`);
            }
        }
    );

    // Player Health UI Tests
    runner.addTest('health-bar-visible', 'Player Health UI', 'Health bar visible in HUD',
        'Verifies health bar is visible in HUD during gameplay',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            const healthBar = runner.getElement('#health-bar') || runner.getElement('.health-bar') || runner.getElement('[class*="health"]');
            if (!healthBar) {
                throw new Error('Health bar element not found in HUD');
            }
            if (!runner.isVisible(healthBar)) {
                throw new Error('Health bar is not visible');
            }
        }
    );

    runner.addTest('health-bar-100-at-start', 'Player Health UI', 'Health bar shows 100% at start',
        'Verifies health bar shows full health at game start',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            const health = runner.gameWindow.health || runner.gameWindow.cart?.health || runner.gameWindow.playerHealth || 100;
            const maxHealth = runner.gameWindow.maxHealth || runner.gameWindow.cart?.maxHealth || 100;

            if (health !== maxHealth) {
                throw new Error(`Health not at max on start. Current: ${health}, Max: ${maxHealth}`);
            }

            const healthFill = runner.getElement('#health-fill') || runner.getElement('.health-fill') || runner.getElement('[class*="health-fill"]');
            if (healthFill) {
                const width = parseFloat(runner.gameWindow.getComputedStyle(healthFill).width);
                const parentWidth = parseFloat(runner.gameWindow.getComputedStyle(healthFill.parentElement).width);
                const percentage = (width / parentWidth) * 100;
                if (percentage < 95) {
                    throw new Error(`Health bar not showing 100%. Showing approximately ${percentage.toFixed(1)}%`);
                }
            }
        }
    );

    runner.addTest('health-bar-element-id', 'Player Health UI', 'Health bar element exists with correct ID',
        'Verifies health bar element has correct ID attribute',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);

            const healthBar = runner.getElement('#health-bar');
            if (!healthBar) {
                const altHealthBar = runner.getElement('.health-bar') || runner.getElement('[class*="health"]');
                if (altHealthBar) {
                    throw new Error('Health bar exists but does not have id="health-bar"');
                }
                throw new Error('Health bar element with id="health-bar" not found');
            }
        }
    );

    runner.addTest('damage-overlay-flash', 'Player Health UI', 'Damage overlay flashes on hit',
        'Verifies damage overlay flashes when player takes damage',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            const damageOverlay = runner.getElement('#damage-overlay');
            if (!damageOverlay) {
                throw new Error('Damage overlay element not found');
            }

            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Not in PLAYING state, got ${runner.getGameState()}`);
            }

            const hadFlashBefore = damageOverlay.classList.contains('flash');

            if (runner.gameWindow.damagePlayer) {
                runner.gameWindow.damagePlayer(10);
            }

            const hasFlashAfter = damageOverlay.classList.contains('flash');

            if (!hasFlashAfter && !hadFlashBefore) {
                const opacity = parseFloat(runner.gameWindow.getComputedStyle(damageOverlay).opacity) || 0;
                if (opacity <= 0) {
                    throw new Error('Damage overlay did not flash (no flash class and opacity is 0)');
                }
            }

            if (!hasFlashAfter && hadFlashBefore) {
                throw new Error('Flash class was already present before damage');
            }
        }
    );

    runner.addTest('gameover-wrecked-message', 'Player Health UI', 'Game over shows "WRECKED!" on death',
        'Verifies game over screen displays "WRECKED!" message when player dies',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            runner.gameWindow.gameState = 'PLAYING';
            runner.gameWindow.health = 0;
            if (runner.gameWindow.cart) {
                runner.gameWindow.cart.health = 0;
            }

            if (runner.gameWindow.endGame) {
                runner.gameWindow.endGame(true);
            } else if (runner.gameWindow.gameOver) {
                runner.gameWindow.gameOver(true);
            }

            await runner.wait(200);

            const gameoverScreen = runner.getElement('#gameover-screen');
            if (!runner.isVisible(gameoverScreen)) {
                throw new Error('Game over screen not visible');
            }

            const gameoverText = gameoverScreen.textContent || gameoverScreen.innerText;
            if (!gameoverText.toUpperCase().includes('WRECKED')) {
                throw new Error(`Game over screen does not contain "WRECKED!" message. Content: "${gameoverText.substring(0, 100)}..."`);
            }
        }
    );

    runner.addTest('health-container-hidden-in-menu', 'Player Health UI', 'Health hidden in menu',
        'Verifies health container is hidden when in menu state',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const healthContainer = runner.getElement('#health-container');
            if (!healthContainer) {
                throw new Error('Health container element not found');
            }

            const computedStyle = runner.gameWindow.getComputedStyle(healthContainer);
            if (computedStyle.display !== 'none') {
                throw new Error(`Health container should be hidden in menu, but display is: ${computedStyle.display}`);
            }
        }
    );

    runner.addTest('health-container-visible-in-game', 'Player Health UI', 'Health visible during gameplay',
        'Verifies health container is visible when playing',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            const healthContainer = runner.getElement('#health-container');
            if (!healthContainer) {
                throw new Error('Health container element not found');
            }

            const computedStyle = runner.gameWindow.getComputedStyle(healthContainer);
            if (computedStyle.display === 'none') {
                throw new Error('Health container should be visible during gameplay');
            }
        }
    );

    runner.addTest('health-container-hidden-when-paused', 'Player Health UI', 'Health hidden when paused',
        'Verifies health container is hidden when game is paused',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);
            runner.simulateKeyDown('Escape');
            await runner.wait(300);

            const healthContainer = runner.getElement('#health-container');
            const computedStyle = runner.gameWindow.getComputedStyle(healthContainer);
            if (computedStyle.display !== 'none') {
                throw new Error(`Health container should be hidden when paused, but display is: ${computedStyle.display}`);
            }
        }
    );

    runner.addTest('health-container-bottom-left-position', 'Player Health UI', 'Health bar at bottom-left',
        'Verifies health container is positioned at bottom-left corner',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            const healthContainer = runner.getElement('#health-container');
            const rect = healthContainer.getBoundingClientRect();
            const windowHeight = runner.gameWindow.innerHeight;

            if (rect.top < windowHeight / 2) {
                throw new Error(`Health container is in top half (top: ${rect.top}px), expected bottom-left`);
            }
            if (rect.left > 200) {
                throw new Error(`Health container is not on left side (left: ${rect.left}px), expected left side`);
            }
        }
    );

    runner.addTest('health-no-overlap-with-score', 'Player Health UI', 'Health does not overlap score',
        'Verifies health container does not overlap with score container',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            const healthContainer = runner.getElement('#health-container');
            const scoreContainer = runner.getElement('#score-container');

            if (!healthContainer || !scoreContainer) {
                throw new Error('Could not find health or score containers');
            }

            const healthRect = healthContainer.getBoundingClientRect();
            const scoreRect = scoreContainer.getBoundingClientRect();

            const overlaps = !(healthRect.right < scoreRect.left ||
                              healthRect.left > scoreRect.right ||
                              healthRect.bottom < scoreRect.top ||
                              healthRect.top > scoreRect.bottom);

            if (overlaps) {
                throw new Error(`Health container overlaps with score container. Health: top=${healthRect.top}, Score: bottom=${scoreRect.bottom}`);
            }
        }
    );

})(window.runner);
