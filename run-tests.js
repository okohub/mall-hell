const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURATION
// ============================================

const TEST_OUTPUT_DIR = path.join(__dirname, '.test-output');
const LATEST_JSON = path.join(TEST_OUTPUT_DIR, 'latest.json');
const LATEST_TXT = path.join(TEST_OUTPUT_DIR, 'latest.txt');

// Generate timestamped filenames
const RUN_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUTPUT_FILE = path.join(TEST_OUTPUT_DIR, `run-${RUN_TIMESTAMP}.txt`);
const JSON_OUTPUT = path.join(TEST_OUTPUT_DIR, `run-${RUN_TIMESTAMP}.json`);

// Ensure directories exist
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// ============================================
// ARGUMENT PARSING
// ============================================

const args = process.argv.slice(2);

// Valid flags
const VALID_FLAGS = [
    '--unit', '-u',
    '--ui', '-i',
    '--suite',
    '--quiet', '-q',
    '--failed', '-f',
    '--list', '-l',
    '--fail-fast', '-x',
    '--only',
    '--test',
    '--group',
    '--domain',
    '--help', '-h'
];

// Check for unrecognized flags
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('-')) {
        // Extract flag name (before = if present)
        const flagName = arg.split('=')[0];
        if (!VALID_FLAGS.includes(flagName)) {
            console.error(`\n❌ Unrecognized flag: ${arg}`);
            console.error('\nValid flags:');
            console.error('  --unit, -u        Run only unit tests');
            console.error('  --ui, -i          Run only UI tests');
            console.error('  --suite=<name>    Run specific test suite (integration)');
            console.error('  --quiet, -q       Minimal output');
            console.error('  --failed, -f      Re-run failed tests from last run');
            console.error('  --fail-fast, -x   Exit immediately on first failure');
            console.error('  --list, -l        List previous test runs');
            console.error('  --test=<name>     Run specific test by name');
            console.error('  --group=<name>    Run specific test group');
            console.error('  --domain=<name>   Run tests for specific domain');
            console.error('  --help, -h        Show this help');
            process.exit(1);
        }
    }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
    console.log('\nMall Hell Test Runner\n');
    console.log('Usage: bun run-tests.js [options]');
    console.log('\nOptions:');
    console.log('  --unit, -u        Run only unit tests');
    console.log('  --ui, -i          Run only UI tests');
    console.log('  --suite=<name>    Run specific test suite (integration)');
    console.log('  --quiet, -q       Minimal output');
    console.log('  --failed, -f      Re-run failed tests from last run');
    console.log('  --fail-fast, -x   Exit immediately on first failure');
    console.log('  --list, -l        List previous test runs');
    console.log('  --test=<name>     Run specific test by name');
    console.log('  --group=<name>    Run specific test group');
    console.log('  --domain=<name>   Run tests for specific domain');
    console.log('  --help, -h        Show this help');
    console.log('\nExamples:');
    console.log('  bun run-tests.js --domain=enemy');
    console.log('  bun run-tests.js --suite=integration');
    console.log('  bun run-tests.js --failed');
    console.log('  bun run-tests.js --fail-fast');
    console.log('  bun run-tests.js --test="should spawn skeleton"');
    process.exit(0);
}

// Test mode flags
const UNIT_ONLY = args.includes('--unit') || args.includes('-u');
const UI_ONLY = args.includes('--ui') || args.includes('-i');
const QUIET = args.includes('--quiet') || args.includes('-q');
const VERBOSE = !QUIET;
const RUN_FAILED = args.includes('--failed') || args.includes('-f');
const FAIL_FAST = args.includes('--fail-fast') || args.includes('-x');
const LIST_RUNS = args.includes('--list') || args.includes('-l');

// Parse --suite flag
let SUITE = null;
const suiteArg = args.find(arg => arg.startsWith('--suite='));
if (suiteArg) {
    SUITE = suiteArg.split('=')[1];
}

// Specific test/group/domain filters
let ONLY_TESTS = [];
let TEST_GROUPS = [];
let UNIT_DOMAINS = [];

