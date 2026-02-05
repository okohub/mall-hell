// ============================================
// POWERUP DOMAIN - Unit Tests
// ============================================

(function(test) {
    'use strict';

    // ==========================================
    // POWERUP DATA TESTS
    // ==========================================

    test.describe('PowerUp Data', () => {
        test.it('should have SPEED_BOOST type with required fields', () => {
            const config = PowerUp.types.SPEED_BOOST;
            test.assertTrue(config !== undefined, 'SPEED_BOOST config exists');
            test.assertEqual(config.id, 'speed_boost', 'Has id field');
            test.assertEqual(config.name, 'Speed Boost', 'Has name field');
            test.assertTrue(config.isPowerup === true, 'Has isPowerup field');
            test.assertEqual(config.duration, 10000, 'Duration is 10000ms');
            test.assertEqual(config.speedMultiplier, 2.0, 'Speed multiplier is 2.0');
            test.assertEqual(config.spawnChance, 0.25, 'Spawn chance is 25%');
            test.assertEqual(config.spawnWeight, 2, 'Spawn weight is 2');
            test.assertTrue(config.visual !== undefined, 'Has visual config');
            test.assertTrue(config.visual.color !== undefined, 'Has color');
            test.assertTrue(config.visual.glowColor !== undefined, 'Has glow color');
            test.assertTrue(config.visual.scale !== undefined, 'Has scale');
            test.assertTrue(typeof config.createPickupMesh === 'function', 'Has createPickupMesh hook');
        });

        test.it('should get power-up by id', () => {
            const config = PowerUp.get('speed_boost');
            test.assertTrue(config !== null, 'Returns config for valid ID');
            test.assertEqual(config.id, 'speed_boost', 'Returns correct config');

            const invalid = PowerUp.get('invalid_id');
            test.assertEqual(invalid, null, 'Returns null for invalid ID');
        });

        test.it('should expose health heart as drop-only power-up', () => {
            const config = PowerUp.get('health_heart');
            test.assertTrue(config !== null, 'Health heart config exists');
            test.assertTrue(config.isHealth === true, 'Health heart isHealth flag');
            test.assertEqual(config.healAmount, 20, 'Heal amount is 20');
            test.assertTrue(config.dropOnly === true, 'Health heart is drop-only');
            test.assertTrue(typeof config.createPickupMesh === 'function', 'Has createPickupMesh hook');
        });

        test.it('should get all power-ups as array', () => {
            const all = PowerUp.getAll();
            test.assertTrue(Array.isArray(all), 'Returns array');
            test.assertTrue(all.length > 0, 'Array has items');
            test.assertTrue(all[0].id !== undefined, 'Items have id field');
        });
    });

    // ==========================================
    // POWERUP ORCHESTRATOR TESTS
    // ==========================================

    test.describe('PowerUpOrchestrator', () => {
        test.it('should initialize with empty activeEffects', () => {
            PowerUpOrchestrator.init();
            test.assertTrue(Array.isArray(PowerUpOrchestrator.activeEffects), 'activeEffects is array');
            test.assertEqual(PowerUpOrchestrator.activeEffects.length, 0, 'Starts empty');
        });

        test.it('should activate speed boost effect', () => {
            PowerUpOrchestrator.init();
            const startTime = Date.now();

            PowerUpOrchestrator.activate('speed_boost', startTime);

            test.assertTrue(PowerUpOrchestrator.isActive('speed_boost'), 'Boost is active');
            test.assertEqual(PowerUpOrchestrator.getSpeedMultiplier(), 2.0, 'Speed multiplier is 2.0');

            const remaining = PowerUpOrchestrator.getTimeRemaining('speed_boost', startTime);
            test.assertTrue(remaining > 9000 && remaining <= 10000, 'Time remaining is ~10s');
        });

        test.it('should refresh timer when activating while already active', () => {
            PowerUpOrchestrator.init();
            const startTime = Date.now();

            // Activate first boost
            PowerUpOrchestrator.activate('speed_boost', startTime);

            // Wait 2 seconds and activate again
            const laterTime = startTime + 2000;
            PowerUpOrchestrator.activate('speed_boost', laterTime);

            // Should have reset to 10s, not stacked to 18s
            const remaining = PowerUpOrchestrator.getTimeRemaining('speed_boost', laterTime);
            test.assertTrue(remaining > 9000 && remaining <= 10000, 'Timer refreshed to 10s');
            test.assertEqual(PowerUpOrchestrator.activeEffects.length, 1, 'Only one effect active');
        });

        test.it('should return 1.0 multiplier when inactive', () => {
            PowerUpOrchestrator.init();
            test.assertEqual(PowerUpOrchestrator.getSpeedMultiplier(), 1.0, 'Returns 1.0 when no boost');
        });

        test.it('should expire boost after duration', () => {
            PowerUpOrchestrator.init();
            const startTime = Date.now();

            PowerUpOrchestrator.activate('speed_boost', startTime);
            test.assertTrue(PowerUpOrchestrator.isActive('speed_boost'), 'Boost starts active');

            // Simulate 11 seconds passing
            const afterExpiry = startTime + 11000;
            PowerUpOrchestrator.update(0.016, afterExpiry);

            test.assertTrue(!PowerUpOrchestrator.isActive('speed_boost'), 'Boost expired');
            test.assertEqual(PowerUpOrchestrator.getSpeedMultiplier(), 1.0, 'Speed back to normal');
        });

        test.it('should handle activation of unknown power-up type gracefully', () => {
            PowerUpOrchestrator.init();
            PowerUpOrchestrator.activate('unknown_type', Date.now());
            test.assertEqual(PowerUpOrchestrator.activeEffects.length, 0, 'No effect added');
        });

        test.it('should manually deactivate an active boost', () => {
            PowerUpOrchestrator.init();
            PowerUpOrchestrator.activate('speed_boost', Date.now());
            test.assertTrue(PowerUpOrchestrator.isActive('speed_boost'), 'Boost is active');

            PowerUpOrchestrator.deactivate('speed_boost');
            test.assertTrue(!PowerUpOrchestrator.isActive('speed_boost'), 'Boost deactivated');
            test.assertEqual(PowerUpOrchestrator.getSpeedMultiplier(), 1.0, 'Speed normal');
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, assertTrue: () => {}, assertEqual: () => {} });
