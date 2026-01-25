/**
 * Vision-Based Game Agent - Plays the game by LOOKING at it
 *
 * Uses Claude Vision API to analyze screenshots and make human-like decisions.
 * This agent actually SEES the game and reacts like a real player would.
 */

const fs = require('fs');
const path = require('path');

class VisionAgent {
    constructor(page, options = {}) {
        this.page = page;
        this.options = {
            screenshotInterval: options.screenshotInterval ?? 400,  // ms between screenshots
            apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY,
            model: options.model ?? 'claude-sonnet-4-20250514',
            saveScreenshots: options.saveScreenshots ?? false,
            outputDir: options.outputDir ?? '.playtest-output',
            verbose: options.verbose ?? false,
            maxTokens: options.maxTokens ?? 300,
            ...options
        };

        this.isRunning = false;
        this.screenshotCount = 0;
        this.lastAction = null;
        this.lastAnalysis = null;

        // Feedback collection
        this.feedback = {
            visualIssues: [],
            uxIssues: [],
            positives: [],
            suggestions: [],
            rawAnalyses: []
        };

        // Action state
        this.heldKeys = new Set();
        this.lastDecisionTime = 0;

        // Game context for Claude
        this.gameContext = `You are playing "Mall Hell" - a first-person browser game where you're a kid in a shopping cart shooting enemies with a slingshot.

CONTROLS:
- W: Move forward (hold)
- A: Dodge/turn left
- D: Dodge/turn right
- SPACE: Hold to charge slingshot, release to fire

WHAT YOU SEE:
- Red shopping carts = ENEMIES (shoot them!)
- Colored boxes/barrels = OBSTACLES (can shoot for points)
- Crosshair in center = where you're aiming
- Green bar (bottom-left) = your HEALTH
- Top-left number = your SCORE
- Ring around crosshair = charge level when holding SPACE

YOUR GOAL: Shoot enemies and obstacles to score points. Dodge enemy carts to avoid damage. Survive!`;
    }

    log(message, ...args) {
        if (this.options.verbose) {
            console.log(`[VisionAgent] ${message}`, ...args);
        }
    }

    async start() {
        if (!this.options.apiKey) {
            throw new Error('ANTHROPIC_API_KEY not set. Export it or pass apiKey option.');
        }
        this.isRunning = true;
        this.screenshotCount = 0;
        this.log('Started vision-based agent');
    }

    async stop() {
        this.isRunning = false;
        // Release all held keys
        await this.releaseAllKeys();
        this.log('Stopped vision-based agent');
    }

    async releaseAllKeys() {
        for (const key of this.heldKeys) {
            await this.releaseKey(key);
        }
        this.heldKeys.clear();
    }

    /**
     * Main tick - capture screenshot, analyze, act
     */
    async tick() {
        if (!this.isRunning) return;

        const now = Date.now();
        if (now - this.lastDecisionTime < this.options.screenshotInterval) {
            return;
        }
        this.lastDecisionTime = now;

        try {
            // 1. Capture screenshot
            const screenshot = await this.captureScreenshot();

            // 2. Send to Claude Vision for analysis
            const analysis = await this.analyzeScreenshot(screenshot);

            if (!analysis) {
                this.log('No analysis received, skipping tick');
                return;
            }

            this.lastAnalysis = analysis;
            this.feedback.rawAnalyses.push({
                time: now,
                analysis: analysis
            });

            // 3. Parse and execute actions
            await this.executeActions(analysis);

            // 4. Collect feedback
            this.collectFeedback(analysis);

        } catch (error) {
            this.log('Error in tick:', error.message);
        }
    }