args.forEach((arg, i) => {
    if (arg === '--only' && args[i + 1] && !args[i + 1].startsWith('-')) {
        ONLY_TESTS.push(...args.slice(i + 1).filter(a => !a.startsWith('-')));
    }
    if (arg.startsWith('--test=')) {
        ONLY_TESTS.push(arg.substring(7));
    }
    if (arg === '--test' && args[i + 1] && !args[i + 1].startsWith('-')) {
        ONLY_TESTS.push(args[i + 1]);
    }
    if (arg.startsWith('--group=')) {
        TEST_GROUPS.push(arg.substring(8).toLowerCase());
    }
    if (arg === '--group' && args[i + 1] && !args[i + 1].startsWith('-')) {
        TEST_GROUPS.push(args[i + 1].toLowerCase());
    }
    if (arg.startsWith('--domain=')) {
        UNIT_DOMAINS.push(arg.substring(9).toLowerCase());
    }
    if (arg === '--domain' && args[i + 1] && !args[i + 1].startsWith('-')) {
        UNIT_DOMAINS.push(args[i + 1].toLowerCase());
    }
});

// ============================================
// LOAD FAILED TESTS FROM LAST RUN
// ============================================

function loadFailedTestsFromLastRun() {
    if (!fs.existsSync(LATEST_JSON)) {
        console.log('⚠️  No previous test run found. Running all tests.');
        return { unitTests: [], uiTests: [] };
    }

    try {
        const lastRun = JSON.parse(fs.readFileSync(LATEST_JSON, 'utf-8'));
        const unitTests = lastRun.unit?.failedTests?.map(t => t.name) || [];
        const uiTests = lastRun.ui?.failedTests?.map(t => t.name) || [];

        if (unitTests.length === 0 && uiTests.length === 0) {
            console.log('✅ No failed tests in last run. Nothing to re-run.');
            process.exit(0);
        }

        console.log(`\n🔄 Re-running ${unitTests.length} unit + ${uiTests.length} UI failed tests from last run\n`);
        return { unitTests, uiTests };
    } catch (e) {
        console.log('⚠️  Could not parse last run results. Running all tests.');
        return { unitTests: [], uiTests: [] };
    }
}

// ============================================
// LIST PREVIOUS RUNS
// ============================================

