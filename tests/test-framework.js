/**
 * Mall Hell - Test Framework
 * A minimal test framework for browser-based unit testing
 */

class TestFramework {
    constructor() {
        this.modules = [];
        this.currentModule = null;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0
        };
    }

    describe(moduleName, testFn) {
        this.currentModule = {
            name: moduleName,
            tests: [],
            beforeEach: null,
            afterEach: null
        };
        testFn();
        this.modules.push(this.currentModule);
    }

    beforeEach(fn) {
        if (this.currentModule) {
            this.currentModule.beforeEach = fn;
        }
    }

    afterEach(fn) {
        if (this.currentModule) {
            this.currentModule.afterEach = fn;
        }
    }

    it(testName, testFn) {
        if (this.currentModule) {
            this.currentModule.tests.push({
                name: testName,
                fn: testFn,
                passed: null,
                error: null
            });
        }
    }

    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected ${expected}, got ${actual}`);
        }
    }

    assertNotEqual(actual, expected, message = '') {
        if (actual === expected) {
            throw new Error(`${message} Expected values to be different, both are ${actual}`);
        }
    }

    assertCloseTo(actual, expected, tolerance = 0.0001, message = '') {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${message} Expected ${expected} (+-${tolerance}), got ${actual}`);
        }
    }

    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`${message} Expected true, got ${value}`);
        }
    }

    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`${message} Expected false, got ${value}`);
        }
    }

    assertGreaterThan(actual, expected, message = '') {
        if (!(actual > expected)) {
            throw new Error(`${message} Expected ${actual} to be greater than ${expected}`);
        }
    }

    assertLessThan(actual, expected, message = '') {
        if (!(actual < expected)) {
            throw new Error(`${message} Expected ${actual} to be less than ${expected}`);
        }
    }

    assertInRange(value, min, max, message = '') {
        if (value < min || value > max) {
            throw new Error(`${message} Expected ${value} to be between ${min} and ${max}`);
        }
    }

    assertThrows(fn, message = '') {
        let threw = false;
        try {
            fn();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw new Error(`${message} Expected function to throw an error`);
        }
    }

    assertArrayEqual(actual, expected, message = '') {
        if (actual.length !== expected.length) {
            throw new Error(`${message} Array lengths differ: ${actual.length} vs ${expected.length}`);
        }
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                throw new Error(`${message} Arrays differ at index ${i}: ${actual[i]} vs ${expected[i]}`);
            }
        }
    }

    assertDefined(value, message = '') {
        if (value === undefined || value === null) {
            throw new Error(`${message} Expected value to be defined, got ${value}`);
        }
    }

    assertUndefined(value, message = '') {
        if (value !== undefined) {
            throw new Error(`${message} Expected undefined, got ${value}`);
        }
    }

    assertTypeOf(value, expectedType, message = '') {
        const actualType = typeof value;
        if (actualType !== expectedType) {
            throw new Error(`${message} Expected type ${expectedType}, got ${actualType}`);
        }
    }

    assertInstanceOf(value, expectedClass, message = '') {
        if (!(value instanceof expectedClass)) {
            throw new Error(`${message} Expected instance of ${expectedClass.name}`);
        }
    }

    skip(reason = 'Skipped') {
        const err = new Error(reason);
        err.isSkip = true;
        throw err;
    }

    run() {
        this.results = { total: 0, passed: 0, failed: 0, skipped: 0 };

        for (const module of this.modules) {
            for (const test of module.tests) {
                this.results.total++;

                try {
                    if (module.beforeEach) {
                        module.beforeEach();
                    }

                    test.fn();

                    if (module.afterEach) {
                        module.afterEach();
                    }

                    test.passed = true;
                    this.results.passed++;
                } catch (e) {
                    if (e.isSkip) {
                        test.passed = true;
                        test.skipped = true;
                        test.error = e.message;
                        this.results.skipped++;
                        this.results.passed++;
                    } else {
                        test.passed = false;
                        test.error = e.message;
                        this.results.failed++;
                    }
                }
            }
        }

        return this.results;
    }

    getModules() {
        return this.modules;
    }

    reset() {
        this.modules = [];
        this.currentModule = null;
        this.results = { total: 0, passed: 0, failed: 0 };
    }
}

// Create global instance
const test = new TestFramework();
window.TestFramework = test;
