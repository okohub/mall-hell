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

    runner.addTest('fps-only-mode', 'FPS Mode', 'Game is FPS only in v3.0',
        'Verifies the game runs in FPS mode only (no third-person)',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            const fpsWeaponVisible = runner.gameWindow.fpsWeapon?.visible;
            if (!fpsWeaponVisible) {
                throw new Error('FPS weapon should be visible in v3.0');
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
        'Verifies that firing state activates when player presses fire button',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            runner.gameWindow.startFiring();
            await runner.wait(50);

            const isFiring = runner.gameWindow.isFiring;
            if (!isFiring) {
                throw new Error('isFiring should be true when startFiring() is called');
            }

            runner.gameWindow.stopFiring();
        }
    );

    runner.addTest('fps-tension-builds', 'FPS Charging', 'Slingshot tension builds while charging',
        'Verifies that holding fire builds slingshot tension over time',
        async () => {
            runner.resetGame();
            await runner.wait(100);

            const startBtn = runner.getElement('#start-btn');
            runner.simulateClick(startBtn);
            await runner.wait(500);

            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.WeaponManager?.currentWeapon?.state) {
                runner.gameWindow.WeaponManager.currentWeapon.state.lastFireTime = 0;
            }

            const initialTension = runner.gameWindow.slingshotTension || 0;

            runner.gameWindow.startCharging();
            await runner.wait(50);

            for (let i = 0; i < 10; i++) {
                runner.gameWindow.manualUpdate(0.1);
                await runner.wait(10);
            }

            const finalTension = runner.gameWindow.slingshotTension || 0;

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
            let attempts = 0;
            while (attempts < 50) {
                if (runner.gameWindow.camera && runner.gameWindow.camera.position) {
                    break;
                }
                await runner.wait(100);
                attempts++;
            }

            if (!runner.gameWindow.camera || !runner.gameWindow.camera.position) {
                throw new Error('Game failed to initialize - camera not ready');
            }

            runner.resetGame();
            await runner.wait(300);

            const startBtn = runner.getElement('#start-btn');
            if (!startBtn) {
                throw new Error('Start button not found');
            }
            runner.simulateClick(startBtn);
            await runner.wait(1000);

            if (runner.gameWindow.gameState !== 'PLAYING') {
                throw new Error(`Game not in PLAYING state: ${runner.gameWindow.gameState}`);
            }

            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.WeaponManager?.currentWeapon?.state) {
                runner.gameWindow.WeaponManager.currentWeapon.state.lastFireTime = 0;
            }

            const initialProjectiles = runner.gameWindow.projectiles?.length || 0;

            const cam = runner.gameWindow.camera;
            if (!cam) {
                throw new Error('Camera became undefined during test');
            }
            if (!cam.position) {
                throw new Error('Camera exists but position is undefined');
            }

            runner.gameWindow.startCharging();
            await runner.wait(50);

            for (let i = 0; i < 5; i++) {
                runner.gameWindow.manualUpdate(0.1);
                await runner.wait(10);
            }

            runner.gameWindow.releaseAndFire();
            await runner.wait(50);

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
            await runner.wait(500);

            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.weapon) {
                runner.gameWindow.weapon.lastFireTime = 0;
            }

            const initialCount = runner.gameWindow.projectiles?.length || 0;

            runner.gameWindow.startFiring();
            await runner.wait(100);
            runner.gameWindow.stopFiring();
            await runner.wait(100);

            let newCount = runner.gameWindow.projectiles?.length || 0;

            if (newCount <= initialCount && runner.gameWindow.fireWeapon) {
                runner.gameWindow.lastShootTime = 0;
                if (runner.gameWindow.weapon) {
                    runner.gameWindow.weapon.lastFireTime = 0;
                }
                runner.gameWindow.fireWeapon(200);
                await runner.wait(50);
                newCount = runner.gameWindow.projectiles?.length || 0;
            }

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
            await runner.wait(300);

            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.weapon) {
                runner.gameWindow.weapon.lastFireTime = 0;
            }

            runner.gameWindow.startFiring();
            await runner.wait(50);
            runner.gameWindow.stopFiring();
            await runner.wait(50);

            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length === 0) {
                throw new Error('No projectile created');
            }

            const proj = projectiles[projectiles.length - 1];
            const initialZ = proj.position.z;

            await runner.wait(200);

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
            await runner.wait(500);

            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.weapon) {
                runner.gameWindow.weapon.lastFireTime = 0;
            }

            const initialCount = runner.gameWindow.projectiles?.length || 0;

            runner.gameWindow.startFiring();
            await runner.wait(100);
            runner.gameWindow.stopFiring();
            await runner.wait(100);

            const projectiles = runner.gameWindow.projectiles || [];
            if (projectiles.length <= initialCount) {
                if (runner.gameWindow.fireWeapon) {
                    runner.gameWindow.fireWeapon(200);
                    await runner.wait(50);
                }
            }

            if (projectiles.length === 0) {
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
            await runner.wait(300);

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
            await runner.wait(300);

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
            await runner.wait(300);

            runner.gameWindow.lastShootTime = 0;
            if (runner.gameWindow.weapon) {
                runner.gameWindow.weapon.lastFireTime = 0;
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

})(window.runner);
