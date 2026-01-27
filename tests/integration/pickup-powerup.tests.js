/**
 * Pickup + PowerUp Integration Tests
 * Tests power-up pickup spawning and mesh creation
 */

(function(runner) {
    'use strict';

    // Test 1: Spawn speed boost pickup
    runner.addTest('spawn-speed-boost-pickup', 'Pickup+PowerUp', 'Speed boost spawns as pickup',
        'Verifies speed boost power-up spawns with correct mesh and position',
        async () => {
            // Access game internals
            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;

            // Initialize pickup system
            PickupOrchestrator.init(scene, THREE);

            // Spawn speed boost pickup
            const pickup = PickupOrchestrator.spawn('speed_boost', { x: 50, y: 2, z: 75 });

            // Verify pickup created
            if (pickup === null) {
                throw new Error('Pickup spawn returned null');
            }
            if (pickup.config.id !== 'speed_boost') {
                throw new Error(`Wrong pickup type: ${pickup.config.id}`);
            }

            // Verify mesh created
            if (PickupOrchestrator.meshes.length !== 1) {
                throw new Error(`Expected 1 mesh, got ${PickupOrchestrator.meshes.length}`);
            }

            const mesh = PickupOrchestrator.meshes[0];
            if (!mesh) {
                throw new Error('Mesh is undefined');
            }
            if (mesh.position.x !== 50) {
                throw new Error(`Wrong position: ${mesh.position.x} (expected 50)`);
            }
        }
    );

    // Test 2: Power-ups compete with weapons in weighted spawn
    runner.addTest('powerup-in-weighted-selection', 'Pickup+PowerUp', 'Power-ups compete with weapons in weighted spawn',
        'Test that selectRandom can return power-ups',
        async () => {
            const WeaponPickup = runner.gameWindow.WeaponPickup;

            // Test that selectRandom can return power-ups
            const results = {};
            for (let i = 0; i < 1000; i++) {
                const pickup = WeaponPickup.selectRandom();
                results[pickup.id] = (results[pickup.id] || 0) + 1;
            }

            if (!results.speed_boost || results.speed_boost === 0) {
                throw new Error('Speed boost did not spawn in 1000 trials');
            }
            if (results.speed_boost <= 50) {
                throw new Error(`Speed boost spawn rate too low: ${results.speed_boost} (<5%)`);
            }
            if (results.speed_boost >= 400) {
                throw new Error(`Speed boost spawn rate too high: ${results.speed_boost} (>40%)`);
            }
        }
    );

    // Test 3: Collecting speed boost activates effect
    runner.addTest('collect-speed-boost-activates-effect', 'Pickup+PowerUp', 'Collecting speed boost activates PowerUpOrchestrator effect',
        'Collecting speed boost activates PowerUpOrchestrator effect',
        async () => {
            // Access game internals
            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const camera = runner.gameWindow.camera;

            // Initialize systems
            PickupOrchestrator.init(scene, THREE);
            PowerUpOrchestrator.init();

            // Spawn speed boost pickup
            const pickup = PickupOrchestrator.spawn('speed_boost', { x: 50, y: 2, z: 75 });

            // Collect the pickup
            const result = PickupOrchestrator.collect(pickup, WeaponOrchestrator, THREE, MaterialsTheme, camera);

            // Verify result indicates power-up
            if (result.isPowerup !== true) {
                throw new Error('Result should indicate power-up');
            }
            if (result.powerupType !== 'speed_boost') {
                throw new Error(`Wrong power-up type: ${result.powerupType}`);
            }

            // Verify power-up is now active
            if (!PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Speed boost should be active');
            }
            if (PowerUpOrchestrator.getSpeedMultiplier() !== 2.0) {
                throw new Error(`Wrong speed multiplier: ${PowerUpOrchestrator.getSpeedMultiplier()}`);
            }
        }
    );

    // Test 4: Player moves 2x faster with speed boost active
    runner.addTest('player-speed-2x-with-boost', 'Pickup+PowerUp', 'Player moves 2x faster with speed boost active',
        'Verifies speed multiplier is applied to player movement',
        async () => {
            // Access game internals
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;

            // Initialize systems
            PlayerOrchestrator.init();
            PowerUpOrchestrator.init();

            // Set player position and speed
            PlayerOrchestrator.setPosition(50, 75);
            PlayerOrchestrator.speed = 8;
            PlayerOrchestrator.rotation = 0; // Facing -Z

            // Calculate position without boost
            const normalPos = PlayerOrchestrator.calculateNewPosition(1.0);
            const normalDistance = Math.sqrt(
                Math.pow(normalPos.x - 50, 2) + Math.pow(normalPos.z - 75, 2)
            );

            // Activate speed boost
            PowerUpOrchestrator.activate('speed_boost', Date.now());

            // Calculate position with boost
            PlayerOrchestrator.setPosition(50, 75);
            const boostedPos = PlayerOrchestrator.calculateNewPosition(1.0);
            const boostedDistance = Math.sqrt(
                Math.pow(boostedPos.x - 50, 2) + Math.pow(boostedPos.z - 75, 2)
            );

            // Verify 2x multiplier
            const ratio = boostedDistance / normalDistance;
            if (Math.abs(ratio - 2.0) > 0.01) {
                throw new Error(`Expected 2x speed, got ${ratio.toFixed(2)}x`);
            }
        }
    );

})(window.runner || runner);
