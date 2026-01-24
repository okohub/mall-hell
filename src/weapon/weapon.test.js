// ============================================
// WEAPON DOMAIN - Unit Tests
// ============================================
// Tests for Weapon data, WeaponVisual, and WeaponSystem

(function(test) {
    'use strict';

    // ==========================================
    // WEAPON DATA TESTS
    // ==========================================

    test.describe('Weapon Data', () => {
        test.it('should have SLINGSHOT type defined', () => {
            test.assertTrue(Weapon.types.SLINGSHOT !== undefined, 'SLINGSHOT should exist');
        });

        test.it('should have correct slingshot properties', () => {
            const slingshot = Weapon.types.SLINGSHOT;
            test.assertEqual(slingshot.id, 'slingshot');
            test.assertEqual(slingshot.fireMode, 'charge');
            test.assertEqual(slingshot.cooldown, 300);
            test.assertEqual(slingshot.chargeRate, 1.2);
            test.assertEqual(slingshot.minTension, 0.2);
            test.assertEqual(slingshot.maxTension, 1.0);
        });

        test.it('should get weapon by id', () => {
            const weapon = Weapon.get('SLINGSHOT');
            test.assertTrue(weapon !== null);
            test.assertEqual(weapon.id, 'slingshot');
        });

        test.it('should return null for unknown weapon', () => {
            const weapon = Weapon.get('UNKNOWN');
            test.assertEqual(weapon, null);
        });

        test.it('should have STANDARD aim profile', () => {
            const profile = Weapon.aimProfiles.STANDARD;
            test.assertTrue(profile !== undefined);
            test.assertTrue(profile.enabled);
            test.assertEqual(profile.maxRange, 100);
        });

        test.it('should have NONE aim profile', () => {
            const profile = Weapon.aimProfiles.NONE;
            test.assertTrue(profile !== undefined);
            test.assertFalse(profile.enabled);
        });

        test.it('should get aim profile by id', () => {
            const profile = Weapon.getAimProfile('STANDARD');
            test.assertTrue(profile.enabled);
        });

        test.it('should return STANDARD for unknown aim profile', () => {
            const profile = Weapon.getAimProfile('UNKNOWN');
            test.assertTrue(profile.enabled); // Falls back to STANDARD
        });
    });

    // ==========================================
    // WEAPON SYSTEM TESTS
    // ==========================================

    test.describe('Weapon System - Initialization', () => {
        test.it('should initialize with default weapon', () => {
            WeaponSystem.init(Weapon);
            test.assertEqual(WeaponSystem.currentWeaponId, 'SLINGSHOT');
        });

        test.it('should reset state on init', () => {
            WeaponSystem.chargeState = 0.5;
            WeaponSystem.isCharging = true;
            WeaponSystem.init(Weapon);
            test.assertEqual(WeaponSystem.chargeState, 0);
            test.assertFalse(WeaponSystem.isCharging);
        });

        test.it('should get weapon config', () => {
            WeaponSystem.init(Weapon);
            const config = WeaponSystem.getWeaponConfig();
            test.assertTrue(config !== null);
            test.assertEqual(config.id, 'slingshot');
        });
    });

    test.describe('Weapon System - Charging', () => {
        test.beforeEach(() => {
            WeaponSystem.init(Weapon);
        });

        test.it('should start charging', () => {
            const result = WeaponSystem.startCharge();
            test.assertTrue(result);
            test.assertTrue(WeaponSystem.isCharging);
            test.assertEqual(WeaponSystem.chargeState, 0.2); // minTension
        });

        test.it('should not start charging if already charging', () => {
            WeaponSystem.startCharge();
            const result = WeaponSystem.startCharge();
            test.assertFalse(result);
        });

        test.it('should update charge over time', () => {
            WeaponSystem.startCharge();
            const initialTension = WeaponSystem.chargeState;
            WeaponSystem.updateCharge(0.5); // 0.5 seconds
            test.assertTrue(WeaponSystem.chargeState > initialTension);
        });

        test.it('should cap charge at maxTension', () => {
            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(10); // Long time
            test.assertEqual(WeaponSystem.chargeState, 1.0);
        });

        test.it('should release charge and return tension', () => {
            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(0.5);
            const tension = WeaponSystem.releaseCharge();
            test.assertTrue(tension > 0.2);
            test.assertFalse(WeaponSystem.isCharging);
            test.assertEqual(WeaponSystem.chargeState, 0);
        });

        test.it('should return null if not charging', () => {
            const tension = WeaponSystem.releaseCharge();
            test.assertEqual(tension, null);
        });

        test.it('should cancel charge', () => {
            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(0.5);
            WeaponSystem.cancelCharge();
            test.assertFalse(WeaponSystem.isCharging);
            test.assertEqual(WeaponSystem.chargeState, 0);
        });
    });

    test.describe('Weapon System - Firing', () => {
        test.beforeEach(() => {
            WeaponSystem.init(Weapon);
        });

        test.it('should calculate speed based on tension', () => {
            const minSpeed = WeaponSystem.calculateSpeed(0);
            const maxSpeed = WeaponSystem.calculateSpeed(1);
            test.assertEqual(minSpeed, 60);
            test.assertEqual(maxSpeed, 180);
        });

        test.it('should fire and return result', () => {
            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(0.5);
            const result = WeaponSystem.fire(1000);
            test.assertTrue(result !== null);
            test.assertTrue(result.speed > 60);
            test.assertTrue(result.power > 0.2);
            test.assertEqual(result.damage, 1);
        });

        test.it('should respect cooldown', () => {
            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(0.5);
            WeaponSystem.fire(1000);

            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(0.5);
            const result = WeaponSystem.fire(1100); // Only 100ms later
            test.assertEqual(result, null);
        });

        test.it('should allow fire after cooldown', () => {
            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(0.5);
            WeaponSystem.fire(1000);

            WeaponSystem.startCharge();
            WeaponSystem.updateCharge(0.5);
            const result = WeaponSystem.fire(1500); // 500ms later
            test.assertTrue(result !== null);
        });
    });

    test.describe('Weapon System - Aiming', () => {
        test.beforeEach(() => {
            WeaponSystem.init(Weapon);
        });

        test.it('should set aim profile', () => {
            const result = WeaponSystem.setAimProfile('NONE');
            test.assertTrue(result);
            test.assertEqual(WeaponSystem.aimProfile, 'NONE');
        });

        test.it('should check if aiming enabled', () => {
            WeaponSystem.setAimProfile('STANDARD');
            test.assertTrue(WeaponSystem.isAimingEnabled());

            WeaponSystem.setAimProfile('NONE');
            test.assertFalse(WeaponSystem.isAimingEnabled());
        });

        test.it('should update crosshair position', () => {
            WeaponSystem.updateCrosshair(100, 200);
            const pos = WeaponSystem.getCrosshairPosition();
            test.assertEqual(pos.x, 100);
            test.assertEqual(pos.y, 200);
        });

        test.it('should set and clear lock', () => {
            const mockTarget = { id: 'enemy1' };
            WeaponSystem.setLock(mockTarget);
            test.assertEqual(WeaponSystem.getLockedTarget(), mockTarget);
            test.assertTrue(WeaponSystem.isAimAssistActive());

            WeaponSystem.clearLock();
            test.assertEqual(WeaponSystem.getLockedTarget(), null);
            test.assertFalse(WeaponSystem.isAimAssistActive());
        });

        test.it('should score enemy ahead in path', () => {
            const enemy = { position: { x: 0, z: -20 } };
            const cameraPos = { x: 0, z: 0 };
            const playerPos = { x: 0, z: 0 };
            const score = WeaponSystem.scoreEnemy(enemy, cameraPos, playerPos);
            test.assertTrue(score > 500); // Should get inPathBonus
        });

        test.it('should score enemy behind lower', () => {
            const enemy = { position: { x: 0, z: 20 } };
            const cameraPos = { x: 0, z: 0 };
            const playerPos = { x: 0, z: 0 };
            const score = WeaponSystem.scoreEnemy(enemy, cameraPos, playerPos);
            test.assertTrue(score < 200); // Should get fallbackScore minus distance
        });
    });

    // ==========================================
    // WEAPON VISUAL TESTS
    // ==========================================

    test.describe('Weapon Visual', () => {
        test.it('should have color palette defined', () => {
            test.assertTrue(WeaponVisual.colors !== undefined);
            test.assertTrue(WeaponVisual.colors.wood !== undefined);
            test.assertTrue(WeaponVisual.colors.leather !== undefined);
        });

        test.it('should have createFPSWeapon method', () => {
            test.assertTrue(typeof WeaponVisual.createFPSWeapon === 'function');
        });

        test.it('should have createSlingshotMesh method', () => {
            test.assertTrue(typeof WeaponVisual.createSlingshotMesh === 'function');
        });

        test.it('should have createThirdPersonWeapon method', () => {
            test.assertTrue(typeof WeaponVisual.createThirdPersonWeapon === 'function');
        });

        test.it('should have animateFPSWeapon method', () => {
            test.assertTrue(typeof WeaponVisual.animateFPSWeapon === 'function');
        });

        // Visual creation tests require THREE.js - run in browser context
        test.it('should create FPS weapon with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const fpsWeapon = WeaponVisual.createFPSWeapon(THREE);
            test.assertTrue(fpsWeapon instanceof THREE.Group);
            test.assertTrue(fpsWeapon.userData.leftHand !== undefined);
            test.assertTrue(fpsWeapon.userData.rightHand !== undefined);
            test.assertTrue(fpsWeapon.userData.slingshot !== undefined);
        });

        test.it('should create slingshot mesh with THREE', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            const slingshot = WeaponVisual.createSlingshotMesh(THREE, false);
            test.assertTrue(slingshot instanceof THREE.Group);
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {} });
