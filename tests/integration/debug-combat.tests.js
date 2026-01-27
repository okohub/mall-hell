/**
 * Debug Combat Tests
 * Diagnostic tests to understand combat system behavior
 */

(function(runner) {
    'use strict';

    const helpers = window.IntegrationHelpers;

    // Debug test: Check if projectile spawns
    runner.addTest('debug-projectile-spawn', 'Debug', 'Check if projectile spawns',
        'Diagnostic test to verify projectile creation',
        async () => {
            await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20
            });

            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const weapon = WeaponOrchestrator.currentWeapon;

            console.log('[DEBUG] Weapon:', weapon ? weapon.config.name : 'none');
            console.log('[DEBUG] Can fire:', weapon ? weapon.canFire() : 'n/a');
            console.log('[DEBUG] Ammo:', weapon ? weapon.state.ammo : 'n/a');

            const initialProjectiles = runner.gameWindow.getProjectiles ? runner.gameWindow.getProjectiles() : [];
            console.log('[DEBUG] Initial projectiles:', initialProjectiles.length);

            // Fire weapon
            await helpers.fireWeapon(500);

            const afterFireProjectiles = runner.gameWindow.getProjectiles ? runner.gameWindow.getProjectiles() : [];
            console.log('[DEBUG] After fire projectiles:', afterFireProjectiles.length);
            console.log('[DEBUG] After fire canFire:', weapon.canFire(Date.now()));
            console.log('[DEBUG] After fire lastFireTime:', weapon.state.lastFireTime);

            if (afterFireProjectiles.length === 0) {
                throw new Error(`No projectile spawned. Weapon: ${weapon.config.name}, CanFire after: ${weapon.canFire(Date.now())}, Ammo: ${weapon.state.ammo}, LastFire: ${weapon.state.lastFireTime}`);
            }

            const proj = afterFireProjectiles[0];
            console.log('[DEBUG] Projectile position:', proj.position);
            console.log('[DEBUG] Projectile active:', proj.active);
            console.log('[DEBUG] Projectile velocity:', proj.velocity);
        }
    );

    // Debug test: Check enemy position
    runner.addTest('debug-enemy-position', 'Debug', 'Check enemy spawning',
        'Diagnostic test to verify enemy creation',
        async () => {
            const { enemy } = await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20
            });

            console.log('[DEBUG] Enemy position:', enemy.position);
            console.log('[DEBUG] Enemy health:', enemy.userData.health);
            console.log('[DEBUG] Enemy active:', enemy.userData.active);
            console.log('[DEBUG] Camera position:', runner.gameWindow.camera.position);
        }
    );

    // Debug test: Run game loop and check projectile movement
    runner.addTest('debug-projectile-movement', 'Debug', 'Check projectile movement',
        'Diagnostic test to verify projectile updates',
        async () => {
            await helpers.setupCombatScenario({
                weapon: 'slingshot',
                enemyType: 'SKELETON',
                distance: 20
            });

            await helpers.fireWeapon(500);

            const projectiles = runner.gameWindow.getProjectiles ? runner.gameWindow.getProjectiles() : [];
            if (projectiles.length === 0) {
                throw new Error('No projectile to track');
            }

            const proj = projectiles[0];
            const initialZ = proj.position.z;
            console.log('[DEBUG] Initial projectile Z:', initialZ);

            // Run 30 frames
            for (let i = 0; i < 30; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
                await runner.wait(16);
            }

            const afterZ = proj.position.z;
            console.log('[DEBUG] After 30 frames Z:', afterZ);
            console.log('[DEBUG] Distance traveled:', Math.abs(afterZ - initialZ));
            console.log('[DEBUG] Projectile still active:', proj.active);

            if (Math.abs(afterZ - initialZ) < 1) {
                throw new Error('Projectile did not move');
            }
        }
    );

})(window.runner);
