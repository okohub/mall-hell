const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const PNG = require('pngjs').PNG;

// Directories
const BASELINE_DIR = path.join(__dirname, 'tests/baselines');
const CURRENT_DIR = path.join(__dirname, 'screenshots');
const TEST_OUTPUT_DIR = path.join(__dirname, '.test-output');
const OUTPUT_FILE = path.join(TEST_OUTPUT_DIR, 'test-results.txt');
const JSON_OUTPUT = path.join(TEST_OUTPUT_DIR, 'test-results.json');

// Ensure test output directory exists
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Capture console output
let outputLines = [];
const originalLog = console.log;
console.log = (...args) => {
    const line = args.join(' ');
    outputLines.push(line);
    originalLog.apply(console, args);
};

// Ensure directories exist
if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
}
if (!fs.existsSync(CURRENT_DIR)) {
    fs.mkdirSync(CURRENT_DIR, { recursive: true });
}

// Check if we're updating baselines
const UPDATE_BASELINES = process.argv.includes('--update-baselines');

// Check for --only or --test flag to run specific tests
// Supports: --only testname, --test=testname, --test testname
let ONLY_TESTS = [];
const onlyIndex = process.argv.indexOf('--only');
if (onlyIndex !== -1) {
    ONLY_TESTS = process.argv.slice(onlyIndex + 1).filter(arg => !arg.startsWith('--'));
}
// Also support --test=name syntax
process.argv.forEach(arg => {
    if (arg.startsWith('--test=')) {
        ONLY_TESTS.push(arg.substring(7));
    }
});
const testIndex = process.argv.indexOf('--test');
if (testIndex !== -1 && process.argv[testIndex + 1] && !process.argv[testIndex + 1].startsWith('--')) {
    ONLY_TESTS.push(process.argv[testIndex + 1]);
}

// Shared progress state
const progress = {
    unit: { passed: 0, failed: 0, total: 0, done: false },
    ui: { passed: 0, failed: 0, total: 0, current: '', done: false }
};

function updateProgressDisplay() {
    const unitStatus = progress.unit.done
        ? `✅ ${progress.unit.passed}/${progress.unit.total}`
        : `⏳ ${progress.unit.passed + progress.unit.failed}/${progress.unit.total}`;

    const uiStatus = progress.ui.done
        ? `✅ ${progress.ui.passed}/${progress.ui.total}`
        : `⏳ ${progress.ui.passed + progress.ui.failed}/${progress.ui.total}`;

    let testName = progress.ui.current || '';
    if (testName.length > 40) {
        testName = testName.substring(0, 37) + '...';
    }
    const currentTest = testName ? ` [${testName}]` : '';

    process.stdout.write(`\r  Unit: ${unitStatus} | UI: ${uiStatus}${currentTest}`.padEnd(120));
}

// Compare two PNG images, return difference percentage
function compareImages(baselinePath, currentPath) {
    if (!fs.existsSync(baselinePath)) {
        return { match: false, reason: 'no_baseline', diff: 100 };
    }
    if (!fs.existsSync(currentPath)) {
        return { match: false, reason: 'no_current', diff: 100 };
    }

    try {
        const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
        const current = PNG.sync.read(fs.readFileSync(currentPath));

        // Check dimensions
        if (baseline.width !== current.width || baseline.height !== current.height) {
            return { match: false, reason: 'size_mismatch', diff: 100 };
        }

        // Compare pixels
        let diffPixels = 0;
        const totalPixels = baseline.width * baseline.height;

        for (let i = 0; i < baseline.data.length; i += 4) {
            const rDiff = Math.abs(baseline.data[i] - current.data[i]);
            const gDiff = Math.abs(baseline.data[i + 1] - current.data[i + 1]);
            const bDiff = Math.abs(baseline.data[i + 2] - current.data[i + 2]);

            // Allow small color differences (anti-aliasing, etc.)
            if (rDiff > 10 || gDiff > 10 || bDiff > 10) {
                diffPixels++;
            }
        }

        const diffPercent = (diffPixels / totalPixels) * 100;
        const threshold = 1; // 1% threshold for differences

        return {
            match: diffPercent <= threshold,
            reason: diffPercent <= threshold ? 'match' : 'visual_diff',
            diff: diffPercent.toFixed(2)
        };
    } catch (error) {
        return { match: false, reason: 'error', diff: 100, error: error.message };
    }
}

