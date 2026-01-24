/**
 * Mall Hell - UI Test Framework
 * Browser-based UI/integration testing runner
 */

class UITestRunner {
    constructor() {
        this.tests = [];
        this.results = { pass: 0, fail: 0, pending: 0 };
        this.gameWindow = null;
        this.gameDocument = null;
        this.isRunning = false;
        this.delay = 500;
        this.currentTest = null;
    }

    async init() {
        const frame = document.getElementById('game-frame');
        this.gameWindow = frame.contentWindow;
        this.gameDocument = frame.contentDocument;

        // Inject TestBridge for test compatibility
        await this.injectTestBridge();

        this.log('Game loaded successfully', 'success');
        this.renderTests();
        this.startStateMonitor();
    }

    async injectTestBridge() {
        // Wait for __gameInternals to be ready
        let attempts = 0;
        while (!this.gameWindow.__gameInternals && attempts < 50) {
            await this.wait(100);
            attempts++;
        }

        if (!this.gameWindow.__gameInternals) {
            this.log('Warning: __gameInternals not found after waiting', 'warn');
            return;
        }

        // Create and inject TestBridge script
        // Path is relative to the iframe's document (index.html in root)
        const script = this.gameDocument.createElement('script');
        script.src = './src/engine/test-bridge.js';

        return new Promise((resolve) => {
            script.onload = () => {
                this.log('TestBridge injected successfully', 'info');
                resolve();
            };
            script.onerror = () => {
                this.log('Failed to inject TestBridge', 'error');
                resolve();
            };
            this.gameDocument.head.appendChild(script);
        });
    }

    log(message, type = 'info') {
        const panel = document.getElementById('log-panel');
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        panel.appendChild(entry);
        panel.scrollTop = panel.scrollHeight;
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getElement(selector) {
        return this.gameDocument.querySelector(selector);
    }

    getElements(selector) {
        return this.gameDocument.querySelectorAll(selector);
    }

    isVisible(element) {
        if (!element) return false;
        const style = this.gameWindow.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    getGameState() {
        return this.gameWindow.gameState;
    }

    getScore() {
        return this.gameWindow.score;
    }

    getDistance() {
        return this.gameWindow.distance;
    }

    simulateClick(element) {
        if (!element) throw new Error('Element not found for click');
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: this.gameWindow
        });
        element.dispatchEvent(event);
    }

