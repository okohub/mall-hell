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
        });

        test.it('should get power-up by id', () => {
            const config = PowerUp.get('speed_boost');
            test.assertTrue(config !== null, 'Returns config for valid ID');
            test.assertEqual(config.id, 'speed_boost', 'Returns correct config');

            const invalid = PowerUp.get('invalid_id');
            test.assertEqual(invalid, null, 'Returns null for invalid ID');
        });

        test.it('should get all power-ups as array', () => {
            const all = PowerUp.getAll();
            test.assertTrue(Array.isArray(all), 'Returns array');
            test.assertTrue(all.length > 0, 'Array has items');
            test.assertTrue(all[0].id !== undefined, 'Items have id field');
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, assertTrue: () => {}, assertEqual: () => {} });
