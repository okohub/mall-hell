/**
 * Weapon UI Tests
 * Tests for FPS Weapon, Charging, Projectiles
 */

(function(runner) {
    'use strict';

    // FPS Weapon System Tests
    runner.addTest('fps-weapon-visible-in-fps-mode', 'FPS Weapon', 'Slingshot visible in FPS mode',
        'Verifies the FPS weapon (hands with slingshot) is visible during FPS gameplay',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const fpsBtn = runner.getElement('#fps-btn');
            if (fpsBtn) runner.simulateClick(fpsBtn);
            await runner.wait(50);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const fpsWeaponVisible = runner.gameWindow.fpsWeapon?.visible;

            if (!fpsWeaponVisible) {
                throw new Error('FPS weapon should be visible');
            }
        }
    );

    runner.addTest('fps-only-mode', 'FPS Mode', 'Game runs in first-person mode',
        'Verifies the game runs in FPS mode only (no third-person)',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const fpsWeaponVisible = runner.gameWindow.fpsWeapon?.visible;
            if (!fpsWeaponVisible) {
                throw new Error('FPS weapon should be visible');
            }

            const childVisible = runner.gameWindow.playerChild?.visible;
            if (childVisible === true) {
                throw new Error('Child model should be hidden in FPS mode');
            }
        }
    );

    runner.addTest('child-hidden-in-fps', 'FPS Mode', 'Child model hidden in FPS mode',
        'Verifies the child character is hidden when in FPS mode (camera is the child)',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const childVisible = runner.gameWindow.playerChild?.visible;
            if (childVisible === true) {
                throw new Error('Child model should be hidden in FPS mode');
            }
        }
    );

    runner.addTest('camera-follows-player', 'FPS Mode', 'Camera follows player position',
        'Verifies camera position matches player position',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const camera = runner.gameWindow.camera;
            const playerPos = runner.gameWindow.playerPosition;
            if (!camera || !playerPos) {
                throw new Error('Camera or player position not found');
            }

            const xDiff = Math.abs(camera.position.x - playerPos.x);
            const zDiff = Math.abs(camera.position.z - playerPos.z);
            if (xDiff > 1 || zDiff > 1) {
                throw new Error(`Camera not following player. Diff X: ${xDiff}, Z: ${zDiff}`);
            }
        }
    );

    // FPS Weapon State Tests
    runner.addTest('fps-charging-starts', 'FPS Charging', 'Firing state activates on button press',
        'Verifies that charging state activates when player presses fire button',
        async () => {
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            if (runner.getGameState() !== 'PLAYING') {
                throw new Error(`Not in PLAYING state: ${runner.getGameState()}`);
            }

            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            if (!WeaponOrchestrator?.currentWeapon) {
                throw new Error('WeaponOrchestrator.currentWeapon not available');
            }

            // Reset weapon to ensure clean state
            WeaponOrchestrator.currentWeapon.reset?.();

            const weapon = WeaponOrchestrator.currentWeapon;

            // Verify weapon can fire
            const canFire = weapon.canFire(Date.now());
            if (!canFire) {
                throw new Error(`Weapon cannot fire. Ammo: ${weapon.state.ammo}, cooldown issue: ${Date.now() - weapon.state.lastFireTime < weapon.config.cooldown}`);
            }

            // Call onFireStart directly
            weapon.onFireStart(Date.now());

            if (!weapon.state.isCharging) {
                throw new Error('Weapon not charging after onFireStart()');
            }

            weapon.cancelAction?.();
        }
    );

    runner.addTest('fps-tension-builds', 'FPS Charging', 'Slingshot tension builds while charging',
        'Verifies that holding fire builds slingshot tension over time',
        async () => {
            runner.resetGame();
            await runner.wait(200);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);

            // Wait for PLAYING state
            let attempts = 0;
            while (attempts < 30) {
                if (runner.gameWindow.gameState === 'PLAYING') break;
                await runner.wait(100);
                attempts++;
            }

            // Reset weapon state completely
            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                const weapon = runner.gameWindow.WeaponOrchestrator.currentWeapon;
                weapon.state.lastFireTime = 0;
                weapon.state.chargeAmount = 0;
                weapon.state.isCharging = false;
                // Ensure ammo is available
                if (weapon.config?.ammo?.max && weapon.config.ammo.max !== Infinity) {
                    weapon.state.ammo = weapon.config.ammo.max;
                }
            }

            // Get initial tension (should be 0 after reset)
            const initialTension = runner.gameWindow.WeaponOrchestrator?.getTension() || 0;

            runner.gameWindow.startCharging();
            await runner.wait(50);

            for (let i = 0; i < 10; i++) {
                runner.gameWindow.manualUpdate(0.1);
                await runner.wait(10);
            }

            // Get final tension via WeaponOrchestrator
            const finalTension = runner.gameWindow.WeaponOrchestrator?.getTension() || 0;

            runner.gameWindow.cancelCharging();

            if (finalTension <= initialTension) {
                throw new Error(`Tension should build during charge: initial=${initialTension}, final=${finalTension}`);
            }
        }
    );

    runner.addTest('fps-weapon-renders', 'FPS Weapon', 'FPS weapon renders in scene',
        'Verifies that the FPS weapon is actually added to camera and renders',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const camera = runner.gameWindow.camera;
            const fpsWeapon = runner.gameWindow.fpsWeapon;

            if (!fpsWeapon) {
                throw new Error('fpsWeapon object should exist');
            }
            if (!camera) {
                throw new Error('camera object should exist');
            }

            let isChild = false;
            camera.children.forEach(child => {
                if (child === fpsWeapon) isChild = true;
            });

            if (!isChild) {
                throw new Error('fpsWeapon should be a child of camera for rendering');
            }

            if (!camera.parent) {
                throw new Error('Camera must be added to scene (camera.parent should exist)');
            }
        }
    );

    runner.addTest('fps-release-fires', 'FPS Charging', 'Slingshot fires on release',
        'Verifies that releasing after charging fires a projectile',
        async () => {
            // This test verifies projectiles are created by the fire mechanism
            // Uses same reliable pattern as other passing projectile tests
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            // Reset cooldowns and ensure ammo
            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                const weapon = runner.gameWindow.WeaponOrchestrator.currentWeapon;
                weapon.state.lastFireTime = 0;
                weapon.state.chargeAmount = 0;
                weapon.state.isCharging = false;
                if (weapon.config?.ammo?.max && weapon.config.ammo.max !== Infinity) {
                    weapon.state.ammo = weapon.config.ammo.max;
                }
            }

            const initialProjectiles = runner.gameWindow.projectiles?.length || 0;

            // Use simple fire pattern (startFiring/stopFiring calls startCharging/releaseAndFire internally)
            runner.gameWindow.startFiring();
            await runner.wait(50);
            runner.gameWindow.stopFiring();
            await runner.wait(100);

            const projectilesAfterFire = runner.gameWindow.projectiles?.length || 0;

            if (projectilesAfterFire <= initialProjectiles) {
                throw new Error(`Projectile should be created on release: initial=${initialProjectiles}, afterFire=${projectilesAfterFire}`);
            }
        }
    );

    // Projectile System Tests
    runner.addTest('projectile-creation', 'Projectile System', 'Projectiles are created when shooting',
        'Verifies that shooting creates a projectile object in the scene',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            // Reset cooldowns and ensure ammo
            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                const weapon = runner.gameWindow.WeaponOrchestrator.currentWeapon;
                weapon.state.lastFireTime = 0;
                weapon.state.chargeAmount = 0;
                weapon.state.isCharging = false;
                if (weapon.config?.ammo?.max && weapon.config.ammo.max !== Infinity) {
                    weapon.state.ammo = weapon.config.ammo.max;
                }
            }

            const initialCount = runner.gameWindow.projectiles?.length || 0;

            // Start charging and wait for minimum charge time
            // minTension=0.2, chargeRate=1.2/sec, so need ~170ms minimum
            runner.gameWindow.startFiring();
            await runner.wait(200);
            runner.gameWindow.stopFiring();
            await runner.wait(100);

            const newCount = runner.gameWindow.projectiles?.length || 0;

            if (newCount <= initialCount) {
                throw new Error(`Projectile not created: before=${initialCount}, after=${newCount}`);
            }
        }
    );

    runner.addTest('projectile-movement', 'Projectile System', 'Projectiles move after creation',
        'Verifies that projectiles travel through the scene',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            // Reset cooldowns with ammo
            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                const weapon = runner.gameWindow.WeaponOrchestrator.currentWeapon;
                weapon.state.lastFireTime = 0;
                weapon.state.chargeAmount = 0;
                weapon.state.isCharging = false;
                if (weapon.config?.ammo?.max && weapon.config.ammo.max !== Infinity) {
                    weapon.state.ammo = weapon.config.ammo.max;
                }
            }

            // Start charging and wait for minimum charge time
            runner.gameWindow.startFiring();
            await runner.wait(200);
            runner.gameWindow.stopFiring();
            await runner.wait(100);

            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length === 0) {
                throw new Error('No projectile created');
            }

            const proj = projectiles[projectiles.length - 1];
            const initialZ = proj.position.z;

            // Update to move projectile
            if (runner.gameWindow.manualUpdate) {
                runner.gameWindow.manualUpdate(0.1);
            }
            await runner.wait(50);

            const newZ = proj.position.z;
            if (Math.abs(newZ - initialZ) < 0.5) {
                throw new Error(`Projectile did not move: initial=${initialZ}, current=${newZ}`);
            }
        }
    );

    runner.addTest('projectile-cleanup', 'Projectile System', 'Projectiles are cleaned up when out of bounds',
        'Verifies that projectiles are removed when they go too far',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            // Reset cooldowns and ensure ammo
            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                const weapon = runner.gameWindow.WeaponOrchestrator.currentWeapon;
                weapon.state.lastFireTime = 0;
                weapon.state.chargeAmount = 0;
                weapon.state.isCharging = false;
                if (weapon.config?.ammo?.max && weapon.config.ammo.max !== Infinity) {
                    weapon.state.ammo = weapon.config.ammo.max;
                }
            }

            const initialCount = runner.gameWindow.projectiles?.length || 0;

            // Start charging and wait for minimum charge time
            runner.gameWindow.startFiring();
            await runner.wait(200);
            runner.gameWindow.stopFiring();
            await runner.wait(100);

            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length <= initialCount) {
                throw new Error('No projectile created');
            }

            const proj = projectiles[projectiles.length - 1];
            proj.position.set(1000, 1000, 1000);

            if (runner.gameWindow.manualUpdate) {
                runner.gameWindow.manualUpdate(0.016);
            }
            await runner.wait(100);

            if (proj.userData && proj.userData.active) {
                throw new Error('Projectile should be inactive when out of bounds');
            }
        }
    );

    // Wall Bump Effect Tests
    runner.addTest('wall-bump-trigger', 'Wall Bump', 'Wall bump can be triggered',
        'Verifies the wall bump effect system responds to triggers',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            if (runner.gameWindow.triggerWallBump) {
                runner.gameWindow.triggerWallBump(0.8, -1, 0);
            }
            await runner.wait(50);

            const intensity = runner.gameWindow.wallBumpIntensity || 0;
            if (intensity < 0.1) {
                throw new Error(`Wall bump intensity should be positive after trigger: ${intensity}`);
            }
        }
    );

    runner.addTest('wall-bump-decay', 'Wall Bump', 'Wall bump decays over time',
        'Verifies the wall bump effect decays after being triggered',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            if (runner.gameWindow.triggerWallBump) {
                runner.gameWindow.triggerWallBump(1.0, -1, 0);
            }

            const initialIntensity = runner.gameWindow.wallBumpIntensity || 0;

            for (let i = 0; i < 10; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
            await runner.wait(50);

            const finalIntensity = runner.gameWindow.wallBumpIntensity || 0;
            if (finalIntensity >= initialIntensity * 0.5) {
                throw new Error(`Bump should decay: initial=${initialIntensity}, final=${finalIntensity}`);
            }
        }
    );

    // Projectile Direction Tests
    runner.addTest('projectile-travels-forward', 'Projectile Direction', 'Projectiles travel forward',
        'Verifies that projectiles move in the forward direction based on player rotation',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.weapon) {
                runner.gameWindow.weapon.lastFireTime = 0;
            }
            // Also reset via WeaponOrchestrator
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                const weapon = runner.gameWindow.WeaponOrchestrator.currentWeapon;
                weapon.state.lastFireTime = 0;
                weapon.state.chargeAmount = 0;
                weapon.state.isCharging = false;
                // Ensure ammo is available
                if (weapon.config?.ammo?.max && weapon.config.ammo.max !== Infinity) {
                    weapon.state.ammo = weapon.config.ammo.max;
                }
            }

            const initialProjCount = runner.gameWindow.projectiles?.length || 0;

            runner.gameWindow.startFiring();
            await runner.wait(50);
            runner.gameWindow.stopFiring();

            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length <= initialProjCount) {
                throw new Error('No projectile created');
            }

            const proj = projectiles[projectiles.length - 1];
            const velocity = proj.userData?.velocity;
            if (!velocity) {
                throw new Error('Projectile has no velocity');
            }

            if (velocity.z >= 0) {
                throw new Error(`Projectile should travel forward (-Z): z=${velocity.z}`);
            }
            if (Math.abs(velocity.x) > Math.abs(velocity.z)) {
                throw new Error(`Projectile traveling sideways more than forward: x=${velocity.x}, z=${velocity.z}`);
            }
        }
    );

    // Ammo Display Tests
    runner.addTest('ammo-display-no-ammo', 'Ammo Display', 'Shows NO AMMO when empty',
        'Verifies the HUD shows "NO AMMO" when weapon ammo is depleted',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            // Set ammo to 0
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                runner.gameWindow.WeaponOrchestrator.currentWeapon.state.ammo = 0;
            }

            // Trigger ammo display update
            if (runner.gameWindow.updateAmmoDisplay) {
                runner.gameWindow.updateAmmoDisplay();
            }
            await runner.wait(50);

            // Check the ammo display element
            const ammoDisplay = runner.getElement('#ammo-display');
            if (!ammoDisplay) {
                throw new Error('Ammo display element not found');
            }

            const text = ammoDisplay.textContent;
            if (!text.includes('NO AMMO')) {
                throw new Error(`Expected "NO AMMO" when ammo is 0, got: "${text}"`);
            }
        }
    );

    runner.addTest('ammo-display-shows-count', 'Ammo Display', 'Shows ammo count when available',
        'Verifies the HUD shows ammo count when weapon has ammo',
        async () => {
            runner.resetGame();
            await runner.wait(100);
            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(400);

            // Ensure ammo is available
            if (runner.gameWindow.WeaponOrchestrator?.currentWeapon) {
                const weapon = runner.gameWindow.WeaponOrchestrator.currentWeapon;
                if (weapon.config?.ammo?.max) {
                    weapon.state.ammo = weapon.config.ammo.max;
                }
            }

            // Trigger ammo display update
            if (runner.gameWindow.updateAmmoDisplay) {
                runner.gameWindow.updateAmmoDisplay();
            }
            await runner.wait(50);

            // Check the ammo display element
            const ammoDisplay = runner.getElement('#ammo-display');
            if (!ammoDisplay) {
                throw new Error('Ammo display element not found');
            }

            const text = ammoDisplay.textContent;
            if (text.includes('NO AMMO')) {
                throw new Error(`Should show ammo count, not "NO AMMO": "${text}"`);
            }
        }
    );

})(window.runner);