function listPreviousRuns() {
    const files = fs.readdirSync(TEST_OUTPUT_DIR)
        .filter(f => f.startsWith('run-') && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 10);

    console.log('\n📋 RECENT TEST RUNS (last 10)\n');
    console.log('='.repeat(60));

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(TEST_OUTPUT_DIR, file), 'utf-8'));
            const passed = data.summary?.totalPassed || 0;
            const failed = data.summary?.totalFailed || 0;
            const status = failed > 0 ? '❌' : '✅';
            const timestamp = file.replace('run-', '').replace('.json', '').replace('T', ' ');
            console.log(`  ${status} ${timestamp}  |  ${passed} passed, ${failed} failed`);
        } catch (e) {
            console.log(`  ⚠️  ${file} (unreadable)`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📁 Output directory: .test-output/');
    console.log('📄 Latest results: .test-output/latest.json\n');
}

if (LIST_RUNS) {
    listPreviousRuns();
    process.exit(0);
}

// Load failed tests if --failed flag is used
let FAILED_TESTS = { unitTests: [], uiTests: [] };
if (RUN_FAILED) {
    FAILED_TESTS = loadFailedTestsFromLastRun();
    // Add failed UI tests to ONLY_TESTS filter
    if (FAILED_TESTS.uiTests.length > 0) {
        ONLY_TESTS.push(...FAILED_TESTS.uiTests);
    }
}

// ============================================
// OUTPUT CAPTURE
// ============================================

let outputLines = [];
const originalLog = console.log;
console.log = (...args) => {
    const line = args.join(' ');
    outputLines.push(line);
    originalLog.apply(console, args);
};

function logProgress(message) {
    outputLines.push(message);
    process.stderr.write(message + '\n');
}

// ============================================
// PROGRESS TRACKING
// ============================================

const progress = {
    unit: { passed: 0, failed: 0, total: 0, done: false, lastLogged: 0 },
    ui: { passed: 0, failed: 0, total: 0, current: '', done: false, lastTest: '' }
};

function updateProgressDisplay() {
    if (!VERBOSE) {
        const unitStatus = progress.unit.done
            ? `✅ ${progress.unit.passed}/${progress.unit.total}`
            : `⏳ ${progress.unit.passed + progress.unit.failed}/${progress.unit.total}`;

        const uiStatus = progress.ui.done
            ? `✅ ${progress.ui.passed}/${progress.ui.total}`
            : `⏳ ${progress.ui.passed + progress.ui.failed}/${progress.ui.total}`;

        let testName = progress.ui.current || '';
        if (testName.length > 40) testName = testName.substring(0, 37) + '...';
        const currentTest = testName ? ` [${testName}]` : '';

        process.stdout.write(`\r  Unit: ${unitStatus} | UI: ${uiStatus}${currentTest}`.padEnd(120));
    } else {
        const unitCompleted = progress.unit.passed + progress.unit.failed;
        if (unitCompleted > progress.unit.lastLogged) {
            const delta = unitCompleted - progress.unit.lastLogged;
            logProgress(`  [Unit] ${unitCompleted}/${progress.unit.total} completed (+${delta})`);
            progress.unit.lastLogged = unitCompleted;
        }
        if (progress.ui.current && progress.ui.current !== progress.ui.lastTest) {
            const status = progress.ui.passed + progress.ui.failed;
            logProgress(`  [UI ${status}/${progress.ui.total}] Running: ${progress.ui.current}`);
            progress.ui.lastTest = progress.ui.current;
        }
    }
}

// ============================================
// UNIT TEST RUNNER
// ============================================

async function runUnitTests(browser) {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, 'tests/unit-tests.html');
    let passed = 0, failed = 0;
    let failedTests = [];

    // Build domain filter query string if domains specified
    let url = `file://${filePath}`;
    if (UNIT_DOMAINS.length > 0) {
        url += `?domains=${UNIT_DOMAINS.join(',')}`;
    }
    if (RUN_FAILED && FAILED_TESTS.unitTests.length > 0) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}tests=${encodeURIComponent(FAILED_TESTS.unitTests.join(','))}`;
    }

    try {
        if (VERBOSE && (UNIT_DOMAINS.length > 0 || (RUN_FAILED && FAILED_TESTS.unitTests.length > 0))) {
            logProgress(`  [Unit] Filtering: domains=${UNIT_DOMAINS.join(',') || 'all'}`);
        }
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(resolve => setTimeout(resolve, 500));

        const total = await page.evaluate(() => {
            return document.querySelectorAll('.test-item').length || 65;
        });
        progress.unit.total = total || 65;

        let attempts = 0;
        const maxAttempts = 200; // 200 * 200ms = 40 seconds max wait for unit tests
        while (attempts < maxAttempts) {
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

            // Fail fast: exit immediately on first failure
            if (FAIL_FAST && results.failed > 0) {
                logProgress(`  [Unit] ❌ FAIL FAST: ${results.failed} failure(s) detected, stopping`);
                break;
            }

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

        if (VERBOSE) {
            logProgress(`  [Unit] ✅ COMPLETE: ${passed} passed, ${failed} failed`);
        }

    } catch (error) {
        console.log(`\n  ⚠️  Unit Tests Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed, failedTests };
}

// ============================================
// UI TEST RUNNER
// ============================================

