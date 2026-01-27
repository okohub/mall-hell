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

})(window.runner || runner);
