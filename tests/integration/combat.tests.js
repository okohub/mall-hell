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
                distance: 10  // Keep enemy close in same room
            });

            const initialHealth = enemy.userData.health;

            // Fire charged shot (chargeTime=0 since fireWeapon forces full charge)
            await helpers.fireWeapon(0);

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
                distance: 10,  // Keep enemy close in same room
                enemyHealth: 1
            });

            const initialScore = runner.getScore();

            // Fire charged shot (chargeTime=0 since fireWeapon forces full charge)
            await helpers.fireWeapon(0);

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
                weapon: 'nerfgun',  // Use nerfgun (single-shot with cooldown)
                enemyType: 'SKELETON',
                distance: 15
            });

            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const weapon = WeaponOrchestrator.currentWeapon;

            // Fire first shot using helper (this resets cooldown)
            await helpers.fireWeapon(0);
            const projectiles1 = (runner.gameWindow.projectiles || []).length;

            // Try to fire again WITHOUT resetting cooldown
            // Use direct weapon API instead of helper
            const now = Date.now();
            const fireResult = weapon.onFireStart(now);

            // fireResult should be null (blocked by cooldown)
            const projectiles2 = (runner.gameWindow.projectiles || []).length;

            if (projectiles2 > projectiles1 || fireResult) {
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
            await helpers.fireWeapon(0);

            // Run game loop to let projectile travel and despawn (simulating ~3 seconds)
            // Max range is ~150 units, projectile speed ~100 units/sec, so ~2sec to despawn
            for (let i = 0; i < 200; i++) {  // ~3.2 seconds at 60fps
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
                await runner.wait(16);
            }

            // Projectiles should be empty (despawned at max range)
            const gi = runner.gameWindow.__gameInternals;
            const projectiles = gi ? gi.getProjectiles() : (runner.gameWindow.projectiles || []);
            if (projectiles.length > 0) {
                throw new Error('Projectile did not despawn at max range');
            }
        }
    );

    // Test 5: Lasergun rapid fire (auto-fire weapon)
    runner.addTest('lasergun-rapid-fire', 'Combat Flow', 'Lasergun rapid fire spawns projectiles',
        'Verifies holding fire button spawns multiple projectiles with auto-fire weapon',
        async () => {
            await helpers.setupCombatScenario({
                weapon: 'lasergun',  // Lasergun is the auto-fire weapon
                enemyType: 'SKELETON',
                distance: 12,
                enemyHealth: 3
            });

            // Use holdFire helper for auto-fire weapons
            await helpers.holdFire(500);

            // Check multiple projectiles spawned
            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length < 2) {
                throw new Error(`Expected multiple projectiles, got ${projectiles.length}`);
            }
        }
    );

    // Test 6: Collision with obstacle
    runner.addTest('collision-with-obstacle', 'Combat Flow', 'Obstacle blocks projectile',
        'Verifies projectile hits obstacle instead of enemy behind it',
        async () => {
            const { enemy, player } = await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 12
            });

            // Get player and enemy positions
            const playerPos = player.position;
            const enemyPos = enemy.position;

            // Place obstacle exactly between player and enemy
            const midX = (playerPos.x + enemyPos.x) / 2;
            const midZ = (playerPos.z + enemyPos.z) / 2;

            // Spawn obstacle between player and enemy
            const THREE = runner.gameWindow.THREE;
            const obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(8, 5, 2),  // Wide enough to block
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            obstacle.position.set(midX, 2, midZ);
            obstacle.userData = { active: true, isObstacle: true, height: 5, width: 8 };
            runner.gameWindow.scene.add(obstacle);

            // Add to obstacles array for collision detection
            const obstacles = runner.gameWindow.obstacles || [];
            obstacles.push(obstacle);

            const initialHealth = enemy.userData.health;

            // Fire at enemy (should hit obstacle)
            await helpers.fireWeapon(0);
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
                distance: 12
            });

            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const THREE = runner.gameWindow.THREE;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const camera = runner.gameWindow.camera;

            // Use __gameInternals to ensure we get the real array
            const gi = runner.gameWindow.__gameInternals;
            const getProjectiles = () => gi ? gi.getProjectiles() : (runner.gameWindow.projectiles || []);

            // Check state before first fire
            const slingshotAmmoBeforeFire = WeaponOrchestrator.currentWeapon?.state?.ammo;
            const projectilesBeforeFire = getProjectiles().length;

            // Fire slingshot (chargeTime=0 since fireWeapon forces full charge)
            const proj1 = await helpers.fireWeapon(0);
            await runner.wait(50);  // Allow projectile to be added

            const slingshotAmmoAfterFire = WeaponOrchestrator.currentWeapon?.state?.ammo;
            const projectilesAfterSlingshot = getProjectiles().length;

            // Check if fireWeapon returned a projectile
            if (!proj1) {
                throw new Error(`Slingshot fire failed. AmmoB4=${slingshotAmmoBeforeFire}, AmmoAfter=${slingshotAmmoAfterFire}, ProjB4=${projectilesBeforeFire}, ProjAfter=${projectilesAfterSlingshot}, gi=${!!gi}`);
            }

            // Verify projectile was actually added to array
            if (projectilesAfterSlingshot === 0) {
                const proj1Active = proj1.userData?.active;
                const arraysMatch = gi?.getProjectiles() === getProjectiles();
                throw new Error(`Slingshot: proj returned but array empty. proj1Active=${proj1Active}, arrMatch=${arraysMatch}, AmmoB4=${slingshotAmmoBeforeFire}, AmmoAft=${slingshotAmmoAfterFire}`);
            }

            // Switch to different weapon (nerfgun - single shot, easy to test)
            WeaponOrchestrator.equip('nerfgun', THREE, MaterialsTheme, camera);
            await runner.wait(100);

            // Verify weapon switched
            const currentWeapon = WeaponOrchestrator.currentWeapon;
            if (!currentWeapon || currentWeapon.config.id !== 'nerfgun') {
                throw new Error(`Weapon did not switch to nerfgun, got: ${currentWeapon?.config?.id}`);
            }

            // Ensure refs are set for new weapon
            helpers.ensureProjectileRefs();

            // Fire new weapon using helper
            await helpers.fireWeapon(0);
            await runner.wait(200);

            // Should have new projectile from nerfgun
            const projectilesAfterNerfgun = getProjectiles().length;
            if (projectilesAfterNerfgun <= projectilesAfterSlingshot) {
                // Diagnostic info
                const weapon = WeaponOrchestrator.currentWeapon;
                const ammo = weapon?.state?.ammo;
                const lastFire = weapon?.state?.lastFireTime;
                const gameState = runner.gameWindow.StateOrchestrator?.current;
                const projectilesArr = getProjectiles();
                throw new Error(`New weapon did not fire. Before: ${projectilesAfterSlingshot}, After: ${projectilesAfterNerfgun}, ammo=${ammo}, lastFire=${lastFire}, gameState=${gameState}, arrLen=${projectilesArr.length}`);
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