// Clean up current screenshots
function cleanupScreenshots() {
    if (fs.existsSync(CURRENT_DIR)) {
        const files = fs.readdirSync(CURRENT_DIR);
        files.forEach(file => {
            if (file.endsWith('.png')) {
                fs.unlinkSync(path.join(CURRENT_DIR, file));
            }
        });
    }
}

async function runTests() {
    // Clean up old screenshots and result files at start
    cleanupScreenshots();
    if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);
    if (fs.existsSync(JSON_OUTPUT)) fs.unlinkSync(JSON_OUTPUT);
    outputLines = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    console.log('\n🧪 MALL HELL TEST RUNNER\n');
    console.log('='.repeat(60));

    if (UPDATE_BASELINES) {
        console.log('\n📸 MODE: Updating baseline screenshots');
    }
    if (ONLY_TESTS.length > 0) {
        console.log(`\n🎯 Running only: ${ONLY_TESTS.join(', ')}`);
    }
    console.log('\n⚡ Running Unit Tests and UI Tests in parallel...\n');

    const progressInterval = setInterval(updateProgressDisplay, 200);

    const [unitResults, uiResults] = await Promise.all([
        runUnitTests(browser),
        runUITests(browser)
    ]);

    clearInterval(progressInterval);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');

    // Display results
    console.log('\n📋 UNIT TESTS\n');
    if (unitResults.failedTests.length > 0) {
        console.log('  Failed tests:');
        unitResults.failedTests.forEach(t => {
            console.log(`  ❌ [${t.module}] ${t.name}`);
            if (t.error) console.log(`     Error: ${t.error}`);
        });
        console.log('');
    }
    console.log(`  📊 Results: ${unitResults.passed} passed, ${unitResults.failed} failed`);

    console.log('\n📋 UI TESTS\n');
    if (uiResults.failedTests.length > 0) {
        console.log('  Failed tests:');
        uiResults.failedTests.forEach(t => {
            console.log(`  ❌ [${t.group}] ${t.name}`);
            if (t.error) console.log(`     Error: ${t.error}`);
        });
        console.log('');
    }
    console.log(`  📊 Results: ${uiResults.passed} passed, ${uiResults.failed} failed, ${uiResults.pending} pending`);

    // Visual regression results
    console.log('\n📸 VISUAL REGRESSION\n');
    if (UPDATE_BASELINES) {
        console.log(`  ✅ Updated ${uiResults.screenshots.length} baseline screenshots`);
        console.log(`  📁 Baselines saved to: ${BASELINE_DIR}/`);
    } else if (uiResults.visualRegressions) {
        const regressions = uiResults.visualRegressions.filter(r => !r.match);
        const passed = uiResults.visualRegressions.filter(r => r.match);

        if (regressions.length > 0) {
            console.log('  Visual differences detected:');
            regressions.forEach(r => {
                if (r.reason === 'no_baseline') {
                    console.log(`  ⚠️  ${r.name}: No baseline (run with --update-baselines)`);
                } else {
                    console.log(`  ❌ ${r.name}: ${r.diff}% different`);
                }
            });
            console.log('');
        }
        console.log(`  📊 Results: ${passed.length} match, ${regressions.length} differ`);
    }

    await browser.close();

    // Cleanup screenshots after comparison (unless updating baselines)
    if (!UPDATE_BASELINES) {
        cleanupScreenshots();
        console.log('\n  🧹 Cleaned up test screenshots');
    }

    const totalPassed = unitResults.passed + uiResults.passed;
    const totalFailed = unitResults.failed + uiResults.failed;
    const visualFailed = uiResults.visualRegressions?.filter(r => !r.match && r.reason !== 'no_baseline').length || 0;

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 FINAL RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
    if (visualFailed > 0) {
        console.log(`   ⚠️  ${visualFailed} visual regression(s) detected`);
    }
    console.log('');

    // Write results to files
    const jsonResults = {
        timestamp: new Date().toISOString(),
        summary: {
            totalPassed,
            totalFailed,
            visualRegressions: visualFailed
        },
        unit: {
            passed: unitResults.passed,
            failed: unitResults.failed,
            failedTests: unitResults.failedTests
        },
        ui: {
            passed: uiResults.passed,
            failed: uiResults.failed,
            pending: uiResults.pending,
            failedTests: uiResults.failedTests,
            visualRegressions: uiResults.visualRegressions
        }
    };

    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(jsonResults, null, 2));
    fs.writeFileSync(OUTPUT_FILE, outputLines.join('\n'));

    if (totalFailed > 0 || visualFailed > 0) {
        process.exit(1);
    }
}

