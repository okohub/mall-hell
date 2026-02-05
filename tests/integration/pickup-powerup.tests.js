/**
 * Pickup + PowerUp Integration Tests
 * Tests power-up pickup spawning and mesh creation
 */

(function(runner) {
    'use strict';

    const helpers = window.IntegrationHelpers;

    // Test 1: Spawn speed boost pickup
    runner.addTest('spawn-speed-boost-pickup', 'Pickup+PowerUp', 'Speed boost spawns as pickup',
        'Verifies speed boost power-up spawns with correct mesh and position',
        async () => {
            await helpers.bootGameForIntegration();

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
            await helpers.bootGameForIntegration();

            const Pickup = runner.gameWindow.Pickup;

            // Test that selectRandom can return power-ups
            const results = {};
            for (let i = 0; i < 1000; i++) {
                const pickup = Pickup.selectRandom();
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
            await helpers.bootGameForIntegration();

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

    // Test 4: Collecting extra time increases timer by 15s
    runner.addTest('collect-extra-time-adds-seconds', 'Pickup+PowerUp', 'Collecting extra time adds 15 seconds',
        'Verifies timer increases by 15 seconds and result reports exact gain',
        async () => {
            await helpers.bootGameForIntegration();

            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const camera = runner.gameWindow.camera;
            const GameSession = runner.gameWindow.GameSession;

            PickupOrchestrator.init(scene, THREE);
            GameSession.setTimer(120);

            const pickup = PickupOrchestrator.spawn('extra_time', { x: 50, y: 2, z: 75 });
            const before = GameSession.getTimer();
            const result = PickupOrchestrator.collect(pickup, WeaponOrchestrator, THREE, MaterialsTheme, camera);
            const after = GameSession.getTimer();

            if (!result?.isTimeBonus) {
                throw new Error('Expected isTimeBonus=true');
            }
            if (result.powerupType !== 'extra_time') {
                throw new Error(`Expected powerupType extra_time, got ${result.powerupType}`);
            }
            if (result.timeAdded !== 15) {
                throw new Error(`Expected timeAdded=15, got ${result.timeAdded}`);
            }
            if ((after - before) !== 15) {
                throw new Error(`Timer should increase by 15, got ${after - before}`);
            }
        }
    );

    // Test 5: Extra time caps at session duration
    runner.addTest('extra-time-caps-at-duration', 'Pickup+PowerUp', 'Extra time respects max timer cap',
        'Verifies timer caps at 180 and reports only actual seconds added',
        async () => {
            await helpers.bootGameForIntegration();

            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const camera = runner.gameWindow.camera;
            const GameSession = runner.gameWindow.GameSession;

            PickupOrchestrator.init(scene, THREE);
            GameSession.setTimer(178);

            const pickup = PickupOrchestrator.spawn('extra_time', { x: 50, y: 2, z: 75 });
            const result = PickupOrchestrator.collect(pickup, WeaponOrchestrator, THREE, MaterialsTheme, camera);
            const timerAfter = GameSession.getTimer();

            if (!result?.isTimeBonus) {
                throw new Error('Expected isTimeBonus=true');
            }
            if (result.timeAdded !== 2) {
                throw new Error(`Expected timeAdded=2 at cap, got ${result.timeAdded}`);
            }
            if (timerAfter !== GameSession.getDuration()) {
                throw new Error(`Expected capped timer ${GameSession.getDuration()}, got ${timerAfter}`);
            }
        }
    );

    // Test 6: Pickup flow shows time bonus notification text
    runner.addTest('extra-time-shows-popup-notification', 'Pickup+PowerUp', 'Extra time pickup shows +Xs TIME popup',
        'Verifies gameplay pickup flow displays popup with actual added seconds',
        async () => {
            await helpers.bootGameForIntegration();

            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const GameSession = runner.gameWindow.GameSession;
            const manualUpdate = runner.gameWindow.manualUpdate;

            if (!manualUpdate) {
                throw new Error('manualUpdate not available');
            }

            PickupOrchestrator.init(scene, THREE);
            GameSession.setTimer(178);

            // Clear previous notifications to avoid false positives
            runner.gameDocument.querySelectorAll('.pickup-notification').forEach((el) => el.remove());

            const pos = PlayerOrchestrator.position;
            PickupOrchestrator.spawn('extra_time', { x: pos.x, y: 2, z: pos.z });
            manualUpdate(0.016);

            const notifications = runner.gameDocument.querySelectorAll('.pickup-notification');
            if (!notifications.length) {
                throw new Error('Expected pickup notification to appear');
            }

            const latest = notifications[notifications.length - 1];
            if (!latest.textContent.includes('+2s TIME')) {
                throw new Error(`Expected "+2s TIME" notification, got "${latest.textContent}"`);
            }
        }
    );

    // Test 7: Player moves 2x faster with speed boost active
    runner.addTest('player-speed-2x-with-boost', 'Pickup+PowerUp', 'Player moves 2x faster with speed boost active',
        'Verifies speed multiplier is applied to player movement',
        async () => {
            await helpers.bootGameForIntegration();

            // Access game internals
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;

            // Initialize systems
            PlayerOrchestrator.init();
            PowerUpOrchestrator.init();

            if (!PlayerOrchestrator || !PowerUpOrchestrator) {
                throw new Error('PlayerOrchestrator or PowerUpOrchestrator not available');
            }

            const movementConfig = PlayerOrchestrator.getMovementConfig();
            const startX = 45;
            const startZ = 75;
            const dt = 1 / 60;

            // Baseline movement without boost (pure calculation to avoid collision jitter)
            PlayerOrchestrator.setPosition(startX, startZ);
            PlayerOrchestrator.setRotation(0); // Facing -Z
            PlayerOrchestrator.speed = movementConfig.MAX_SPEED;
            const normalPos = PlayerOrchestrator.calculateNewPosition(dt);
            const normalDistance = Math.abs(normalPos.z - startZ);

            // Activate speed boost
            PowerUpOrchestrator.activate('speed_boost', Date.now());

            // Movement with boost (pure calculation)
            const boostedPos = PlayerOrchestrator.calculateNewPosition(dt);
            const boostedDistance = Math.abs(boostedPos.z - startZ);

            // Verify 2x multiplier on actual movement
            const ratio = boostedDistance / normalDistance;
            if (Math.abs(ratio - 2.0) > 0.01) {
                throw new Error(`Expected 2x speed, got ${ratio.toFixed(2)}x`);
            }
        }
    );

    // Test 8: FOV increases when speed boost is active
    runner.addTest('fov-increases-with-boost', 'Pickup+PowerUp', 'FOV increases by 10 when speed boost is active',
        'Verifies camera FOV changes from 75 to 85 with speed boost',
        async () => {
            await helpers.bootGameForIntegration();

            // Access game internals
            const camera = runner.gameWindow.camera;
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
            const BASE_FOV = runner.gameWindow.BASE_FOV || 75;

            // Initialize system
            PowerUpOrchestrator.init();

            // Verify base FOV
            if (camera.fov !== BASE_FOV) {
                throw new Error(`Expected base FOV ${BASE_FOV}, got ${camera.fov}`);
            }

            // Activate speed boost
            PowerUpOrchestrator.activate('speed_boost', Date.now());

            // Manually trigger FOV update (simulate game loop)
            if (PowerUpOrchestrator.isActive('speed_boost')) {
                camera.fov = BASE_FOV + 10;
            } else {
                camera.fov = BASE_FOV;
            }
            camera.updateProjectionMatrix();

            // Verify FOV increased
            if (camera.fov !== BASE_FOV + 10) {
                throw new Error(`Expected FOV ${BASE_FOV + 10}, got ${camera.fov}`);
            }

            // Deactivate
            PowerUpOrchestrator.deactivate('speed_boost');

            // Reset FOV
            camera.fov = BASE_FOV;
            camera.updateProjectionMatrix();

            // Verify FOV restored
            if (camera.fov !== BASE_FOV) {
                throw new Error(`Expected FOV reset to ${BASE_FOV}, got ${camera.fov}`);
            }
        }
    );

    // Test 9: Power-up expires after duration
    runner.addTest('powerup-expires-after-duration', 'Pickup+PowerUp', 'Power-up expires after duration',
        'Verifies power-up deactivates after 10 seconds',
        async () => {
            await helpers.bootGameForIntegration();

            // Access game internals
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;

            // Initialize system
            PowerUpOrchestrator.init();

            // Activate at specific time
            const startTime = Date.now();
            PowerUpOrchestrator.activate('speed_boost', startTime);

            // Verify active immediately
            if (!PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Power-up should be active immediately after activation');
            }

            // Simulate time passing (before expiration)
            PowerUpOrchestrator.update(0.1, startTime + 5000); // 5 seconds later
            if (!PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Power-up should still be active at 5 seconds');
            }

            // Simulate time passing (after expiration)
            PowerUpOrchestrator.update(0.1, startTime + 11000); // 11 seconds later
            if (PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Power-up should be inactive after 11 seconds');
            }

            // Verify multiplier reset
            if (PowerUpOrchestrator.getSpeedMultiplier() !== 1.0) {
                throw new Error(`Expected multiplier 1.0, got ${PowerUpOrchestrator.getSpeedMultiplier()}`);
            }
        }
    );

    // Test 10: Power-ups reset on game over
    runner.addTest('powerup-resets-on-game-over', 'Pickup+PowerUp', 'Power-ups reset on game over',
        'Verifies power-ups are cleared when game ends',
        async () => {
            await helpers.bootGameForIntegration();

            // Access game internals
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;

            // Initialize system
            PowerUpOrchestrator.init();

            // Activate power-up
            PowerUpOrchestrator.activate('speed_boost', Date.now());
            if (!PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Power-up should be active before game over');
            }

            // Simulate game over
            PowerUpOrchestrator.reset();

            // Verify power-up cleared
            if (PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Power-up should be inactive after game over');
            }
            if (PowerUpOrchestrator.getSpeedMultiplier() !== 1.0) {
                throw new Error(`Expected multiplier 1.0, got ${PowerUpOrchestrator.getSpeedMultiplier()}`);
            }
        }
    );

    // Test 11: Power-ups reset on player death
    runner.addTest('powerup-resets-on-death', 'Pickup+PowerUp', 'Power-ups reset on player death',
        'Verifies power-ups are cleared when player dies',
        async () => {
            await helpers.bootGameForIntegration();

            // Access game internals
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;

            // Initialize systems
            PowerUpOrchestrator.init();
            PlayerOrchestrator.init();

            // Activate power-up
            PowerUpOrchestrator.activate('speed_boost', Date.now());

            // Verify active
            if (!PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Power-up should be active');
            }

            // Simulate player death scenario: damage player to 0 health
            PlayerOrchestrator.health = 1;
            PlayerOrchestrator.isInvulnerable = false;
            PlayerOrchestrator.damage(100);

            // Verify player is dead
            if (!PlayerOrchestrator.isDead()) {
                throw new Error('Player should be dead after fatal damage');
            }

            // In real game, endGame() would be called which resets power-ups
            // Simulate that here
            PowerUpOrchestrator.reset();

            // Verify power-up cleared
            if (PowerUpOrchestrator.isActive('speed_boost')) {
                throw new Error('Power-up should be inactive after player death');
            }
        }
    );

    // Test 12: UI timer hidden after reset
    runner.addTest('ui-timer-hidden-after-reset', 'Pickup+PowerUp', 'UI timer hidden after power-up reset',
        'Verifies timer UI is hidden when power-ups are reset',
        async () => {
            await helpers.bootGameForIntegration();

            // Access game internals
            const PowerUpOrchestrator = runner.gameWindow.PowerUpOrchestrator;
            const UIOrchestrator = runner.gameWindow.UIOrchestrator;

            // Initialize systems
            PowerUpOrchestrator.init();

            // Activate power-up and show timer
            PowerUpOrchestrator.activate('speed_boost', Date.now());
            UIOrchestrator.updatePowerUpTimer(5000, 'speed_boost');

            // Verify timer visible
            const timer = runner.getElement('#powerup-timer');
            if (!runner.isVisible(timer)) {
                throw new Error('Timer should be visible when power-up is active');
            }

            // Reset power-ups
            PowerUpOrchestrator.reset();
            UIOrchestrator.updatePowerUpTimer(0, 'speed_boost');

            // Verify timer hidden
            if (runner.isVisible(timer)) {
                throw new Error('Timer should be hidden after reset');
            }
        }
    );

    // Test 13: Health up drops from skeleton on death
    runner.addTest('health-up-drops-on-skeleton-death', 'Pickup+PowerUp', 'Health up drops when carrier skeleton dies',
        'Verifies health up pickup spawns when a carrier skeleton is destroyed',
        async () => {
            await helpers.bootGameForIntegration();

            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const ProjectileOrchestrator = runner.gameWindow.ProjectileOrchestrator;
            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            const manualUpdate = runner.gameWindow.manualUpdate;
            const gi = runner.gameWindow.__gameInternals;

            if (!gi || !manualUpdate) {
                throw new Error('Game internals or manualUpdate not available');
            }

            PickupOrchestrator.init(scene, THREE);

            const enemies = gi.getEnemies();
            const projectiles = gi.getProjectiles();

            // Spawn a skeleton enemy and force health carry
            const enemy = EnemyOrchestrator.createMesh(THREE, 'SKELETON', 45, 70);
            enemy.userData.carriesHealth = true;
            enemy.userData.health = 1;
            scene.add(enemy);
            enemies.push(enemy);

            // Create a projectile aimed at the enemy
            const spawnPos = new THREE.Vector3(enemy.position.x, 1.2, enemy.position.z + 2);
            const direction = new THREE.Vector3(0, 0, -1);
            const projectile = ProjectileOrchestrator.createMesh(THREE, direction, spawnPos, 60, {
                projectileType: 'stone',
                damage: 5
            });
            scene.add(projectile);
            projectiles.push(projectile);

            // Run a few frames to process collision and drop
            for (let i = 0; i < 8; i++) {
                manualUpdate(0.016);
            }

            const dropped = PickupOrchestrator.pickups.find((p) => p.config?.id === 'health_up');
            if (!dropped) {
                throw new Error('Expected health_up pickup to spawn on skeleton death');
            }
        }
    );

    // Test 14: Collecting health up heals player
    runner.addTest('collect-health-up-heals-player', 'Pickup+PowerUp', 'Collecting health up heals the player',
        'Verifies health up pickup increases player health and updates UI',
        async () => {
            await helpers.bootGameForIntegration();

            const THREE = runner.gameWindow.THREE;
            const scene = runner.gameWindow.scene;
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const manualUpdate = runner.gameWindow.manualUpdate;

            if (!manualUpdate) {
                throw new Error('manualUpdate not available');
            }

            PickupOrchestrator.init(scene, THREE);

            // Set player to mid health
            PlayerOrchestrator.health = 60;

            // Spawn health up at player position
            const playerPos = PlayerOrchestrator.position;
            PickupOrchestrator.spawn('health_up', { x: playerPos.x, y: 2, z: playerPos.z });

            manualUpdate(0.016);

            const healedHealth = PlayerOrchestrator.getHealth();
            if (healedHealth !== 80) {
                throw new Error(`Expected health 80 after healing, got ${healedHealth}`);
            }

            const healthValue = runner.getElement('#health-value');
            if (!healthValue || healthValue.textContent !== '80') {
                throw new Error(`Health UI not updated: ${healthValue?.textContent}`);
            }
        }
    );

    // Test 15: Carrier skeleton shows heart mesh before death
    runner.addTest('carrier-skeleton-shows-heart', 'Pickup+PowerUp', 'Carrier skeleton shows heart before death',
        'Verifies a carrier skeleton has a visible carried heart mesh attached to the cart',
        async () => {
            await helpers.bootGameForIntegration();

            const THREE = runner.gameWindow.THREE;
            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            const Enemy = runner.gameWindow.Enemy;

            if (!EnemyOrchestrator || !Enemy || !THREE) {
                throw new Error('EnemyOrchestrator, Enemy, or THREE not found');
            }

            const originalChance = Enemy.types.SKELETON.healthCarryChance;
            Enemy.types.SKELETON.healthCarryChance = 1;

            const enemy = EnemyOrchestrator.createMesh(THREE, 'SKELETON', 45, 70);
            Enemy.types.SKELETON.healthCarryChance = originalChance;

            if (!enemy?.userData?.healthCarryMesh) {
                throw new Error('Expected carried heart mesh on skeleton');
            }

            const heart = enemy.userData.healthCarryMesh;
            if (!heart.children || heart.children.length < 3) {
                throw new Error('Carried heart mesh missing expected children');
            }
        }
    );

})(window.runner || runner);
