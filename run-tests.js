const puppeteer = require('puppeteer');
const path = require('path');

async function runTests() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    console.log('\n🧪 MALL HELL TEST RUNNER\n');
    console.log('='.repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;

    // Run Unit Tests
    console.log('\n📋 UNIT TESTS\n');
    const unitResults = await runUnitTests(browser);
    totalPassed += unitResults.passed;
    totalFailed += unitResults.failed;

    // Run UI Tests
    console.log('\n📋 UI TESTS\n');
    const uiResults = await runUITests(browser);
    totalPassed += uiResults.passed;
    totalFailed += uiResults.failed;

    await browser.close();

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

        // Display only failed tests
        const failedTests = results.tests.filter(t => t.status === 'FAIL');
        if (failedTests.length > 0) {
            console.log('  Failed tests:');
            failedTests.forEach(t => {
                console.log(`  ❌ [${t.module}] ${t.name}`);
                if (t.error) console.log(`     Error: ${t.error}`);
            });
            console.log('');
        }

        passed = results.passed;
        failed = results.failed;
        console.log(`  📊 Results: ${passed} passed, ${failed} failed`);

    } catch (error) {
        console.log(`  ⚠️  Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed };
}

async function runUITests(browser) {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, 'tests/ui-tests.html');
    let passed = 0, failed = 0;

    try {
        // Set viewport
        await page.setViewport({ width: 1400, height: 900 });

        await page.goto(`file://${filePath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Wait for page and game iframe to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get total test count
        const totalTests = await page.evaluate(() => {
            return window.runner?.tests?.length || 0;
        });
        console.log(`  Total tests: ${totalTests}`);

        // Click run all button
        await page.evaluate(() => {
            const runBtn = document.querySelector('#run-all-btn');
            if (runBtn) runBtn.click();
        });

        // Wait a moment for tests to start
        await new Promise(resolve => setTimeout(resolve, 500));

        // Monitor test progress
        let lastProgress = '';
        let stableCount = 0;
        let attempts = 0;

        while (attempts < 120) { // Max 2 minutes
            const status = await page.evaluate(() => {
                const runner = window.runner;
                if (!runner) return { isRunning: false, current: '', passed: 0, failed: 0, completed: 0, total: 0 };

                const passed = runner.tests.filter(t => t.status === 'pass').length;
                const failed = runner.tests.filter(t => t.status === 'fail').length;
                const total = runner.tests.length;
                const currentTest = runner.currentTest;

                return {
                    isRunning: runner.isRunning,
                    current: currentTest ? currentTest.name : '',
                    passed,
                    failed,
                    completed: passed + failed,
                    total
                };
            });

            const progressStr = `${status.completed}/${status.total}`;

            // Print progress when it changes
            if (progressStr !== lastProgress) {
                const currentInfo = status.current ? ` - ${status.current}` : '';
                process.stdout.write(`\r  Progress: ${progressStr} (${status.passed}✓ ${status.failed}✗)${currentInfo}`.padEnd(80));
                lastProgress = progressStr;
                stableCount = 0;
            } else {
                stableCount++;
            }

            // Exit if not running and all tests are done
            if (!status.isRunning && status.completed === status.total && status.total > 0) {
                break;
            }

            // Exit if stable for too long (tests probably done)
            if (stableCount > 10 && status.completed > 0) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        // Clear progress line
        process.stdout.write('\r' + ' '.repeat(100) + '\r');

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

        // Display failed tests
        const failedTests = results.tests.filter(t => t.status === 'FAIL');
        if (failedTests.length > 0) {
            console.log('  Failed tests:');
            failedTests.forEach(t => {
                console.log(`  ❌ [${t.group}] ${t.name}`);
                if (t.error) console.log(`     Error: ${t.error}`);
            });
            console.log('');
        }

        passed = results.passed;
        failed = results.failed;
        const pending = results.tests.filter(t => t.status === 'PENDING').length;

        console.log(`  📊 Results: ${passed} passed, ${failed} failed, ${pending} pending`);

    } catch (error) {
        console.log(`  ⚠️  Error: ${error.message}`);
    }

    await page.close();
    return { passed, failed };
}

runTests().catch(console.error);