async function runUnitTests(browser) {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, 'tests/unit-tests.html');
    let passed = 0, failed = 0;
    let failedTests = [];

    try {
        await page.goto(`file://${filePath}`, { waitUntil: 'domcontentloaded', timeout: 10000 });

        await new Promise(resolve => setTimeout(resolve, 500));
        const total = await page.evaluate(() => {
            return document.querySelectorAll('.test-item').length || 65;
        });
        progress.unit.total = total || 65;

        let attempts = 0;
        while (attempts < 30) {
            const results = await page.evaluate(() => {
                const testItems = document.querySelectorAll('.test-item');
                let passed = 0, failed = 0;
                testItems.forEach(item => {
                    if (item.classList.contains('passed')) passed++;
                    if (item.classList.contains('failed')) failed++;
                });
                return { passed, failed, total: testItems.length };
            });

            progress.unit.passed = results.passed;
            progress.unit.failed = results.failed;
            progress.unit.total = results.total || progress.unit.total;

            if (results.passed + results.failed >= progress.unit.total && progress.unit.total > 0) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }

        const results = await page.evaluate(() => {
            const testModules = document.querySelectorAll('.test-module');
            const output = { passed: 0, failed: 0, tests: [] };

            testModules.forEach(module => {
                const moduleName = module.querySelector('.module-header span')?.textContent || 'Unknown Module';
                const testItems = module.querySelectorAll('.test-item');

                testItems.forEach(item => {
                    const name = item.querySelector('.test-name')?.textContent || '';
                    const isPassed = item.classList.contains('passed');
                    const isFailed = item.classList.contains('failed');
                    const error = item.querySelector('.error-message')?.textContent || '';

                    if (isPassed) output.passed++;
                    if (isFailed) output.failed++;

                    output.tests.push({
                        module: moduleName,
                        name,
                        status: isPassed ? 'PASS' : isFailed ? 'FAIL' : 'UNKNOWN',
                        error
                    });
                });
            });

            return output;
        });

        failedTests = results.tests.filter(t => t.status === 'FAIL');
        passed = results.passed;
        failed = results.failed;

        progress.unit.passed = passed;
        progress.unit.failed = failed;
        progress.unit.done = true;

    } catch (error) {
        console.log(`\n  ⚠️  Unit Tests Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed, failedTests };
}

async function runUITests(browser) {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, 'tests/ui-tests.html');
    let passed = 0, failed = 0, pending = 0;
    let failedTests = [];
    let screenshotsTaken = [];
    let visualRegressions = [];

    // Screenshot names for visual regression
    const SCREENSHOT_POINTS = [
        'menu_initial',
        'game_playing',
        'game_paused',
        'game_final'
    ];

    // Helper to take and compare screenshot
    async function captureScreenshot(name) {
        const currentPath = path.join(CURRENT_DIR, `${name}.png`);
        const baselinePath = path.join(BASELINE_DIR, `${name}.png`);

        // Take screenshot of game iframe
        const frame = await page.$('iframe#game-frame');
        if (frame) {
            await frame.screenshot({ path: currentPath });
        } else {
            await page.screenshot({ path: currentPath, fullPage: false });
        }

        screenshotsTaken.push(currentPath);

        if (UPDATE_BASELINES) {
            // Copy to baselines
            fs.copyFileSync(currentPath, baselinePath);
        } else {
            // Compare to baseline
            const result = compareImages(baselinePath, currentPath);
            visualRegressions.push({ name, ...result });
        }

        return currentPath;
    }

    try {
        await page.setViewport({ width: 1400, height: 900 });
        await page.goto(`file://${filePath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Screenshot 1: Menu state
        await captureScreenshot('menu_initial');

        // Filter tests if --only flag is used
        if (ONLY_TESTS.length > 0) {
            await page.evaluate((testNames) => {
                if (window.runner && window.runner.tests) {
                    window.runner.tests = window.runner.tests.filter(t =>
                        testNames.some(name =>
                            t.name.toLowerCase().includes(name.toLowerCase()) ||
                            t.id?.toLowerCase().includes(name.toLowerCase())
                        )
                    );
                }
            }, ONLY_TESTS);
        }

        const totalTests = await page.evaluate(() => {
            return window.runner?.tests?.length || 0;
        });
        progress.ui.total = totalTests;

        // Click run all button
        await page.evaluate(() => {
            const runBtn = document.querySelector('#run-all-btn');
            if (runBtn) runBtn.click();
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Screenshot 2: Game playing
        await captureScreenshot('game_playing');

        // Monitor test progress
        let stableCount = 0;
        let attempts = 0;
        let lastCompleted = 0;

        while (attempts < 120) {
            const status = await page.evaluate(() => {
                const runner = window.runner;
                if (!runner) return { isRunning: false, completed: 0, total: 0, passed: 0, failed: 0, current: '' };

                const passed = runner.tests.filter(t => t.status === 'pass').length;
                const failed = runner.tests.filter(t => t.status === 'fail').length;
                const total = runner.tests.length;
                const current = runner.currentTest?.name || '';

                return {
                    isRunning: runner.isRunning,
                    completed: passed + failed,
                    total,
                    passed,
                    failed,
                    current
                };
            });

            progress.ui.passed = status.passed;
            progress.ui.failed = status.failed;
            progress.ui.total = status.total;
            progress.ui.current = status.current;

            if (!status.isRunning && status.completed === status.total && status.total > 0) {
                break;
            }

            if (status.completed === lastCompleted) {
                stableCount++;
            } else {
                stableCount = 0;
                lastCompleted = status.completed;
            }

            if (stableCount > 10 && status.completed > 0) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        // Get final results
        const results = await page.evaluate(() => {
            const runner = window.runner;
            if (!runner) return { passed: 0, failed: 0, tests: [] };

            return {
                passed: runner.tests.filter(t => t.status === 'pass').length,
                failed: runner.tests.filter(t => t.status === 'fail').length,
                tests: runner.tests.map(t => ({
                    name: t.name,
                    group: t.group,
                    status: t.status === 'pass' ? 'PASS' : t.status === 'fail' ? 'FAIL' : 'PENDING',
                    error: t.error || ''
                }))
            };
        });

        failedTests = results.tests.filter(t => t.status === 'FAIL');
        passed = results.passed;
        failed = results.failed;
        pending = results.tests.filter(t => t.status === 'PENDING').length;

        // Screenshot 3: Final game state
        await captureScreenshot('game_final');

        progress.ui.passed = passed;
        progress.ui.failed = failed;
        progress.ui.current = '';
        progress.ui.done = true;

    } catch (error) {
        console.log(`\n  ⚠️  UI Tests Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed, pending, failedTests, screenshots: screenshotsTaken, visualRegressions };
}

runTests().catch(console.error);
