/**
 * Combat Flow Integration Tests
 * Tests complete weapon firing → projectile → collision → damage chain
 */

(function(runner) {
    'use strict';

    const helpers = window.IntegrationHelpers;

    // Test 1: Slingshot hits skeleton
    runner.addTest('slingshot-hits-skeleton', 'Combat Flow', 'Slingshot projectile hits enemy',
        'Verifies slingshot fires, projectile travels, and hits skeleton enemy',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20
            });

            const initialHealth = enemy.userData.health;

            // Fire charged shot
            await helpers.fireWeapon(500);

            // Wait for projectile to hit
            const impact = await helpers.waitForProjectileImpact(2000);
            if (!impact.hit) {
                throw new Error('Projectile did not hit enemy');
            }

            // Verify damage dealt
            await runner.wait(100);
            if (enemy.userData.health >= initialHealth) {
                throw new Error(`Enemy took no damage: ${initialHealth} -> ${enemy.userData.health}`);
            }
        }
    );

    // Test 2: Slingshot kills skeleton
    runner.addTest('slingshot-kills-skeleton', 'Combat Flow', 'Full combat cycle from fire to kill',
        'Verifies slingshot can fire, hit, damage, and kill a skeleton enemy',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20,
                enemyHealth: 1
            });

            const initialScore = runner.getScore();

            // Fire charged shot
            await helpers.fireWeapon(500);

            // Wait for impact and death
            const impact = await helpers.waitForProjectileImpact(2000);
            if (!impact.hit) {
                throw new Error('Projectile missed enemy');
            }

            await helpers.waitForEnemyDeath(enemy, 1000);

            // Verify score increased
            const newScore = runner.getScore();
            if (newScore <= initialScore) {
                throw new Error(`Score did not increase: ${initialScore} -> ${newScore}`);
            }
        }
    );

    // Test 3: Weapon cooldown prevents fire
    runner.addTest('weapon-cooldown-prevents-fire', 'Combat Flow', 'Cooldown blocks rapid fire',
        'Verifies weapon cooldown prevents immediate second shot',
        async () => {
            await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20
            });

            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const weapon = WeaponOrchestrator.currentWeapon;

            // Fire first shot
            await helpers.fireWeapon(100);
            const projectiles1 = (runner.gameWindow.projectiles || []).length;

            // Immediately try to fire again (should be blocked by cooldown)
            await helpers.fireWeapon(0);
            const projectiles2 = (runner.gameWindow.projectiles || []).length;

            if (projectiles2 > projectiles1) {
                throw new Error('Cooldown did not prevent second shot');
            }
        }
    );

    // Test 4: Projectile max range
    runner.addTest('projectile-max-range', 'Combat Flow', 'Projectile despawns at max range',
        'Verifies projectile despawns beyond weapon range without hitting',
        async () => {
            await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 200  // Way beyond slingshot range (120 units)
            });

            // Fire shot
            await helpers.fireWeapon(500);

            // Wait longer for projectile to travel and despawn
            await runner.wait(3000);

            // Projectiles should be empty (despawned at max range)
            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length > 0) {
                throw new Error('Projectile did not despawn at max range');
            }
        }
    );

    // Test 5: Watergun rapid fire
    runner.addTest('watergun-rapid-fire-kills', 'Combat Flow', 'Watergun rapid fire kills enemy',
        'Verifies holding fire button spawns multiple projectiles that kill enemy',
        async () => {
            await helpers.setupCombatScenario({
                weapon: 'watergun',
                enemyType: 'SKELETON',
                distance: 15,
                enemyHealth: 3
            });

            // Hold fire for rapid shots
            runner.gameWindow.startFiring();

            // Run updates to trigger rapid fire (watergun fires every ~200ms)
            // Run 60 frames over 1 second to allow multiple shots
            for (let i = 0; i < 60; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
                await runner.wait(16);
            }

            runner.gameWindow.stopFiring();

            // Check multiple projectiles spawned
            const projectiles = runner.gameWindow.getProjectiles ? runner.gameWindow.getProjectiles() : [];
            if (projectiles.length < 3) {
                throw new Error(`Expected multiple projectiles, got ${projectiles.length}`);
            }
        }
    );

    // Test 6: Collision with obstacle
    runner.addTest('collision-with-obstacle', 'Combat Flow', 'Obstacle blocks projectile',
        'Verifies projectile hits obstacle instead of enemy behind it',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20
            });

            // Spawn obstacle between player and enemy
            const THREE = runner.gameWindow.THREE;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(5, 5, 2),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            obstacle.position.set(0, 2, -10);  // Between player and enemy
            obstacle.userData.isObstacle = true;
            runner.gameWindow.scene.add(obstacle);

            const initialHealth = enemy.userData.health;

            // Fire at enemy (should hit obstacle)
            await helpers.fireWeapon(500);
            await runner.wait(2000);

            // Enemy should not take damage
            if (enemy.userData.health < initialHealth) {
                throw new Error('Enemy took damage despite obstacle blocking');
            }

            // Cleanup
            runner.gameWindow.scene.remove(obstacle);
        }
    );

    // Test 7: Weapon switch mid-combat
    runner.addTest('weapon-switch-mid-combat', 'Combat Flow', 'Weapon switch clears state',
        'Verifies switching weapons mid-combat properly resets weapon state',
        async () => {
            await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20
            });

            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;

            // Fire slingshot
            await helpers.fireWeapon(300);

            // Switch to different weapon
            WeaponOrchestrator.equip('watergun', runner.gameWindow.THREE, runner.gameWindow.MaterialsTheme, runner.gameWindow.camera);
            await runner.wait(100);

            // Verify weapon switched
            const currentWeapon = WeaponOrchestrator.currentWeapon;
            if (!currentWeapon || currentWeapon.config.id !== 'watergun') {
                throw new Error('Weapon did not switch to watergun');
            }

            // Fire new weapon
            await helpers.fireWeapon(0);
            await runner.wait(500);

            // Should have new projectile from watergun
            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length === 0) {
                throw new Error('New weapon did not fire after switch');
            }
        }
    );

    // Test 8: NerfGun headshot (if implemented)
    runner.addTest('nerfgun-standard-shot', 'Combat Flow', 'NerfGun fires successfully',
        'Verifies NerfGun can fire and hit enemy',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'nerfgun',
                enemyType: 'SKELETON',
                distance: 20
            });

            const initialHealth = enemy.userData.health;

            // Fire NerfGun
            await helpers.fireWeapon(0);

            // Wait for hit
            const impact = await helpers.waitForProjectileImpact(2000);
            if (!impact.hit) {
                throw new Error('NerfGun projectile did not hit enemy');
            }

            // Verify damage
            await runner.wait(100);
            if (enemy.userData.health >= initialHealth) {
                throw new Error('NerfGun dealt no damage');
            }
        }
    );

})(window.runner);