    /**
     * Capture a screenshot of the game
     */
    async captureScreenshot() {
        this.screenshotCount++;

        const screenshotBuffer = await this.page.screenshot({
            type: 'jpeg',
            quality: 80,
            encoding: 'base64'
        });

        // Optionally save screenshot for debugging
        if (this.options.saveScreenshots) {
            const filename = path.join(
                this.options.outputDir,
                `screenshot-${String(this.screenshotCount).padStart(4, '0')}.jpg`
            );
            fs.writeFileSync(filename, Buffer.from(screenshotBuffer, 'base64'));
        }

        return screenshotBuffer;
    }

    /**
     * Send screenshot to Claude Vision API for analysis
     */
    async analyzeScreenshot(screenshotBase64) {
        const prompt = `${this.gameContext}

Look at this game screenshot and respond with EXACTLY this JSON format (no other text):
{
    "see": "brief description of what you see (enemies, obstacles, health status)",
    "threat": "none|low|medium|high - how dangerous is the current situation",
    "action": {
        "move": "none|forward|left|right",
        "shoot": "none|tap|charge|release",
        "reason": "why this action"
    },
    "feedback": {
        "visual": "any visual issues (hard to see enemies, confusing UI, etc.) or null",
        "positive": "anything that looks good or feels right, or null"
    }
}

IMPORTANT RULES:
- If you see enemies (red carts), try to shoot them
- If enemies are close/threatening, dodge (A or D)
- Hold SPACE to charge for stronger shots, release to fire
- Always keep moving forward (W) unless dodging
- If charging (ring visible around crosshair), consider releasing to fire
- "tap" = quick shot, "charge" = start holding SPACE, "release" = let go of SPACE`;

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.options.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.options.model,
                    max_tokens: this.options.maxTokens,
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: screenshotBase64
                                }
                            },
                            {
                                type: 'text',
                                text: prompt
                            }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                const error = await response.text();
                this.log('API error:', error);
                return null;
            }

            const data = await response.json();
            const content = data.content?.[0]?.text;

            if (!content) {
                this.log('No content in response');
                return null;
            }

            // Parse JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            this.log('Could not parse JSON from:', content);
            return null;

        } catch (error) {
            this.log('API call failed:', error.message);
            return null;
        }
    }

    /**
     * Execute actions based on Claude's analysis
     */
    async executeActions(analysis) {
        const action = analysis.action;
        if (!action) return;

        this.log(`Action: move=${action.move}, shoot=${action.shoot} - ${action.reason}`);

        // Handle movement
        await this.handleMovement(action.move);

        // Handle shooting
        await this.handleShooting(action.shoot);

        this.lastAction = action;
    }

    async handleMovement(move) {
        // Always hold forward unless explicitly told not to
        if (move !== 'none') {
            if (!this.heldKeys.has('KeyW')) {
                await this.pressKey('KeyW');
            }
        }

        // Handle lateral movement
        switch (move) {
            case 'left':
                await this.releaseKey('KeyD');
                await this.pressKey('KeyA');
                // Auto-release after short duration
                setTimeout(async () => {
                    if (this.isRunning) await this.releaseKey('KeyA');
                }, 200);
                break;
            case 'right':
                await this.releaseKey('KeyA');
                await this.pressKey('KeyD');
                setTimeout(async () => {
                    if (this.isRunning) await this.releaseKey('KeyD');
                }, 200);
                break;
            case 'forward':
                await this.releaseKey('KeyA');
                await this.releaseKey('KeyD');
                break;
        }
    }

    async handleShooting(shoot) {
        switch (shoot) {
            case 'tap':
                // Quick shot
                await this.pressKey('Space');
                setTimeout(async () => {
                    if (this.isRunning) await this.releaseKey('Space');
                }, 100);
                break;
            case 'charge':
                // Start charging
                if (!this.heldKeys.has('Space')) {
                    await this.pressKey('Space');
                }
                break;
            case 'release':
                // Release charged shot
                await this.releaseKey('Space');
                break;
            case 'none':
                // Do nothing with shooting
                break;
        }
    }

    async pressKey(code) {
        if (this.heldKeys.has(code)) return;

        this.heldKeys.add(code);
        await this.page.evaluate((keyCode) => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                code: keyCode,
                bubbles: true,
                cancelable: true
            }));
        }, code);
    }

    async releaseKey(code) {
        if (!this.heldKeys.has(code)) return;

        this.heldKeys.delete(code);
        await this.page.evaluate((keyCode) => {
            document.dispatchEvent(new KeyboardEvent('keyup', {
                code: keyCode,
                bubbles: true,
                cancelable: true
            }));
        }, code);
    }

    /**
     * Collect qualitative feedback from analysis
     */
    collectFeedback(analysis) {
        if (!analysis.feedback) return;

        if (analysis.feedback.visual) {
            this.feedback.visualIssues.push({
                time: Date.now(),
                issue: analysis.feedback.visual
            });
        }

        if (analysis.feedback.positive) {
            this.feedback.positives.push({
                time: Date.now(),
                note: analysis.feedback.positive
            });
        }
    }

    /**
     * Get aggregated feedback report
     */
    getFeedbackReport() {
        // Deduplicate and summarize feedback
        const uniqueVisualIssues = [...new Set(this.feedback.visualIssues.map(i => i.issue))];
        const uniquePositives = [...new Set(this.feedback.positives.map(p => p.note))];

        return {
            totalScreenshots: this.screenshotCount,
            visualIssues: uniqueVisualIssues,
            positives: uniquePositives,
            rawAnalysisCount: this.feedback.rawAnalyses.length
        };
    }
}

