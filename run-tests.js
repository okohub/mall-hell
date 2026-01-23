const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    console.log('\n🧪 MALL HELL TEST RUNNER\n');
    console.log('='.repeat(60));
    console.log('\n⚡ Running Unit Tests and UI Tests in parallel...\n');

    // Run both test suites in parallel
    const [unitResults, uiResults] = await Promise.all([
        runUnitTests(browser),
        runUITests(browser)
    ]);

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

    await browser.close();

    const totalPassed = unitResults.passed + uiResults.passed;
    const totalFailed = unitResults.failed + uiResults.failed;

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 FINAL RESULTS: ${totalPassed} passed, ${totalFailed} failed\n`);

    if (totalFailed > 0) {
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

        // Wait for tests to run
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get results from the page
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

    } catch (error) {
        console.log(`  ⚠️  Unit Tests Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed, failedTests };
}

async function runUITests(browser) {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, 'tests/ui-tests.html');
    let passed = 0, failed = 0, pending = 0;
    let failedTests = [];

    try {
        // Set viewport
        await page.setViewport({ width: 1400, height: 900 });

        await page.goto(`file://${filePath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Wait for page and game iframe to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Click run all button
        await page.evaluate(() => {
            const runBtn = document.querySelector('#run-all-btn');
            if (runBtn) runBtn.click();
        });

        // Wait a moment for tests to start
        await new Promise(resolve => setTimeout(resolve, 500));

        // Monitor test progress
        let stableCount = 0;
        let attempts = 0;
        let lastCompleted = 0;

        while (attempts < 120) { // Max 2 minutes
            const status = await page.evaluate(() => {
                const runner = window.runner;
                if (!runner) return { isRunning: false, completed: 0, total: 0 };

                const passed = runner.tests.filter(t => t.status === 'pass').length;
                const failed = runner.tests.filter(t => t.status === 'fail').length;
                const total = runner.tests.length;

                return {
                    isRunning: runner.isRunning,
                    completed: passed + failed,
                    total
                };
            });

            // Exit if not running and all tests are done
            if (!status.isRunning && status.completed === status.total && status.total > 0) {
                break;
            }

            // Track stability
            if (status.completed === lastCompleted) {
                stableCount++;
            } else {
                stableCount = 0;
                lastCompleted = status.completed;
            }

            // Exit if stable for too long (tests probably done)
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

    } catch (error) {
        console.log(`  ⚠️  UI Tests Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed, pending, failedTests };
}

runTests().catch(console.error);