async function runUITests(browser) {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, 'tests/ui-tests.html');
    let passed = 0, failed = 0, pending = 0;
    let failedTests = [];

    // Capture console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            logProgress(`  [UI Browser Error] ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        logProgress(`  [UI Page Error] ${error.message}`);
    });

    try {
        await page.setViewport({ width: 1400, height: 900 });
        await page.goto(`file://${filePath}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

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

        if (TEST_GROUPS.length > 0) {
            await page.evaluate((groups) => {
                if (window.runner && window.runner.tests) {
                    window.runner.tests = window.runner.tests.filter(t => {
                        const testGroup = (t.group || '').toLowerCase();
                        return groups.some(g =>
                            testGroup.includes(g) ||
                            t.id?.toLowerCase().startsWith(g) ||
                            t.name?.toLowerCase().includes(g)
                        );
                    });
                }
            }, TEST_GROUPS);
        }

        // Domain filtering for UI tests (filters by test file/id prefix)
        if (UNIT_DOMAINS.length > 0) {
            await page.evaluate((domains) => {
                if (window.runner && window.runner.tests) {
                    // Map domains to their typical UI test groups/prefixes
                    const domainGroupMap = {
                        'enemy': ['enemy', 'skeleton', 'collision', 'spawning'],
                        'weapon': ['fps', 'weapon', 'charging', 'projectile', 'slingshot'],
                        'player': ['player', 'movement', 'health', 'keyboard'],
                        'environment': ['visual', 'shelf', 'obstacle', 'room'],
                        'ui': ['menu', 'hud', 'button', 'crosshair', 'state'],
                        'engine': ['game start', 'game over', 'pause', 'state transition']
                    };

                    const relevantGroups = domains.flatMap(d => domainGroupMap[d] || [d]);

                    window.runner.tests = window.runner.tests.filter(t => {
                        const testGroup = (t.group || '').toLowerCase();
                        const testId = (t.id || '').toLowerCase();
                        const testName = (t.name || '').toLowerCase();

                        return relevantGroups.some(g =>
                            testGroup.includes(g) ||
                            testId.includes(g) ||
                            testName.includes(g)
                        );
                    });
                }
            }, UNIT_DOMAINS);

            if (VERBOSE) {
                logProgress(`  [UI] Filtering by domains: ${UNIT_DOMAINS.join(', ')}`);
            }
        }

        const totalTests = await page.evaluate(() => window.runner?.tests?.length || 0);
        progress.ui.total = totalTests;

        if (VERBOSE) {
            logProgress(`  [UI] Found ${totalTests} tests registered`);
        }

        // Check if runner is ready
        const runnerStatus = await page.evaluate(() => {
            return {
                runnerExists: !!window.runner,
                testsCount: window.runner?.tests?.length || 0,
                gameWindow: !!window.runner?.gameWindow,
                gameDocument: !!window.runner?.gameDocument,
                buttonExists: !!document.querySelector('#run-all-btn')
            };
        });

        if (VERBOSE) {
            logProgress(`  [UI] Runner status: ${JSON.stringify(runnerStatus)}`);
        }

        await page.evaluate(() => {
            const runBtn = document.querySelector('#run-all-btn');
            if (runBtn) runBtn.click();
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        let stableCount = 0, attempts = 0, lastCompleted = 0;
        let loggedTests = new Set();

        // Calculate max wait time: increased to allow slower UI runs on CI or heavy scenes
        const maxAttempts = 400; // 400 * 500ms = 200 seconds total

        while (attempts < maxAttempts) {
            const status = await page.evaluate(() => {
                const runner = window.runner;
                if (!runner) return { isRunning: false, completed: 0, total: 0, passed: 0, failed: 0, current: '', completedTests: [] };

                const passed = runner.tests.filter(t => t.status === 'pass').length;
                const failed = runner.tests.filter(t => t.status === 'fail').length;
                const completedTests = runner.tests
                    .filter(t => t.status === 'pass' || t.status === 'fail')
                    .map(t => ({ name: t.name, group: t.group, status: t.status }));

                return {
                    isRunning: runner.isRunning,
                    completed: passed + failed,
                    total: runner.tests.length,
                    passed,
                    failed,
                    current: runner.currentTest?.name || '',
                    completedTests
                };
            });

            progress.ui.passed = status.passed;
            progress.ui.failed = status.failed;
            progress.ui.total = status.total;
            progress.ui.current = status.current;

            if (VERBOSE && status.completedTests) {
                for (const test of status.completedTests) {
                    if (!loggedTests.has(test.name)) {
                        const icon = test.status === 'pass' ? '✓' : '✗';
                        const color = test.status === 'pass' ? '' : ' ❌';
                        logProgress(`  [UI] ${icon} [${test.group}] ${test.name}${color}`);
                        loggedTests.add(test.name);
                    }
                }
            }

            // Fail fast: exit immediately on first failure
            if (FAIL_FAST && status.failed > 0) {
                logProgress(`  [UI] ❌ FAIL FAST: ${status.failed} failure(s) detected, stopping`);
                break;
            }

            // Exit when all tests are complete
            if (!status.isRunning && status.completed === status.total && status.total > 0) break;

            // Track stability (no progress)
            if (status.completed === lastCompleted) {
                stableCount++;
            } else {
                stableCount = 0;
                lastCompleted = status.completed;
            }

            // Only break on stability if we've waited long enough (60 seconds of no progress)
            // This prevents premature exit when tests are just running slowly
            if (stableCount > 120 && status.completed > 0) {
                if (VERBOSE) {
                    logProgress(`  [UI] No progress for 30 seconds, stopping (${status.completed}/${status.total} tests completed)`);
                }
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

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

        progress.ui.passed = passed;
        progress.ui.failed = failed;
        progress.ui.current = '';
        progress.ui.done = true;

        if (VERBOSE) {
            logProgress(`  [UI] ✅ COMPLETE: ${passed} passed, ${failed} failed, ${pending} pending`);
        }

    } catch (error) {
        console.log(`\n  ⚠️  UI Tests Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed, pending, failedTests };
}

