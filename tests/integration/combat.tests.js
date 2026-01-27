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

})(window.runner);
