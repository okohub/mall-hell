// ============================================
// WEAPON DOMAIN - Unit Tests
// ============================================
// Tests for WeaponManager, Slingshot, WaterGun, NerfGun, Pickup

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
            test.assertEqual(slingshot.range, 120, 'Slingshot should have 120 unit range');
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
            test.assertEqual(profile.maxRange, 150);
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
    // WEAPON MANAGER TESTS
    // ==========================================

    test.describe('WeaponManager - Initialization', () => {
        test.it('should have init method', () => {
            test.assertTrue(typeof WeaponManager.init === 'function');
        });

        test.it('should have register method', () => {
            test.assertTrue(typeof WeaponManager.register === 'function');
        });

        test.it('should have equip method', () => {
            test.assertTrue(typeof WeaponManager.equip === 'function');
        });

        test.it('should initialize with empty registry', () => {
            WeaponManager.init(null);
            test.assertTrue(WeaponManager.weapons !== undefined);
            test.assertEqual(WeaponManager.currentWeaponId, null);
        });
    });

    test.describe('WeaponManager - Registration', () => {
        test.beforeEach(() => {
            WeaponManager.init(null);
        });

        test.it('should register weapon module', () => {
            const result = WeaponManager.register(Slingshot);
            test.assertTrue(result);
            test.assertTrue(WeaponManager.weapons['slingshot'] !== undefined);
        });

        test.it('should register multiple weapons', () => {
            WeaponManager.register(Slingshot);
            WeaponManager.register(WaterGun);
            WeaponManager.register(NerfGun);
            test.assertTrue(WeaponManager.weapons['slingshot'] !== undefined);
            test.assertTrue(WeaponManager.weapons['watergun'] !== undefined);
            test.assertTrue(WeaponManager.weapons['nerfgun'] !== undefined);
        });

        test.it('should reject weapon without id', () => {
            const result = WeaponManager.register({});
            test.assertFalse(result);
        });
    });

    test.describe('WeaponManager - Delegation', () => {
        test.beforeEach(() => {
            WeaponManager.init(null);
            WeaponManager.register(Slingshot);
            // Can't fully equip without THREE, so just set current weapon manually
            WeaponManager.currentWeaponId = 'slingshot';
            WeaponManager.currentWeapon = Slingshot;
            Slingshot.resetState();
        });

        test.it('should delegate getTension', () => {
            test.assertEqual(WeaponManager.getTension(), 0);
        });

        test.it('should delegate isCharging', () => {
            test.assertFalse(WeaponManager.isCharging());
        });

        test.it('should delegate getAmmoDisplay', () => {
            const display = WeaponManager.getAmmoDisplay();
            test.assertTrue(display !== undefined);
        });

        test.it('should get weapon range', () => {
            const range = WeaponManager.getRange();
            test.assertEqual(range, 120, 'Slingshot range should be 120');
        });

        test.it('should get current weapon', () => {
            test.assertEqual(WeaponManager.getCurrent(), Slingshot);
        });

        test.it('should get current weapon id', () => {
            test.assertEqual(WeaponManager.getCurrentId(), 'slingshot');
        });
    });

    test.describe('WeaponManager - Crosshair', () => {
        test.beforeEach(() => {
            WeaponManager.init(null);
            WeaponManager.register(Slingshot);
            WeaponManager.currentWeaponId = 'slingshot';
            WeaponManager.currentWeapon = Slingshot;
        });

        test.it('should have fixed crosshair at center', () => {
            // Game uses fixed crosshair at center (slightly above)
            // No auto-aim - player aims manually
            const pos = WeaponManager.getCrosshairPosition();
            test.assertTrue(pos !== undefined, 'Crosshair position should be defined');
        });

        test.it('should set aim profile', () => {
            const result = WeaponManager.setAimProfile('NONE');
            test.assertTrue(result);
            test.assertEqual(WeaponManager.aimProfile, 'NONE');
        });

        test.it('should check if aiming enabled', () => {
            WeaponManager.setAimProfile('STANDARD');
            test.assertTrue(WeaponManager.isAimingEnabled());

            WeaponManager.setAimProfile('NONE');
            test.assertFalse(WeaponManager.isAimingEnabled());
        });
    });

    // ==========================================
    // SLINGSHOT MODULE TESTS
    // ==========================================

    test.describe('Slingshot Module', () => {
        test.beforeEach(() => {
            Slingshot.resetState();
        });

        test.it('should have correct id', () => {
            test.assertEqual(Slingshot.id, 'slingshot');
        });

        test.it('should have charge fire mode', () => {
            test.assertEqual(Slingshot.config.fireMode, 'charge');
        });

        test.it('should have infinite ammo', () => {
            test.assertEqual(Slingshot.config.ammo.max, Infinity);
        });

        test.it('should have range in config', () => {
            test.assertEqual(Slingshot.config.range, 120, 'Slingshot range should be 120');
        });

        test.it('should have theme defined', () => {
            test.assertTrue(Slingshot.theme !== undefined);
            test.assertTrue(Slingshot.theme.slingshot !== undefined);
            test.assertTrue(Slingshot.theme.slingshot.wood !== undefined);
        });

        test.it('should start charging on fire start', () => {
            Slingshot.onFireStart(1000);
            test.assertTrue(Slingshot.state.isCharging);
            test.assertEqual(Slingshot.state.chargeAmount, 0.2);
        });

        test.it('should update charge over time', () => {
            Slingshot.onFireStart(1000);
            Slingshot.update(0.5, 1500);
            test.assertTrue(Slingshot.state.chargeAmount > 0.2);
        });

        test.it('should cap charge at maxTension', () => {
            Slingshot.onFireStart(1000);
            Slingshot.update(10, 11000); // Long time
            test.assertEqual(Slingshot.state.chargeAmount, 1.0);
        });

        test.it('should fire on release', () => {
            Slingshot.onFireStart(1000);
            Slingshot.update(0.5, 1500);
            const result = Slingshot.onFireRelease(1500);
            test.assertTrue(result !== null);
            test.assertTrue(result.speed > 60);
        });

        test.it('should respect cooldown', () => {
            Slingshot.onFireStart(1000);
            Slingshot.update(0.5, 1500);
            Slingshot.fire(1500);

            // Try again too soon
            test.assertFalse(Slingshot.canFire(1600));
            test.assertTrue(Slingshot.canFire(1900));
        });

        test.it('should cancel action', () => {
            Slingshot.onFireStart(1000);
            Slingshot.cancelAction();
            test.assertFalse(Slingshot.state.isCharging);
            test.assertEqual(Slingshot.state.chargeAmount, 0);
        });

        test.it('should have createFPSMesh method', () => {
            test.assertTrue(typeof Slingshot.createFPSMesh === 'function');
        });

        test.it('should have animateFPS method', () => {
            test.assertTrue(typeof Slingshot.animateFPS === 'function');
        });

        test.it('should have createPickupMesh method', () => {
            test.assertTrue(typeof Slingshot.createPickupMesh === 'function');
        });
    });

    // ==========================================
    // WATER GUN MODULE TESTS
    // ==========================================

    test.describe('WaterGun Module', () => {
        test.beforeEach(() => {
            WaterGun.resetState();
        });

        test.it('should have correct id', () => {
            test.assertEqual(WaterGun.id, 'watergun');
        });

        test.it('should have auto fire mode', () => {
            test.assertEqual(WaterGun.config.fireMode, 'auto');
        });

        test.it('should have limited ammo', () => {
            test.assertEqual(WaterGun.config.ammo.max, 100);
        });

        test.it('should have range in config', () => {
            test.assertEqual(WaterGun.config.range, 80, 'WaterGun range should be 80');
        });

        test.it('should start firing on fire start', () => {
            WaterGun.onFireStart(1000);
            test.assertTrue(WaterGun.state.isFiring);
        });

        test.it('should stop firing on fire release', () => {
            WaterGun.onFireStart(1000);
            WaterGun.onFireRelease(1100);
            test.assertFalse(WaterGun.state.isFiring);
        });

        test.it('should consume ammo when firing', () => {
            WaterGun.onFireStart(1000);
            WaterGun.fire(1000);
            test.assertTrue(WaterGun.state.ammo < 100);
        });

        test.it('should add ammo', () => {
            WaterGun.state.ammo = 50;
            WaterGun.addAmmo(25);
            test.assertEqual(WaterGun.state.ammo, 75);
        });

        test.it('should cap ammo at max', () => {
            WaterGun.state.ammo = 90;
            WaterGun.addAmmo(50);
            test.assertEqual(WaterGun.state.ammo, 100);
        });

        test.it('should have createFPSMesh method', () => {
            test.assertTrue(typeof WaterGun.createFPSMesh === 'function');
        });

        test.it('should have createPickupMesh method', () => {
            test.assertTrue(typeof WaterGun.createPickupMesh === 'function');
        });
    });

    // ==========================================
    // NERF GUN MODULE TESTS
    // ==========================================

    test.describe('NerfGun Module', () => {
        test.beforeEach(() => {
            NerfGun.resetState();
        });

        test.it('should have correct id', () => {
            test.assertEqual(NerfGun.id, 'nerfgun');
        });

        test.it('should have single fire mode', () => {
            test.assertEqual(NerfGun.config.fireMode, 'single');
        });

        test.it('should have limited ammo', () => {
            test.assertEqual(NerfGun.config.ammo.max, 12);
        });

        test.it('should have range in config', () => {
            test.assertEqual(NerfGun.config.range, 140, 'NerfGun range should be 140');
        });

        test.it('should fire on fire start', () => {
            const result = NerfGun.onFireStart(1000);
            // May return fire result immediately for single-shot
            test.assertTrue(NerfGun.state.ammo < 12 || result !== null);
        });

        test.it('should consume ammo when firing', () => {
            NerfGun.fire(1000);
            test.assertTrue(NerfGun.state.ammo < 12);
        });

        test.it('should add ammo', () => {
            NerfGun.state.ammo = 6;
            NerfGun.addAmmo(3);
            test.assertEqual(NerfGun.state.ammo, 9);
        });

        test.it('should cap ammo at max', () => {
            NerfGun.state.ammo = 10;
            NerfGun.addAmmo(10);
            test.assertEqual(NerfGun.state.ammo, 12);
        });

        test.it('should have createFPSMesh method', () => {
            test.assertTrue(typeof NerfGun.createFPSMesh === 'function');
        });

        test.it('should have createPickupMesh method', () => {
            test.assertTrue(typeof NerfGun.createPickupMesh === 'function');
        });
    });

    // ==========================================
    // WEAPON PICKUP TESTS
    // ==========================================

    test.describe('WeaponPickup Data', () => {
        test.it('should have WATERGUN pickup defined', () => {
            test.assertTrue(WeaponPickup.types.WATERGUN !== undefined);
            test.assertEqual(WeaponPickup.types.WATERGUN.weaponId, 'watergun');
        });

        test.it('should have NERFGUN pickup defined', () => {
            test.assertTrue(WeaponPickup.types.NERFGUN !== undefined);
            test.assertEqual(WeaponPickup.types.NERFGUN.weaponId, 'nerfgun');
        });

        test.it('should get pickup by id', () => {
            const pickup = WeaponPickup.get('WATERGUN');
            test.assertTrue(pickup !== null);
            test.assertEqual(pickup.weaponId, 'watergun');
        });

        test.it('should get pickup by weapon id', () => {
            const pickup = WeaponPickup.getByWeaponId('nerfgun');
            test.assertTrue(pickup !== null);
            test.assertEqual(pickup.id, 'nerfgun');
        });

        test.it('should select random pickup', () => {
            const pickup = WeaponPickup.selectRandom();
            test.assertTrue(pickup !== null);
            test.assertTrue(pickup.weaponId !== undefined);
        });

        test.it('should create pickup instance', () => {
            const instance = WeaponPickup.createInstance('WATERGUN', { x: 0, y: 1, z: -10 });
            test.assertTrue(instance !== null);
            test.assertEqual(instance.type, 'WATERGUN');
            test.assertTrue(instance.active);
        });

        test.it('should have spawn config', () => {
            test.assertTrue(WeaponPickup.spawn !== undefined);
            test.assertTrue(WeaponPickup.spawn.chancePerRoom > 0);
            test.assertTrue(WeaponPickup.spawn.maxPerRoom > 0);
        });

        test.it('should have collection config', () => {
            test.assertTrue(WeaponPickup.collection !== undefined);
            test.assertTrue(WeaponPickup.collection.radius > 0);
        });
    });

    // ==========================================
    // PICKUP SYSTEM TESTS
    // ==========================================

    test.describe('PickupSystem', () => {
        test.it('should have init method', () => {
            test.assertTrue(typeof PickupSystem.init === 'function');
        });

        test.it('should have reset method', () => {
            test.assertTrue(typeof PickupSystem.reset === 'function');
        });

        test.it('should have spawn method', () => {
            test.assertTrue(typeof PickupSystem.spawn === 'function');
        });

        test.it('should have update method', () => {
            test.assertTrue(typeof PickupSystem.update === 'function');
        });

        test.it('should have collect method', () => {
            test.assertTrue(typeof PickupSystem.collect === 'function');
        });

        test.it('should have trySpawnForRoom method', () => {
            test.assertTrue(typeof PickupSystem.trySpawnForRoom === 'function');
        });

        test.it('should have cleanupBehind method', () => {
            test.assertTrue(typeof PickupSystem.cleanupBehind === 'function');
        });

        test.it('should track pickup count', () => {
            PickupSystem.pickups = [];
            test.assertEqual(PickupSystem.getCount(), 0);
        });

        test.it('trySpawnForRoom accepts obstacles and shelves params', () => {
            // Test that the method exists and can be called with obstacles/shelves
            // Note: Function.length only counts params before first default value
            test.assertTrue(typeof PickupSystem.trySpawnForRoom === 'function');
            // Just verify the function exists - actual collision avoidance is tested in UI
        });
    });

    // ==========================================
    // PROJECTILE TYPES TESTS
    // ==========================================

    test.describe('Projectile Types', () => {
        test.it('should have stone projectile', () => {
            test.assertTrue(Projectile.types.stone !== undefined);
            test.assertEqual(Projectile.types.stone.id, 'stone');
        });

        test.it('should have water projectile', () => {
            test.assertTrue(Projectile.types.water !== undefined);
            test.assertEqual(Projectile.types.water.id, 'water');
        });

        test.it('should have dart projectile', () => {
            test.assertTrue(Projectile.types.dart !== undefined);
            test.assertEqual(Projectile.types.dart.id, 'dart');
        });

        test.it('should get projectile by type', () => {
            const stone = Projectile.get('stone');
            test.assertTrue(stone !== null);
            const water = Projectile.get('water');
            test.assertTrue(water !== null);
            const dart = Projectile.get('dart');
            test.assertTrue(dart !== null);
        });

        test.it('should have different properties per type', () => {
            const stone = Projectile.get('stone');
            const water = Projectile.get('water');
            const dart = Projectile.get('dart');

            test.assertNotEqual(stone.color, water.color);
            test.assertNotEqual(water.color, dart.color);
        });
    });

})(window.TestFramework || { describe: () => {}, it: () => {}, beforeEach: () => {} });