// ============================================
// DISPLAY RESULTS
// ============================================

function displayUnitResults(unitResults) {
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
}

function displayUIResults(uiResults) {
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
}

// ============================================
// MAIN RUNNERS
// ============================================

async function runAllTests() {
    if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);
    if (fs.existsSync(JSON_OUTPUT)) fs.unlinkSync(JSON_OUTPUT);
    outputLines = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    console.log('\n🧪 MALL HELL TEST RUNNER\n');
    console.log('='.repeat(60));

    if (ONLY_TESTS.length > 0) console.log(`\n🎯 Running only: ${ONLY_TESTS.join(', ')}`);
    if (TEST_GROUPS.length > 0) console.log(`\n📂 Running groups: ${TEST_GROUPS.join(', ')}`);
    if (QUIET) console.log('\n🔇 Quiet mode: compact single-line progress');
    if (FAIL_FAST) console.log('\n⚡ Fail-fast mode: will exit on first failure');

    console.log('\n⚡ Running Unit Tests and UI Tests in parallel...\n');

    const progressInterval = setInterval(updateProgressDisplay, VERBOSE ? 500 : 200);

    const [unitResults, uiResults] = await Promise.all([
        runUnitTests(browser),
        runUITests(browser)
    ]);

    clearInterval(progressInterval);
    if (!VERBOSE) process.stdout.write('\r' + ' '.repeat(100) + '\r');

    displayUnitResults(unitResults);
    displayUIResults(uiResults);

    await browser.close();

    const totalPassed = unitResults.passed + uiResults.passed;
    const totalFailed = unitResults.failed + uiResults.failed;

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 FINAL RESULTS: ${totalPassed} passed, ${totalFailed} failed\n`);

    saveResults({ unitResults, uiResults, totalPassed, totalFailed });

    process.exit(totalFailed > 0 ? 1 : 0);
}

async function runUnitTestsOnly() {
    outputLines = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    console.log('\n🧪 MALL HELL - UNIT TESTS\n');
    console.log('='.repeat(60));

    if (ONLY_TESTS.length > 0) console.log(`\n🎯 Running only: ${ONLY_TESTS.join(', ')}`);
    if (TEST_GROUPS.length > 0) console.log(`\n📂 Running groups: ${TEST_GROUPS.join(', ')}`);

    console.log('\n⚡ Running Unit Tests...\n');

    const progressInterval = setInterval(updateProgressDisplay, VERBOSE ? 500 : 200);
    const unitResults = await runUnitTests(browser);
    clearInterval(progressInterval);

    if (!VERBOSE) process.stdout.write('\r' + ' '.repeat(100) + '\r');

    displayUnitResults(unitResults);

    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 RESULTS: ${unitResults.passed} passed, ${unitResults.failed} failed\n`);

    saveResults({ unitResults, totalPassed: unitResults.passed, totalFailed: unitResults.failed });

    process.exit(unitResults.failed > 0 ? 1 : 0);
}