    simulateMouseMove(x, y) {
        const event = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: this.gameWindow,
            clientX: x,
            clientY: y
        });
        this.gameDocument.dispatchEvent(event);
    }

    simulateKeyDown(key) {
        const event = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: key
        });
        this.gameDocument.dispatchEvent(event);
    }

    simulateKeyUp(key) {
        const event = new KeyboardEvent('keyup', {
            bubbles: true,
            cancelable: true,
            key: key
        });
        this.gameDocument.dispatchEvent(event);
    }

    simulateHover(element) {
        if (!element) throw new Error('Element not found for hover');
        const enterEvent = new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            view: this.gameWindow
        });
        element.dispatchEvent(enterEvent);

        const overEvent = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: this.gameWindow
        });
        element.dispatchEvent(overEvent);
    }

    simulateHoverEnd(element) {
        if (!element) throw new Error('Element not found for hover end');
        const leaveEvent = new MouseEvent('mouseleave', {
            bubbles: true,
            cancelable: true,
            view: this.gameWindow
        });
        element.dispatchEvent(leaveEvent);
    }

    simulateMouseDown(element) {
        if (!element) throw new Error('Element not found for mousedown');
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: this.gameWindow
        });
        element.dispatchEvent(event);
    }

    simulateMouseUp(element) {
        if (!element) throw new Error('Element not found for mouseup');
        const event = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: this.gameWindow
        });
        element.dispatchEvent(event);
    }

    resetGame() {
        if (this.gameWindow.resetGame) {
            this.gameWindow.resetGame();
        }

        const menuScreen = this.getElement('#menu-screen');
        const gameoverScreen = this.getElement('#gameover-screen');
        const pauseScreen = this.getElement('#pause-screen');
        const hud = this.getElement('#hud');

        if (menuScreen) menuScreen.style.display = 'flex';
        if (gameoverScreen) gameoverScreen.style.display = 'none';
        if (pauseScreen) pauseScreen.style.display = 'none';
        if (hud) hud.style.display = 'none';

        this.gameWindow.gameState = 'MENU';
        this.gameWindow.score = 0;
        this.gameWindow.distance = 0;

        const scoreEl = this.getElement('#score');
        if (scoreEl) scoreEl.textContent = '0';

        const progressFill = this.getElement('#progress-fill');
        if (progressFill) progressFill.style.width = '0%';
    }

    startStateMonitor() {
        setInterval(() => {
            document.getElementById('current-state').textContent = this.getGameState() || '-';
            document.getElementById('current-score').textContent = this.getScore() || '0';
            const progress = this.getDistance() ?
                ((this.getDistance() / 800) * 100).toFixed(1) + '%' : '0%';
            document.getElementById('current-progress').textContent = progress;
            const hud = this.getElement('#hud');
            document.getElementById('hud-visible').textContent =
                hud ? (this.isVisible(hud) ? 'Yes' : 'No') : '-';
        }, 200);
    }

    addTest(id, group, name, description, fn) {
        this.tests.push({ id, group, name, description, fn, status: 'pending', error: null, time: 0 });
    }

    renderTests() {
        const container = document.getElementById('test-list');
        container.innerHTML = '';

        const groups = {};
        this.tests.forEach(test => {
            if (!groups[test.group]) groups[test.group] = [];
            groups[test.group].push(test);
        });

        for (const [groupName, tests] of Object.entries(groups)) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'test-group';

            const passCount = tests.filter(t => t.status === 'pass').length;
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `
                <span>${groupName}</span>
                <span class="group-count">${passCount}/${tests.length}</span>
            `;
            groupDiv.appendChild(header);

            tests.forEach(test => {
                const testDiv = document.createElement('div');
                testDiv.className = 'test-item';
                testDiv.dataset.testId = test.id;

                let statusIcon = '-';
                if (test.status === 'pass') statusIcon = '&#10003;';
                else if (test.status === 'fail') statusIcon = '&#10007;';
                else if (test.status === 'running') statusIcon = '...';

                testDiv.innerHTML = `
                    <div class="test-status status-${test.status}">${statusIcon}</div>
                    <div class="test-info">
                        <div class="test-name">${test.name}</div>
                        <div class="test-desc">${test.description}</div>
                        ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
                    </div>
                    <div class="test-time">${test.time ? test.time + 'ms' : ''}</div>
                `;

                testDiv.addEventListener('click', () => this.runSingleTest(test.id));
                groupDiv.appendChild(testDiv);
            });

            container.appendChild(groupDiv);
        }

        this.updateSummary();
    }

    updateSummary() {
        this.results = { pass: 0, fail: 0, pending: 0 };
        this.tests.forEach(test => {
            if (test.status === 'pass') this.results.pass++;
            else if (test.status === 'fail') this.results.fail++;
            else this.results.pending++;
        });

        document.getElementById('pass-count').textContent = this.results.pass;
        document.getElementById('fail-count').textContent = this.results.fail;
        document.getElementById('pending-count').textContent = this.results.pending;
        document.getElementById('total-count').textContent = this.tests.length;

        const progress = ((this.results.pass + this.results.fail) / this.tests.length) * 100;
        document.getElementById('test-progress').style.width = progress + '%';
    }

    async runTest(test) {
        test.status = 'running';
        test.error = null;
        this.currentTest = test;
        this.renderTests();
        this.log(`Running: ${test.name}`, 'info');

        const startTime = performance.now();
        try {
            await test.fn();
            test.status = 'pass';
            test.time = Math.round(performance.now() - startTime);
            this.log(`PASS: ${test.name} (${test.time}ms)`, 'success');
        } catch (error) {
            test.status = 'fail';
            test.error = error.message;
            test.time = Math.round(performance.now() - startTime);
            this.log(`FAIL: ${test.name} - ${error.message}`, 'error');
        }

        this.currentTest = null;
        this.renderTests();
    }

    async runSingleTest(testId) {
        if (this.isRunning) return;
        this.isRunning = true;

        const test = this.tests.find(t => t.id === testId);
        if (test) {
            await this.runTest(test);
        }

        this.isRunning = false;
    }

    async runAllTests() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.delay = parseInt(document.getElementById('test-delay').value) || 500;

        this.log('Starting all tests...', 'info');
        document.getElementById('run-all-btn').disabled = true;

        for (const test of this.tests) {
            test.status = 'pending';
            test.error = null;
            test.time = 0;
        }
        this.renderTests();

        for (const test of this.tests) {
            await this.runTest(test);
            await this.wait(this.delay);
        }

        this.log(`Tests complete: ${this.results.pass} passed, ${this.results.fail} failed`,
            this.results.fail > 0 ? 'warn' : 'success');

        document.getElementById('run-all-btn').disabled = false;
        this.isRunning = false;
    }

    reset() {
        this.tests.forEach(test => {
            test.status = 'pending';
            test.error = null;
            test.time = 0;
        });
        this.resetGame();
        this.renderTests();
        this.log('Tests reset', 'info');
    }

    captureState() {
        const state = {
            gameState: this.getGameState(),
            score: this.getScore(),
            distance: this.getDistance(),
            menuVisible: this.isVisible(this.getElement('#menu-screen')),
            hudVisible: this.isVisible(this.getElement('#hud')),
            pauseVisible: this.isVisible(this.getElement('#pause-screen')),
            gameoverVisible: this.isVisible(this.getElement('#gameover-screen')),
            timestamp: new Date().toISOString()
        };

        this.log(`State captured: ${JSON.stringify(state)}`, 'info');
        console.log('Game State Capture:', state);

        navigator.clipboard.writeText(JSON.stringify(state, null, 2)).then(() => {
            this.log('State copied to clipboard', 'success');
        }).catch(() => {
            this.log('Could not copy to clipboard', 'warn');
        });
    }
}

// Create global instance
const runner = new UITestRunner();
window.runner = runner;
