/**
 * Playtest Runner - Orchestrates automated playtesting sessions
 *
 * Manages the full playtest lifecycle: setup, gameplay, data collection, and analysis.
 * Runs in Node.js/Bun with Puppeteer.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PlayerProfiles = require('./player-profiles.js');
const MetricsCollector = require('./metrics-collector.js');
const FeedbackAnalyzer = require('./feedback-analyzer.js');
const PlayerAgent = require('./player-agent.js');

class PlaytestRunner {
    constructor(options = {}) {
        // Resolve output directory relative to project root (parent of playtest/)
        const projectRoot = path.join(__dirname, '..');
        const defaultOutputDir = path.join(projectRoot, '.playtest-output');

        this.options = {
            headless: options.headless ?? true,
            slowMo: options.slowMo ?? 0,
            timeout: options.timeout ?? 180000,  // 3 minutes max
            sampleInterval: options.sampleInterval ?? 100,  // Sample every 100ms
            profiles: options.profiles ?? ['AVERAGE'],
            runsPerProfile: options.runsPerProfile ?? 1,
            outputDir: options.outputDir ?? defaultOutputDir,
            verbose: options.verbose ?? false,
            ...options
        };

        this.browser = null;
        this.page = null;
        this.results = [];
    }

    log(message, ...args) {
        if (this.options.verbose) {
            console.log(`[Playtest] ${message}`, ...args);
        }
    }

    async run() {
        console.log('\n========================================');
        console.log('    MALL HELL - Automated Playtest');
        console.log('========================================\n');

        // Ensure output directory exists
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }

        try {
            // Launch browser
            this.browser = await puppeteer.launch({
                headless: this.options.headless,
                slowMo: this.options.slowMo,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            // Run tests for each profile
            for (const profileName of this.options.profiles) {
                const profile = PlayerProfiles[profileName];
                if (!profile) {
                    console.error(`Unknown profile: ${profileName}`);
                    continue;
                }

                console.log(`\n--- Testing Profile: ${profile.name} ---`);
                console.log(`Description: ${profile.description}\n`);

                for (let run = 1; run <= this.options.runsPerProfile; run++) {
                    console.log(`Run ${run}/${this.options.runsPerProfile}...`);

                    const result = await this.runSingleSession(profile);
                    this.results.push({
                        profile: profileName,
                        run,
                        ...result
                    });

                    // Brief pause between runs
                    await this.sleep(1000);
                }
            }

            // Generate final report
            await this.generateReport();

        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }

        return this.results;
    }

    async runSingleSession(profile) {
        const page = await this.browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });

        // Load the game
        const gamePath = path.join(__dirname, '..', 'index.html');
        await page.goto(`file://${gamePath}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        // Wait for game to initialize
        await page.waitForFunction(() => {
            return window.__gameInternals !== undefined;
        }, { timeout: 10000 });

        // Initialize metrics collector and agent
        const metrics = new MetricsCollector();
        const agent = new PlayerAgent(page, profile);
        await agent.init();

        // Start the game
        await page.evaluate(() => {
            const startBtn = document.querySelector('#start-btn');
            if (startBtn) startBtn.click();
        });

        // Wait for game to actually start
        await page.waitForFunction(() => {
            return window.__gameInternals?.getGameTimer() > 0 ||
                   (window.StateSystem && window.StateSystem.get() === 'PLAYING');
        }, { timeout: 5000 });

        metrics.startSession();
        await agent.start();

        // Main game loop
        const startTime = Date.now();
        let lastSampleTime = 0;
        let gameEnded = false;
        let endCondition = 'timeout';

        while (!gameEnded && (Date.now() - startTime) < this.options.timeout) {
            const now = Date.now();

            // Sample game state periodically
            if (now - lastSampleTime >= this.options.sampleInterval) {
                const gameState = await this.sampleGameState(page);

                // Check for game end
                if (gameState.gameState === 'GAME_OVER') {
                    gameEnded = true;
                    endCondition = gameState.health <= 0 ? 'died' : 'completed';
                    break;
                }

                // Collect metrics
                metrics.sample({
                    fps: gameState.fps,
                    health: gameState.health,
                    score: gameState.score,
                    position: gameState.position,
                    enemyCount: gameState.enemyCount,
                    obstacleCount: gameState.obstacleCount,
                    projectileCount: gameState.projectileCount,
                    dt: now - lastSampleTime
                });

                // Track specific events
                await this.trackEvents(page, metrics, gameState);

                // Let the agent make decisions
                await agent.tick(metrics);

                lastSampleTime = now;
            }

            await this.sleep(16);  // ~60 ticks per second
        }

        await agent.stop();
        metrics.endSession(endCondition);

        // Get final state
        const finalState = await this.sampleGameState(page);

        await page.close();

        // Analyze the session
        const analyzer = new FeedbackAnalyzer();
        const rawMetrics = metrics.generateReport();
        const feedback = analyzer.analyze(metrics.exportRawData(), profile);

        return {
            metrics: rawMetrics,
            feedback,
            rawData: metrics.exportRawData(),
            finalState,
            duration: Date.now() - startTime
        };
    }

    async sampleGameState(page) {
        return await page.evaluate(() => {
            const gi = window.__gameInternals;
            if (!gi) return { gameState: 'UNKNOWN' };

            // Try to get FPS from renderer
            let fps = 60;
            try {
                if (gi.renderer?.info?.render) {
                    // Approximate FPS based on frame time if available
                    fps = 60;  // Default assumption
                }
            } catch (e) {}

            return {
                gameState: window.StateSystem?.get() || 'UNKNOWN',
                score: gi.getScore?.() || 0,
                health: gi.getPlayerHealth?.() || 0,
                position: gi.getPlayerPosition?.() || { x: 0, z: 0 },
                tension: gi.getSlingshotTension?.() || 0,
                isCharging: gi.getIsChargingSlingshot?.() || false,
                enemyCount: gi.getEnemies?.()?.length || 0,
                obstacleCount: gi.getObstacles?.()?.length || 0,
                projectileCount: gi.getProjectiles?.()?.length || 0,
                gameTimer: gi.getGameTimer?.() || 0,
                fps
            };
        });
    }

    async trackEvents(page, metrics, currentState) {
        // Track shooting
        const wasCharging = this.lastState?.isCharging || false;
        if (wasCharging && !currentState.isCharging && currentState.tension > 0) {
            metrics.recordShot(currentState.tension);
        }

        // Track damage (health decreased)
        if (this.lastState?.health && currentState.health < this.lastState.health) {
            const damage = this.lastState.health - currentState.health;
            metrics.recordDamage(damage, 'collision', currentState.health);
        }

        // Track score changes (hits)
        if (this.lastState?.score && currentState.score > this.lastState.score) {
            const points = currentState.score - this.lastState.score;
            const targetType = points >= 300 ? 'enemy' : 'obstacle';
            metrics.recordHit(targetType, points);
            if (points >= 300) {
                metrics.recordEnemyKill();
            }
        }

        // Track close calls
        const threats = await page.evaluate(() => {
            if (!window.__agentHelpers) return [];
            return window.__agentHelpers.getNearbyThreats?.() || [];
        });
        for (const threat of threats) {
            if (threat.distance < 5) {
                metrics.recordCloseCall(threat.distance);
            }
        }

        this.lastState = currentState;
    }

    async generateReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.options.outputDir, `playtest-${timestamp}.json`);
        const summaryPath = path.join(this.options.outputDir, `playtest-${timestamp}.txt`);
        const latestPath = path.join(this.options.outputDir, 'latest.json');
        const latestTxtPath = path.join(this.options.outputDir, 'latest.txt');

        // Group results by profile
        const byProfile = {};
        for (const result of this.results) {
            if (!byProfile[result.profile]) {
                byProfile[result.profile] = [];
            }
            byProfile[result.profile].push(result);
        }

        // Generate comparative analysis
        const analyzer = new FeedbackAnalyzer();
        const comparison = analyzer.compareProfiles(
            Object.fromEntries(
                Object.entries(byProfile).map(([name, results]) =>
                    [name, results.map(r => r.rawData)]
                )
            )
        );

        const fullReport = {
            timestamp: new Date().toISOString(),
            config: this.options,
            results: this.results,
            comparison,
            summary: this.generateTextSummary(byProfile, comparison)
        };

        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
        fs.writeFileSync(latestPath, JSON.stringify(fullReport, null, 2));

        // Save text summary
        const textSummary = this.generateTextSummary(byProfile, comparison);
        fs.writeFileSync(summaryPath, textSummary);
        fs.writeFileSync(latestTxtPath, textSummary);

        console.log('\n========================================');
        console.log('         PLAYTEST REPORT');
        console.log('========================================\n');
        console.log(textSummary);
        console.log(`\nFull report saved to: ${reportPath}`);

        return fullReport;
    }

    generateTextSummary(byProfile, comparison) {
        let summary = '';

        summary += '=== PLAYTEST SUMMARY ===\n\n';

        for (const [profileName, results] of Object.entries(byProfile)) {
            const profile = PlayerProfiles[profileName];
            summary += `\n--- ${profile.name} (${profile.description}) ---\n`;

            for (let i = 0; i < results.length; i++) {
                const r = results[i];
                summary += `\nRun ${i + 1}:\n`;
                summary += `  Score: ${r.metrics.score.final} (${r.metrics.score.perMinute}/min)\n`;
                summary += `  Completion: ${r.metrics.session.completionPercent}%\n`;
                summary += `  End: ${r.metrics.session.endCondition}\n`;
                summary += `  Duration: ${r.metrics.session.duration?.toFixed(1)}s\n`;
                summary += `  Combat:\n`;
                summary += `    - Shots: ${r.metrics.combat.shotsFired}\n`;
                summary += `    - Accuracy: ${r.metrics.combat.accuracy}\n`;
                summary += `    - Kills: ${r.metrics.combat.enemiesKilled}\n`;
                summary += `  Survival:\n`;
                summary += `    - Damage: ${r.metrics.survival.totalDamage}\n`;
                summary += `    - Deaths: ${r.metrics.survival.deaths}\n`;
                summary += `  Rating: ${r.feedback.overallRating}/10\n`;

                // Top issues
                const criticalIssues = r.feedback.issues.filter(i => i.severity === 'critical');
                const warnings = r.feedback.issues.filter(i => i.severity === 'warning');

                if (criticalIssues.length > 0) {
                    summary += `  Critical Issues:\n`;
                    for (const issue of criticalIssues.slice(0, 3)) {
                        summary += `    ! ${issue.message}\n`;
                    }
                }
                if (warnings.length > 0) {
                    summary += `  Warnings:\n`;
                    for (const issue of warnings.slice(0, 3)) {
                        summary += `    * ${issue.message}\n`;
                    }
                }

                // Positives
                if (r.feedback.positives.length > 0) {
                    summary += `  Positives:\n`;
                    for (const pos of r.feedback.positives.slice(0, 3)) {
                        summary += `    + ${pos}\n`;
                    }
                }
            }
        }

        // Comparison insights
        if (comparison.insights && comparison.insights.length > 0) {
            summary += '\n\n=== CROSS-PROFILE INSIGHTS ===\n';
            for (const insight of comparison.insights) {
                summary += `\n[${insight.type.toUpperCase()}] ${insight.message}\n`;
                summary += `  Suggestion: ${insight.suggestion}\n`;
            }
        }

        // Overall recommendations
        summary += '\n\n=== TOP RECOMMENDATIONS ===\n';

        // Collect all suggestions
        const allSuggestions = {};
        for (const results of Object.values(byProfile)) {
            for (const r of results) {
                for (const issue of r.feedback.issues) {
                    if (issue.suggestion) {
                        allSuggestions[issue.suggestion] =
                            (allSuggestions[issue.suggestion] || 0) + 1;
                    }
                }
            }
        }

        // Sort by frequency
        const sortedSuggestions = Object.entries(allSuggestions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (let i = 0; i < sortedSuggestions.length; i++) {
            const [suggestion, count] = sortedSuggestions[i];
            summary += `${i + 1}. ${suggestion} (mentioned ${count}x)\n`;
        }

        return summary;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        headless: !args.includes('--show'),
        verbose: args.includes('--verbose') || args.includes('-v'),
        profiles: [],
        runsPerProfile: 1
    };

    // Parse profiles
    const profileArg = args.find(a => a.startsWith('--profile='));
    if (profileArg) {
        options.profiles = profileArg.split('=')[1].split(',').map(p => p.toUpperCase());
    } else if (args.includes('--all')) {
        options.profiles = Object.keys(PlayerProfiles).filter(k => typeof PlayerProfiles[k] === 'object');
    } else {
        options.profiles = ['NOVICE', 'AVERAGE', 'SKILLED'];  // Default set
    }

    // Parse runs
    const runsArg = args.find(a => a.startsWith('--runs='));
    if (runsArg) {
        options.runsPerProfile = parseInt(runsArg.split('=')[1]) || 1;
    }

    // Help
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Mall Hell - Automated Playtest Agent

Usage: bun playtest/playtest-runner.js [options]

Options:
  --profile=NAME    Test specific profile (NOVICE, AVERAGE, SKILLED, EXPERT, CHAOTIC, AFK)
                    Can be comma-separated: --profile=NOVICE,AVERAGE
  --all             Test all profiles
  --runs=N          Number of runs per profile (default: 1)
  --show            Show browser window (not headless)
  --verbose, -v     Verbose output
  --help, -h        Show this help

Examples:
  bun playtest/playtest-runner.js                    # Test NOVICE, AVERAGE, SKILLED
  bun playtest/playtest-runner.js --profile=EXPERT   # Test only EXPERT
  bun playtest/playtest-runner.js --all --runs=3     # Test all profiles 3 times each
  bun playtest/playtest-runner.js --show --verbose   # Watch the game with detailed output
        `);
        process.exit(0);
    }

    console.log('Configuration:', options);

    const runner = new PlaytestRunner(options);
    await runner.run();
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlaytestRunner, PlayerProfiles, MetricsCollector, FeedbackAnalyzer, PlayerAgent };
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