async function runUITestsOnly() {
    outputLines = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    console.log('\n🧪 MALL HELL - UI TESTS\n');
    console.log('='.repeat(60));

    if (ONLY_TESTS.length > 0) console.log(`\n🎯 Running only: ${ONLY_TESTS.join(', ')}`);
    if (TEST_GROUPS.length > 0) console.log(`\n📂 Running groups: ${TEST_GROUPS.join(', ')}`);

    console.log('\n⚡ Running UI Tests...\n');

    const progressInterval = setInterval(updateProgressDisplay, VERBOSE ? 500 : 200);
    const uiResults = await runUITests(browser);
    clearInterval(progressInterval);

    if (!VERBOSE) process.stdout.write('\r' + ' '.repeat(100) + '\r');

    displayUIResults(uiResults);

    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 RESULTS: ${uiResults.passed} passed, ${uiResults.failed} failed\n`);

    saveResults({ uiResults, totalPassed: uiResults.passed, totalFailed: uiResults.failed });

    process.exit(uiResults.failed > 0 ? 1 : 0);
}

async function runIntegrationTestsOnly() {
    outputLines = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    console.log('\n🧪 MALL HELL - INTEGRATION TESTS\n');
    console.log('='.repeat(60));

    if (ONLY_TESTS.length > 0) console.log(`\n🎯 Running only: ${ONLY_TESTS.join(', ')}`);
    if (TEST_GROUPS.length > 0) console.log(`\n📂 Running groups: ${TEST_GROUPS.join(', ')}`);

    console.log('\n⚡ Running Integration Tests...\n');

    const progressInterval = setInterval(updateProgressDisplay, VERBOSE ? 500 : 200);

    // Reuse runUITests logic but with integration-tests.html
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, 'tests/integration-tests.html');
    let passed = 0, failed = 0, pending = 0;
    let failedTests = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            logProgress(`  [Integration Browser Error] ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        logProgress(`  [Integration Page Error] ${error.message}`);
    });

    try {
        await page.setViewport({ width: 1400, height: 900 });
        await page.goto(`file://${filePath}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

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

        if (TEST_GROUPS.length > 0) {
            await page.evaluate((groups) => {
                if (window.runner && window.runner.tests) {
                    window.runner.tests = window.runner.tests.filter(t => {
                        const testGroup = (t.group || '').toLowerCase();
                        return groups.some(g =>
                            testGroup.includes(g) ||
                            t.id?.toLowerCase().startsWith(g) ||
                            t.name?.toLowerCase().includes(g)
                        );
                    });
                }
            }, TEST_GROUPS);
        }

        const totalTests = await page.evaluate(() => window.runner?.tests?.length || 0);
        progress.ui.total = totalTests;

        if (VERBOSE) {
            logProgress(`  [Integration] Found ${totalTests} tests registered`);
        }

        await page.evaluate(() => window.runner?.runAllTests?.());

        const maxWaitTime = 600000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            const results = await page.evaluate(() => {
                if (!window.runner) return null;
                const allDone = window.runner.tests.every(t => t.status === 'pass' || t.status === 'fail');
                return {
                    passed: window.runner.results.pass,
                    failed: window.runner.results.fail,
                    pending: window.runner.results.pending,
                    done: allDone,
                    currentTest: window.runner.currentTest?.name || '',
                    tests: window.runner.tests.map(t => ({
                        id: t.id,
                        name: t.name,
                        group: t.group,
                        status: t.status,
                        error: t.error
                    }))
                };
            });

            if (!results) break;

            passed = results.passed;
            failed = results.failed;
            pending = results.pending;
            progress.ui.passed = passed;
            progress.ui.failed = failed;
            progress.ui.current = results.currentTest;

            if (results.done) {
                progress.ui.done = true;
                break;
            }

            if (FAIL_FAST && failed > 0) {
                console.log('\n\n❌ FAIL-FAST: Stopping after first failure\n');
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const allTests = await page.evaluate(() => {
            if (!window.runner || !window.runner.tests) return [];
            return window.runner.tests.map(t => ({
                id: t.id,
                name: t.name,
                group: t.group,
                status: t.status,
                error: t.error,
                time: t.time
            }));
        });

        failedTests = allTests.filter(t => t.status === 'fail');

    } catch (e) {
        logProgress(`\n❌ Integration test runner error: ${e.message}`);
        failed++;
    }

    await page.close();
    clearInterval(progressInterval);

    if (!VERBOSE) process.stdout.write('\r' + ' '.repeat(100) + '\r');

    console.log('\n' + '='.repeat(60));
    console.log('\nIntegration Test Results:');
    console.log('-'.repeat(60));

    if (failedTests.length > 0) {
        console.log('\n❌ Failed Tests:\n');
        for (const test of failedTests) {
            console.log(`  [${test.group}] ${test.name}`);
            if (test.error) {
                console.log(`    Error: ${test.error.substring(0, 100)}...`);
            }
        }
    }

    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 RESULTS: ${passed} passed, ${failed} failed\n`);

    saveResults({
        integrationResults: { passed, failed, failedTests },
        totalPassed: passed,
        totalFailed: failed
    });

    process.exit(failed > 0 ? 1 : 0);
}