/**
 * Vision-based playtest runner
 */
class VisionPlaytestRunner {
    constructor(options = {}) {
        const projectRoot = path.join(__dirname, '..');
        const defaultOutputDir = path.join(projectRoot, '.playtest-output');

        this.options = {
            headless: options.headless ?? false,  // Default to visible for vision tests
            timeout: options.timeout ?? 120000,   // 2 minutes
            outputDir: options.outputDir ?? defaultOutputDir,
            verbose: options.verbose ?? true,
            saveScreenshots: options.saveScreenshots ?? false,
            screenshotInterval: options.screenshotInterval ?? 500,
            ...options
        };
    }

    async run() {
        const puppeteer = require('puppeteer');

        console.log('\n========================================');
        console.log('  MALL HELL - Vision Playtest Agent');
        console.log('========================================\n');

        // Check for API key
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
            console.error('');
            console.error('Set it with:');
            console.error('  export ANTHROPIC_API_KEY=sk-ant-...');
            console.error('');
            console.error('Or run with:');
            console.error('  ANTHROPIC_API_KEY=sk-ant-... bun playtest/vision-agent.js');
            process.exit(1);
        }
        console.log('API key found ✓\n');

        // Ensure output directory exists
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }

        const browser = await puppeteer.launch({
            headless: this.options.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });

        // Load the game
        const gamePath = path.join(__dirname, '..', 'index.html');
        console.log('Loading game...');
        await page.goto(`file://${gamePath}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        // Wait for game to initialize
        await page.waitForFunction(() => {
            return window.__gameInternals !== undefined;
        }, { timeout: 10000 });

        console.log('Game loaded. Starting agent...\n');

        // Create vision agent
        const agent = new VisionAgent(page, {
            verbose: this.options.verbose,
            saveScreenshots: this.options.saveScreenshots,
            outputDir: this.options.outputDir,
            screenshotInterval: this.options.screenshotInterval
        });

        // Start the game directly via __gameInternals
        console.log('Starting game...');
        await page.evaluate(() => {
            // Direct call to startGame function
            if (window.__gameInternals?.startGame) {
                window.__gameInternals.startGame();
            }
        });

        await new Promise(r => setTimeout(r, 500));

        // Verify game started
        const gameState = await page.evaluate(() => window.StateSystem?.get?.());
        if (gameState !== 'PLAYING') {
            throw new Error(`Game failed to start. State: ${gameState}`);
        }

        console.log('Game started! Agent is now playing...\n');

        await agent.start();

        // Main game loop
        const startTime = Date.now();
        let gameEnded = false;

        while (!gameEnded && (Date.now() - startTime) < this.options.timeout) {
            // Check game state
            const state = await page.evaluate(() => {
                return {
                    gameState: window.StateSystem?.get(),
                    score: window.__gameInternals?.getScore?.() || 0,
                    health: window.__gameInternals?.getPlayerHealth?.() || 0
                };
            });

            if (state.gameState === 'GAME_OVER') {
                gameEnded = true;
                console.log('\n--- GAME OVER ---');
                console.log(`Final Score: ${state.score}`);
                break;
            }

            // Let agent play
            await agent.tick();

            // Small delay
            await new Promise(r => setTimeout(r, 50));
        }

        await agent.stop();

        // Get final results
        const finalState = await page.evaluate(() => ({
            score: window.__gameInternals?.getScore?.() || 0,
            health: window.__gameInternals?.getPlayerHealth?.() || 0
        }));

        const feedbackReport = agent.getFeedbackReport();

        // Generate report
        const report = {
            timestamp: new Date().toISOString(),
            duration: (Date.now() - startTime) / 1000,
            finalScore: finalState.score,
            finalHealth: finalState.health,
            screenshotsAnalyzed: feedbackReport.totalScreenshots,
            feedback: feedbackReport,
            config: this.options
        };

        // Save report
        const reportPath = path.join(this.options.outputDir, 'vision-playtest-latest.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Print summary
        console.log('\n========================================');
        console.log('         PLAYTEST COMPLETE');
        console.log('========================================\n');
        console.log(`Duration: ${report.duration.toFixed(1)}s`);
        console.log(`Final Score: ${report.finalScore}`);
        console.log(`Screenshots Analyzed: ${report.screenshotsAnalyzed}`);

        if (feedbackReport.visualIssues.length > 0) {
            console.log('\n--- Visual Issues Found ---');
            feedbackReport.visualIssues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
            });
        }

        if (feedbackReport.positives.length > 0) {
            console.log('\n--- Positives ---');
            feedbackReport.positives.forEach((pos, i) => {
                console.log(`${i + 1}. ${pos}`);
            });
        }

        console.log(`\nReport saved to: ${reportPath}`);

        await browser.close();
        return report;
    }
}

// CLI
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Mall Hell - Vision-Based Playtest Agent

This agent LOOKS at the game and plays like a human would.

Usage: bun playtest/vision-agent.js [options]

Options:
  --headless        Run without showing browser (default: visible)
  --save-screenshots Save all screenshots to output dir
  --interval=MS     Screenshot interval in ms (default: 500)
  --timeout=MS      Max playtest duration (default: 120000)
  --verbose, -v     Verbose output
  --help, -h        Show this help

Environment:
  ANTHROPIC_API_KEY  Required - your Claude API key

Examples:
  ANTHROPIC_API_KEY=sk-... bun playtest/vision-agent.js
  bun playtest/vision-agent.js --save-screenshots --interval=300
        `);
        process.exit(0);
    }

    const options = {
        headless: args.includes('--headless'),
        verbose: args.includes('--verbose') || args.includes('-v'),
        saveScreenshots: args.includes('--save-screenshots')
    };

    const intervalArg = args.find(a => a.startsWith('--interval='));
    if (intervalArg) {
        options.screenshotInterval = parseInt(intervalArg.split('=')[1]) || 500;
    }

    const timeoutArg = args.find(a => a.startsWith('--timeout='));
    if (timeoutArg) {
        options.timeout = parseInt(timeoutArg.split('=')[1]) || 120000;
    }

    const runner = new VisionPlaytestRunner(options);
    await runner.run();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VisionAgent, VisionPlaytestRunner };
}

if (require.main === module) {
    main().catch(console.error);
}
