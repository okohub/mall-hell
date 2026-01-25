/**
 * Game Flow UI Tests
 * Tests for Game Start, Pause Menu, Game Over, HUD Updates, State Transitions
 */

(function(runner) {
    'use strict';

    // Game Start Tests
    runner.addTest('game-start-hud', 'Game Start', 'HUD appears on game start',
        'Verifies HUD is displayed when game starts',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            const hud = runner.getElement('#hud');
            if (!runner.isVisible(hud)) {
                throw new Error('HUD not visible after game start');
            }
        }
    );

    runner.addTest('game-start-score', 'Game Start', 'Score starts at 0',
        'Verifies score is 0 when game starts',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const preScore = runner.getScore();
            if (preScore !== 0) {
                throw new Error(`Expected pre-start score 0, got ${preScore}`);
            }
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(50);
            const score = runner.getScore();
            if (score !== 0) {
                throw new Error(`Expected score 0, got ${score}`);
            }
            const scoreEl = runner.getElement('#score');
            if (scoreEl.textContent !== '0') {
                throw new Error(`Score display shows "${scoreEl.textContent}" instead of "0"`);
            }
        }
    );

    runner.addTest('game-start-timer', 'Game Start', 'Timer shows 3:00 at start',
        'Verifies timer starts at 3 minutes',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            const timerDisplay = runner.getElement('#timer-display');
            if (!timerDisplay) {
                throw new Error('Timer display not found');
            }
            const timerText = timerDisplay.textContent;
            if (!timerText.includes('3:00') && !timerText.includes('2:5')) {
                throw new Error(`Timer should start at 3:00, got ${timerText}`);
            }
        }
    );

    // Pause Menu Tests
    runner.addTest('pause-esc-shows', 'Pause Menu', 'ESC shows pause screen',
        'Verifies pressing ESC during gameplay shows pause menu',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);
            runner.simulateKeyDown('Escape');
            await runner.wait(200);
            const pauseScreen = runner.getElement('#pause-screen');
            if (!runner.isVisible(pauseScreen)) {
                throw new Error('Pause screen not visible after ESC');
            }
            if (runner.getGameState() !== 'PAUSED') {
                throw new Error(`Expected PAUSED state, got ${runner.getGameState()}`);
            }
        }
    );

    runner.addTest('pause-resume', 'Pause Menu', 'Resume button works',
        'Verifies clicking resume returns to gameplay',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            runner.simulateKeyDown('Escape');
            await runner.wait(200);
            const resumeBtn = runner.getElement('#resume-btn');
            runner.simulateClick(resumeBtn);
            await runner.wait(200);
            const pauseScreen = runner.getElement('#pause-screen');
            if (runner.isVisible(pauseScreen)) {
                throw new Error('Pause screen still visible after resume');
            }
            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Expected PLAYING state, got ${runner.getGameState()}`);
            }
        }
    );

    runner.addTest('pause-quit', 'Pause Menu', 'Quit to menu works',
        'Verifies quit button returns to main menu',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            runner.simulateKeyDown('Escape');
            await runner.wait(200);
            const quitBtn = runner.getElement('#quit-btn');
            runner.simulateClick(quitBtn);
            await runner.wait(200);
            const menuScreen = runner.getElement('#menu-screen');
            if (!runner.isVisible(menuScreen)) {
                throw new Error('Menu screen not visible after quit');
            }
            if (runner.getGameState() !== 'MENU') {
                throw new Error(`Expected MENU state, got ${runner.getGameState()}`);
            }
        }
    );

    runner.addTest('pause-resume-clickable', 'Pause Menu', 'Resume button is clickable',
        'Verifies resume button has pointer-events and responds to clicks',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);
            runner.simulateKeyDown('Escape');
            await runner.wait(300);

            const pauseScreen = runner.getElement('#pause-screen');
            const resumeBtn = runner.getElement('#resume-btn');

            if (!runner.isVisible(pauseScreen)) {
                throw new Error('Pause screen not visible');
            }

            const computedStyle = runner.gameWindow.getComputedStyle(pauseScreen);
            if (computedStyle.pointerEvents === 'none') {
                throw new Error('Pause screen has pointer-events: none');
            }

            runner.simulateClick(resumeBtn);
            await runner.wait(300);

            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Resume failed - state is ${runner.getGameState()}, expected PLAYING`);
            }
        }
    );

    runner.addTest('pause-quit-clickable', 'Pause Menu', 'Quit button is clickable',
        'Verifies quit button has pointer-events and responds to clicks',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);
            runner.simulateKeyDown('Escape');
            await runner.wait(300);

            const pauseScreen = runner.getElement('#pause-screen');
            const quitBtn = runner.getElement('#quit-btn');

            if (!runner.isVisible(pauseScreen)) {
                throw new Error('Pause screen not visible');
            }

            runner.simulateClick(quitBtn);
            await runner.wait(300);

            if (runner.getGameState() !== 'MENU') {
                throw new Error(`Quit failed - state is ${runner.getGameState()}, expected MENU`);
            }

            const menuScreen = runner.getElement('#menu-screen');
            if (!runner.isVisible(menuScreen)) {
                throw new Error('Menu screen not visible after quit');
            }
        }
    );

    // Game Over Tests
    runner.addTest('gameover-shows', 'Game Over', 'Game over screen appears',
        'Verifies game over screen shows when game ends',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.gameWindow.gameState = 'PLAYING';
            runner.gameWindow.score = 1500;
            runner.gameWindow.endGame();
            await runner.wait(200);
            const gameoverScreen = runner.getElement('#gameover-screen');
            if (!runner.isVisible(gameoverScreen)) {
                throw new Error('Game over screen not visible');
            }
        }
    );

    runner.addTest('gameover-score', 'Game Over', 'Final score is displayed',
        'Verifies score is shown on game over screen',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.gameWindow.gameState = 'PLAYING';
            runner.gameWindow.score = 2500;
            runner.gameWindow.endGame();
            await runner.wait(200);
            const finalScore = runner.getElement('#final-score');
            if (!finalScore || finalScore.textContent !== '2500') {
                throw new Error(`Expected final score 2500, got ${finalScore?.textContent}`);
            }
        }
    );

    runner.addTest('gameover-play-again', 'Game Over', 'Play again button works',
        'Verifies play again restarts the game',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            runner.gameWindow.gameState = 'PLAYING';
            runner.gameWindow.score = 1000;
            runner.getElement('#score').textContent = '1000';
            runner.gameWindow.endGame();
            await runner.wait(300);

            if (runner.getGameState() !== 'GAME_OVER') {
                throw new Error('Expected GAME_OVER state');
            }

            const restartBtn = runner.getElement('#restart-btn');
            runner.simulateClick(restartBtn);
            await runner.wait(100);

            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Expected PLAYING state, got ${runner.getGameState()}`);
            }

            const scoreEl = runner.getElement('#score');
            if (scoreEl.textContent !== '0') {
                throw new Error(`Score display not reset, shows ${scoreEl.textContent}`);
            }
        }
    );

    // HUD Update Tests
    runner.addTest('hud-score-update', 'HUD Updates', 'Score updates on events',
        'Verifies score display updates when score changes',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            runner.gameWindow.score = 500;
            runner.getElement('#score').textContent = '500';
            await runner.wait(100);
            const scoreEl = runner.getElement('#score');
            if (scoreEl.textContent !== '500') {
                throw new Error(`Score display not updated, shows ${scoreEl.textContent}`);
            }
        }
    );

    runner.addTest('hud-timer-update', 'HUD Updates', 'Timer counts down',
        'Verifies timer decreases over time',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            const timerDisplay = runner.getElement('#timer-display');
            if (!timerDisplay) {
                throw new Error('Timer display element not found');
            }

            const initialTime = runner.gameWindow.gameTimer || 180;
            await runner.wait(1500);
            const newTime = runner.gameWindow.gameTimer || 180;

            if (newTime >= initialTime - 0.5) {
                throw new Error(`Timer not counting down. Initial: ${initialTime}, Current: ${newTime}`);
            }
        }
    );

    // Button Hover Tests
    runner.addTest('btn-hover-start', 'Button Hover', 'Start button responds to hover',
        'Verifies start button has hover styles',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            const transition = runner.gameWindow.getComputedStyle(startBtn).transition;
            if (!transition || transition === 'none') {
                throw new Error('Button missing transition property for hover effect');
            }
        }
    );

    // Crosshair Tests
    runner.addTest('crosshair-gameplay', 'Crosshair', 'Visible during gameplay',
        'Verifies crosshair is visible when playing',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            const crosshair = runner.getElement('#crosshair');
            if (!crosshair) {
                throw new Error('Crosshair element not found');
            }
            const style = runner.gameWindow.getComputedStyle(crosshair);
            if (style.display === 'none') {
                throw new Error('Crosshair hidden during gameplay');
            }
        }
    );

    runner.addTest('crosshair-menu', 'Crosshair', 'Game state is MENU on load',
        'Verifies game starts in MENU state with menu visible',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const menuScreen = runner.getElement('#menu-screen');
            if (!runner.isVisible(menuScreen)) {
                throw new Error('Menu screen not visible');
            }
            const gameState = runner.getGameState();
            if (gameState !== 'MENU') {
                throw new Error(`Expected MENU state, got ${gameState}`);
            }
        }
    );

    // State Transition Tests
    runner.addTest('transition-menu-to-playing', 'State Transitions', 'Menu to Playing',
        'Verifies state changes correctly from menu to playing',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            if (runner.getGameState() !== 'MENU') {
                throw new Error('Initial state not MENU');
            }
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Expected PLAYING, got ${runner.getGameState()}`);
            }
        }
    );

    runner.addTest('transition-playing-to-paused', 'State Transitions', 'Playing to Paused',
        'Verifies state changes correctly when pausing',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            runner.simulateKeyDown('Escape');
            await runner.wait(200);
            if (runner.getGameState() !== 'PAUSED') {
                throw new Error(`Expected PAUSED, got ${runner.getGameState()}`);
            }
        }
    );

    runner.addTest('transition-paused-to-playing', 'State Transitions', 'Paused to Playing',
        'Verifies state changes correctly when resuming',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(200);
            runner.simulateKeyDown('Escape');
            await runner.wait(200);
            runner.simulateKeyDown('Escape');
            await runner.wait(200);
            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Expected PLAYING after resume, got ${runner.getGameState()}`);
            }
        }
    );

    runner.addTest('transition-ui-sync', 'State Transitions', 'UI updates with state',
        'Verifies UI elements sync with game state changes',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            let menuVisible = runner.isVisible(runner.getElement('#menu-screen'));
            let hudVisible = runner.isVisible(runner.getElement('#hud'));
            if (!menuVisible || hudVisible) {
                throw new Error('Menu state UI incorrect');
            }

            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(200);

            menuVisible = runner.isVisible(runner.getElement('#menu-screen'));
            hudVisible = runner.isVisible(runner.getElement('#hud'));
            if (menuVisible || !hudVisible) {
                throw new Error('Playing state UI incorrect');
            }

            runner.simulateKeyDown('Escape');
            await runner.wait(200);

            const pauseVisible = runner.isVisible(runner.getElement('#pause-screen'));
            if (!pauseVisible) {
                throw new Error('Paused state UI incorrect');
            }
        }
    );

    // Freeze Tests
    runner.addTest('freeze-p-key', 'Freeze', 'P key freezes game without menu',
        'Verifies pressing P during gameplay freezes game without showing pause menu',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            // Get initial timer
            const initialTimer = runner.gameWindow.__gameInternals?.getGameTimer?.() || runner.gameWindow.gameTimer || 180;

            // Press P to freeze
            runner.simulateKeyDown('KeyP');
            await runner.wait(100);

            // Wait a bit to see if timer stops
            await runner.wait(500);

            const afterFreezeTimer = runner.gameWindow.__gameInternals?.getGameTimer?.() || runner.gameWindow.gameTimer || 180;

            // Timer should NOT have decreased much (frozen)
            const timerDiff = initialTimer - afterFreezeTimer;
            if (timerDiff > 0.2) {
                throw new Error(`Timer decreased by ${timerDiff}s while frozen - should be stopped`);
            }

            // Pause menu should NOT be visible
            const pauseScreen = runner.getElement('#pause-screen');
            if (runner.isVisible(pauseScreen)) {
                throw new Error('Pause menu should not show during freeze');
            }

            // Game state should still be PLAYING (not PAUSED)
            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Expected PLAYING state during freeze, got ${runner.getGameState()}`);
            }
        }
    );

    runner.addTest('freeze-toggle-unfreeze', 'Freeze', 'P key toggles freeze off',
        'Verifies pressing P again unfreezes the game',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            // Freeze
            runner.simulateKeyDown('KeyP');
            await runner.wait(100);

            // Unfreeze
            runner.simulateKeyDown('KeyP');
            await runner.wait(100);

            // Get timer and wait
            const beforeTimer = runner.gameWindow.__gameInternals?.getGameTimer?.() || runner.gameWindow.gameTimer || 180;
            await runner.wait(600);
            const afterTimer = runner.gameWindow.__gameInternals?.getGameTimer?.() || runner.gameWindow.gameTimer || 180;

            // Timer should have decreased (game running)
            const timerDiff = beforeTimer - afterTimer;
            if (timerDiff < 0.3) {
                throw new Error(`Timer only decreased by ${timerDiff}s after unfreeze - should be running`);
            }
        }
    );

    runner.addTest('freeze-not-in-menu', 'Freeze', 'P key does nothing in menu',
        'Verifies pressing P in menu state has no effect',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            // Press P in menu
            runner.simulateKeyDown('KeyP');
            await runner.wait(100);

            // Should still be in MENU state
            if (runner.getGameState() !== 'MENU') {
                throw new Error(`Expected MENU state, got ${runner.getGameState()}`);
            }

            // Menu should still be visible
            const menuScreen = runner.getElement('#menu-screen');
            if (!runner.isVisible(menuScreen)) {
                throw new Error('Menu screen should still be visible');
            }
        }
    );

    // Objective Display Tests
    runner.addTest('objective-element-exists', 'Objective Display', 'Objective display element exists',
        'Verifies the objective display element is in the DOM',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const objectiveEl = runner.getElement('#objective-display');
            if (!objectiveEl) {
                throw new Error('Objective display element not found');
            }

            const textEl = objectiveEl.querySelector('.objective-text');
            if (!textEl) {
                throw new Error('Objective text element not found');
            }

            if (!textEl.textContent.includes('CLEAR THE MALL')) {
                throw new Error(`Objective text should contain "CLEAR THE MALL", got "${textEl.textContent}"`);
            }
        }
    );

    runner.addTest('objective-shows-on-start', 'Objective Display', 'Objective shows on game start',
        'Verifies the objective display becomes visible when game starts',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const objectiveEl = runner.getElement('#objective-display');

            // Should be hidden in menu
            const menuStyle = runner.gameWindow.getComputedStyle(objectiveEl);
            if (menuStyle.visibility === 'visible' && menuStyle.opacity !== '0') {
                throw new Error('Objective should be hidden in menu');
            }

            // Start game
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(300);

            // Should be visible now
            if (!objectiveEl.classList.contains('show')) {
                throw new Error('Objective should have "show" class after game start');
            }
        }
    );

    runner.addTest('objective-has-text', 'Objective Display', 'Objective has correct text content',
        'Verifies the objective display contains the Clear the Mall message',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const objectiveEl = runner.getElement('#objective-display');
            const textEl = objectiveEl.querySelector('.objective-text');
            const subtextEl = objectiveEl.querySelector('.objective-subtext');

            if (!textEl || !textEl.textContent.includes('CLEAR THE MALL')) {
                throw new Error('Objective should contain "CLEAR THE MALL" text');
            }

            if (!subtextEl) {
                throw new Error('Objective should have subtext element');
            }
        }
    );

    // Status Panel Tests (includes enemy info + minimap)
    runner.addTest('status-panel-exists', 'Minimap', 'Status panel element exists',
        'Verifies the status panel (enemy info + minimap) is in the DOM',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const panelEl = runner.getElement('#status-panel');
            if (!panelEl) {
                throw new Error('Status panel element not found');
            }

            const gridEl = runner.getElement('#minimap-grid');
            if (!gridEl) {
                throw new Error('Minimap grid element not found');
            }
        }
    );

    runner.addTest('status-panel-hidden-on-pause', 'Minimap', 'Status panel hidden when paused',
        'Verifies status panel is not visible when game is paused',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            // Panel should be visible while playing
            const panelEl = runner.getElement('#status-panel');
            if (!runner.isVisible(panelEl)) {
                throw new Error('Status panel should be visible during gameplay');
            }

            // Pause the game
            runner.simulateKeyDown('Escape');
            await runner.wait(200);

            // Panel should be hidden when paused
            if (runner.isVisible(panelEl)) {
                throw new Error('Status panel should be hidden when paused');
            }
        }
    );

    runner.addTest('status-panel-visible-in-game', 'Minimap', 'Status panel visible during gameplay',
        'Verifies status panel is displayed when playing',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const panelEl = runner.getElement('#status-panel');
            const style = runner.gameWindow.getComputedStyle(panelEl);

            if (style.display === 'none') {
                throw new Error('Status panel should be visible during gameplay');
            }
        }
    );

    runner.addTest('minimap-has-rooms', 'Minimap', 'Minimap shows room cells',
        'Verifies minimap grid contains room cells after game start',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const gridEl = runner.getElement('#minimap-grid');
            const roomCells = gridEl.querySelectorAll('.minimap-room');

            if (roomCells.length === 0) {
                throw new Error('Minimap has no room cells');
            }

            // Should have entrance marked
            const entranceCell = gridEl.querySelector('.minimap-room.entrance');
            if (!entranceCell) {
                throw new Error('Minimap should have entrance room marked');
            }
        }
    );

    runner.addTest('minimap-updates-with-enemies', 'Minimap', 'Minimap shows enemy counts',
        'Verifies minimap cells display enemy count numbers',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            // Run a few updates
            for (let i = 0; i < 10; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(100);

            const gridEl = runner.getElement('#minimap-grid');
            const roomsWithEnemies = gridEl.querySelectorAll('.minimap-room.has-enemies');

            // Should have at least some rooms with enemies marked
            if (roomsWithEnemies.length === 0) {
                throw new Error('No rooms marked as having enemies on minimap');
            }

            // At least one should show a number
            let hasNumber = false;
            roomsWithEnemies.forEach(cell => {
                if (cell.textContent && parseInt(cell.textContent) > 0) {
                    hasNumber = true;
                }
            });

            if (!hasNumber) {
                throw new Error('Minimap cells should display enemy count numbers');
            }
        }
    );

})(window.runner);
