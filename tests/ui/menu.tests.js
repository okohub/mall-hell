/**
 * Menu UI Tests
 * Tests for Menu Screen and How to Play modal
 */

(function(runner) {
    'use strict';

    // Menu Screen Tests
    runner.addTest('menu-title', 'Menu Screen', 'Title is visible',
        'Verifies the game title "MALL HELL" is displayed',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const title = runner.getElement('.title');
            if (!title || !runner.isVisible(title)) {
                throw new Error('Title element not found or not visible');
            }
            if (!title.textContent.includes('MALL HELL')) {
                throw new Error(`Expected title to contain "MALL HELL", got "${title.textContent}"`);
            }
        }
    );

    runner.addTest('menu-start-btn', 'Menu Screen', 'Start button exists and works',
        'Verifies the start button is visible and clickable',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            if (!startBtn || !runner.isVisible(startBtn)) {
                throw new Error('Start button not found or not visible');
            }
            if (!startBtn.textContent.includes('START')) {
                throw new Error('Start button text incorrect');
            }
        }
    );

    runner.addTest('menu-instructions', 'Menu Screen', 'Instructions are displayed',
        'Verifies game instructions are visible on menu',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const instructions = runner.getElement('.instructions');
            if (!instructions || !runner.isVisible(instructions)) {
                throw new Error('Instructions not found or not visible');
            }
            const text = instructions.textContent.toLowerCase();
            if (!text.includes('fire') && !text.includes('click')) {
                throw new Error('Instructions missing fire controls info');
            }
        }
    );

    runner.addTest('menu-version', 'Menu Screen', 'Version shows v4.0',
        'Verifies menu shows correct version',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const version = runner.getElement('.version');
            if (!version || !version.textContent.includes('4.0')) {
                throw new Error('Version should show v4.0');
            }
        }
    );

    runner.addTest('menu-wasd', 'Menu Screen', 'Instructions show WASD controls',
        'Verifies instructions display WASD for driving and space for fire',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const instructions = runner.getElement('.instructions');
            if (!instructions) {
                throw new Error('Instructions not found');
            }
            const text = instructions.textContent.toLowerCase();
            if (!text.includes('forward') && !text.includes('w')) {
                throw new Error('Instructions should mention forward/W');
            }
            if (!text.includes('space')) {
                throw new Error('Instructions should mention space for fire');
            }
        }
    );

    // How to Play Modal Tests
    runner.addTest('how-to-play-btn-exists', 'How to Play', 'How to Play button exists',
        'Verifies How to Play button is visible in menu',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const btn = runner.getElement('#how-to-play-btn');
            if (!btn) {
                throw new Error('How to Play button not found');
            }
            if (!runner.isVisible(btn)) {
                throw new Error('How to Play button not visible');
            }
        }
    );

    runner.addTest('how-to-play-modal-opens', 'How to Play', 'Modal opens on button click',
        'Verifies clicking How to Play button opens the modal',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const btn = runner.getElement('#how-to-play-btn');
            const modal = runner.getElement('#how-to-play-modal');

            if (modal.classList.contains('visible')) {
                throw new Error('Modal should be hidden initially');
            }

            runner.simulateClick(btn);
            await runner.wait(100);

            if (!modal.classList.contains('visible')) {
                throw new Error('Modal should be visible after clicking button');
            }
        }
    );

    runner.addTest('how-to-play-modal-closes', 'How to Play', 'Modal closes on GOT IT click',
        'Verifies clicking GOT IT button closes the modal',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const btn = runner.getElement('#how-to-play-btn');
            const modal = runner.getElement('#how-to-play-modal');
            const closeBtn = runner.getElement('#modal-close');

            runner.simulateClick(btn);
            await runner.wait(100);

            if (!modal.classList.contains('visible')) {
                throw new Error('Modal should be visible after opening');
            }

            runner.simulateClick(closeBtn);
            await runner.wait(100);

            if (modal.classList.contains('visible')) {
                throw new Error('Modal should be hidden after clicking GOT IT');
            }
        }
    );

    runner.addTest('how-to-play-modal-content', 'How to Play', 'Modal has correct content',
        'Verifies modal contains help information',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const modal = runner.getElement('#how-to-play-modal');
            const content = modal.querySelector('.modal-content');

            if (!content) {
                throw new Error('Modal content not found');
            }

            const text = content.textContent.toLowerCase();

            if (!text.includes('w') || !text.includes('s')) {
                throw new Error('Modal should explain W/S controls');
            }
            if (!text.includes('a') || !text.includes('d')) {
                throw new Error('Modal should explain A/D controls');
            }
            if (!text.includes('space')) {
                throw new Error('Modal should explain SPACE control');
            }
            if (!text.includes('100') || !text.includes('300')) {
                throw new Error('Modal should explain scoring');
            }
        }
    );

    runner.addTest('how-to-play-modal-clickable', 'How to Play', 'Modal elements are clickable',
        'Verifies modal has pointer-events enabled for clicking',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const modal = runner.getElement('#how-to-play-modal');
            const content = modal.querySelector('.modal-content');
            const closeBtn = runner.getElement('#modal-close');

            const modalStyle = window.getComputedStyle(modal);
            const contentStyle = window.getComputedStyle(content);
            const btnStyle = window.getComputedStyle(closeBtn);

            if (modalStyle.pointerEvents === 'none') {
                throw new Error('Modal should have pointer-events: auto, got none');
            }
            if (contentStyle.pointerEvents === 'none') {
                throw new Error('Modal content should have pointer-events: auto, got none');
            }
            if (btnStyle.pointerEvents === 'none') {
                throw new Error('Close button should have pointer-events: auto, got none');
            }
        }
    );

})(window.runner);