function saveResults(data) {
    const jsonResults = {
        timestamp: new Date().toISOString(),
        runId: RUN_TIMESTAMP,
        filters: {
            unitOnly: UNIT_ONLY,
            uiOnly: UI_ONLY,
            domains: UNIT_DOMAINS,
            groups: TEST_GROUPS,
            tests: ONLY_TESTS,
            rerunFailed: RUN_FAILED
        },
        summary: {
            totalPassed: data.totalPassed || 0,
            totalFailed: data.totalFailed || 0
        },
        unit: data.unitResults ? {
            passed: data.unitResults.passed,
            failed: data.unitResults.failed,
            failedTests: data.unitResults.failedTests
        } : null,
        ui: data.uiResults ? {
            passed: data.uiResults.passed,
            failed: data.uiResults.failed,
            pending: data.uiResults.pending,
            failedTests: data.uiResults.failedTests
        } : null
    };

    // Save timestamped results
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(jsonResults, null, 2));
    fs.writeFileSync(OUTPUT_FILE, outputLines.join('\n'));

    // Save as latest (overwrite)
    fs.writeFileSync(LATEST_JSON, JSON.stringify(jsonResults, null, 2));
    fs.writeFileSync(LATEST_TXT, outputLines.join('\n'));

    console.log(`\n📁 Results saved to:`);
    console.log(`   .test-output/run-${RUN_TIMESTAMP}.json`);
    console.log(`   .test-output/latest.json (for quick access)`);
}

// ============================================
// ENTRY POINT
// ============================================

// Group filter implies UI-only (groups are fine-grained UI test filtering)
const implicitUIOnly = TEST_GROUPS.length > 0;

if (SUITE === 'integration') {
    runIntegrationTestsOnly().catch(console.error);
} else if (UNIT_ONLY) {
    runUnitTestsOnly().catch(console.error);
} else if (UI_ONLY || implicitUIOnly) {
    runUITestsOnly().catch(console.error);
} else {
    // Domain filter runs both unit (filtered) and UI (filtered by domain file)
    runAllTests().catch(console.error);
}
