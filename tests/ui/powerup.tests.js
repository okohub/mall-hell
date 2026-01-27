/**
 * Power-Up UI Tests
 * Tests for power-up timer HUD display
 */

(function(runner) {
    'use strict';

    // Test 1: Timer hidden by default
    runner.addTest('powerup-timer-hidden-by-default', 'Power-Up UI', 'Timer is hidden by default',
        'Verifies power-up timer is not visible when game starts',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const timer = runner.getElement('#powerup-timer');
            if (!timer) {
                throw new Error('Power-up timer element not found');
            }
            if (runner.isVisible(timer)) {
                throw new Error('Power-up timer should be hidden by default');
            }
        }
    );

    // Test 2: Timer displays when time remaining > 0
    runner.addTest('powerup-timer-shows-with-time', 'Power-Up UI', 'Timer shows when time remaining > 0',
        'Verifies updatePowerUpTimer shows timer with valid time',
        async () => {
            runner.resetGame();
            const UIOrchestrator = runner.gameWindow.UIOrchestrator;
            await runner.wait(100);

            // Update timer with 5 seconds remaining
            UIOrchestrator.updatePowerUpTimer(5000, 'speed_boost');

            const timer = runner.getElement('#powerup-timer');
            if (!runner.isVisible(timer)) {
                throw new Error('Timer should be visible with time remaining');
            }

            const timeDisplay = runner.getElement('#powerup-timer .powerup-time');
            if (!timeDisplay || !timeDisplay.textContent.includes('5.0')) {
                throw new Error(`Expected "5.0s", got "${timeDisplay?.textContent}"`);
            }
        }
    );

    // Test 3: Timer hidden when time reaches 0
    runner.addTest('powerup-timer-hides-at-zero', 'Power-Up UI', 'Timer hides when time reaches 0',
        'Verifies updatePowerUpTimer hides timer when time is 0',
        async () => {
            runner.resetGame();
            const UIOrchestrator = runner.gameWindow.UIOrchestrator;
            await runner.wait(100);

            // Show timer first
            UIOrchestrator.updatePowerUpTimer(5000, 'speed_boost');
            await runner.wait(50);

            // Hide it
            UIOrchestrator.updatePowerUpTimer(0, 'speed_boost');
            await runner.wait(50);

            const timer = runner.getElement('#powerup-timer');
            if (runner.isVisible(timer)) {
                throw new Error('Timer should be hidden when time is 0');
            }
        }
    );

    // Test 4: Warning state at 3 seconds
    runner.addTest('powerup-timer-warning-state', 'Power-Up UI', 'Timer shows warning state at 3s',
        'Verifies timer applies warning class when time <= 3s',
        async () => {
            runner.resetGame();
            const UIOrchestrator = runner.gameWindow.UIOrchestrator;
            await runner.wait(100);

            // Update with 2.5 seconds (should trigger warning)
            UIOrchestrator.updatePowerUpTimer(2500, 'speed_boost');

            const timer = runner.getElement('#powerup-timer');
            if (!timer.classList.contains('warning')) {
                throw new Error('Timer should have "warning" class at 2.5s');
            }
            if (timer.classList.contains('critical')) {
                throw new Error('Timer should NOT have "critical" class at 2.5s');
            }
        }
    );

    // Test 5: Critical state at 1 second
    runner.addTest('powerup-timer-critical-state', 'Power-Up UI', 'Timer shows critical state at 1s',
        'Verifies timer applies critical class when time <= 1s',
        async () => {
            runner.resetGame();
            const UIOrchestrator = runner.gameWindow.UIOrchestrator;
            await runner.wait(100);

            // Update with 0.5 seconds (should trigger critical)
            UIOrchestrator.updatePowerUpTimer(500, 'speed_boost');

            const timer = runner.getElement('#powerup-timer');
            if (!timer.classList.contains('critical')) {
                throw new Error('Timer should have "critical" class at 0.5s');
            }
        }
    );

    // Test 6: Normal state above 3 seconds
    runner.addTest('powerup-timer-normal-state', 'Power-Up UI', 'Timer shows normal state above 3s',
        'Verifies timer has no warning/critical classes when time > 3s',
        async () => {
            runner.resetGame();
            const UIOrchestrator = runner.gameWindow.UIOrchestrator;
            await runner.wait(100);

            // Update with 5 seconds
            UIOrchestrator.updatePowerUpTimer(5000, 'speed_boost');

            const timer = runner.getElement('#powerup-timer');
            if (timer.classList.contains('warning') || timer.classList.contains('critical')) {
                throw new Error('Timer should have no warning/critical classes at 5s');
            }
        }
    );

    // Test 7: Time format displays correctly
    runner.addTest('powerup-timer-format', 'Power-Up UI', 'Timer displays time in correct format',
        'Verifies time is displayed as X.Xs format',
        async () => {
            runner.resetGame();
            const UIOrchestrator = runner.gameWindow.UIOrchestrator;
            await runner.wait(100);

            // Test various times
            const testTimes = [
                { ms: 10000, expected: '10.0' },
                { ms: 5500, expected: '5.5' },
                { ms: 1200, expected: '1.2' },
                { ms: 100, expected: '0.1' }
            ];

            for (const test of testTimes) {
                UIOrchestrator.updatePowerUpTimer(test.ms, 'speed_boost');
                const timeDisplay = runner.getElement('#powerup-timer .powerup-time');
                if (!timeDisplay.textContent.includes(test.expected)) {
                    throw new Error(`Expected "${test.expected}s", got "${timeDisplay.textContent}"`);
                }
            }
        }
    );

})(window.runner || runner);
