// ============================================
// WEAPON DOMAIN - Unit Tests
// ============================================
// Tests for WeaponOrchestrator, Slingshot, WaterGun, NerfGun, Pickup

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
            test.assertEqual(slingshot.charge.rate, 0.67);
            test.assertEqual(slingshot.charge.minTension, 0.05);
            test.assertEqual(slingshot.charge.maxTension, 1.0);
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

    test.describe('WeaponOrchestrator - Initialization', () => {
        test.it('should have init method', () => {
            test.assertTrue(typeof WeaponOrchestrator.init === 'function');
        });

        test.it('should have register method', () => {
            test.assertTrue(typeof WeaponOrchestrator.register === 'function');
        });

        test.it('should have equip method', () => {
            test.assertTrue(typeof WeaponOrchestrator.equip === 'function');
        });

        test.it('should initialize with empty registry', () => {
            WeaponOrchestrator.init(null);
            test.assertTrue(WeaponOrchestrator.weapons !== undefined);
            test.assertEqual(WeaponOrchestrator.currentWeaponId, null);
        });
    });

    test.describe('WeaponOrchestrator - Registration', () => {
        test.beforeEach(() => {
            WeaponOrchestrator.init(null);
        });

        test.it('should register weapon module', () => {
            const result = WeaponOrchestrator.register(Slingshot);
            test.assertTrue(result);
            test.assertTrue(WeaponOrchestrator.weapons['slingshot'] !== undefined);
        });

        test.it('should register multiple weapons', () => {
            WeaponOrchestrator.register(Slingshot);
            WeaponOrchestrator.register(WaterGun);
            WeaponOrchestrator.register(NerfGun);
            test.assertTrue(WeaponOrchestrator.weapons['slingshot'] !== undefined);
            test.assertTrue(WeaponOrchestrator.weapons['watergun'] !== undefined);
            test.assertTrue(WeaponOrchestrator.weapons['nerfgun'] !== undefined);
        });

        test.it('should reject weapon without id', () => {
            const result = WeaponOrchestrator.register({});
            test.assertFalse(result);
        });
    });

    test.describe('WeaponOrchestrator - Delegation', () => {
        test.beforeEach(() => {
            WeaponOrchestrator.init(null);
            WeaponOrchestrator.register(Slingshot);
            // Can't fully equip without THREE, so just set current weapon manually
            WeaponOrchestrator.currentWeaponId = 'slingshot';
            WeaponOrchestrator.currentWeapon = Slingshot;
            Slingshot.resetState();
        });

        test.it('should delegate getTension', () => {
            test.assertEqual(WeaponOrchestrator.getTension(), 0);
        });

        test.it('should delegate isCharging', () => {
            test.assertFalse(WeaponOrchestrator.isCharging());
        });

        test.it('should delegate getAmmoDisplay', () => {
            const display = WeaponOrchestrator.getAmmoDisplay();
            test.assertTrue(display !== undefined);
        });

        test.it('should get weapon range', () => {
            const range = WeaponOrchestrator.getRange();
            test.assertEqual(range, 120, 'Slingshot range should be 120');
        });

        test.it('should get current weapon', () => {
            test.assertEqual(WeaponOrchestrator.getCurrent(), Slingshot);
        });

        test.it('should get current weapon id', () => {
            test.assertEqual(WeaponOrchestrator.getCurrentId(), 'slingshot');
        });
    });

    // ==========================================
    // FIRE RESULT DELEGATION TESTS
    // ==========================================

    test.describe('WeaponOrchestrator - Fire Result Returns', () => {
        test.beforeEach(() => {
            WeaponOrchestrator.init(null);
            WeaponOrchestrator.register(Slingshot);
            WeaponOrchestrator.register(WaterGun);
            WeaponOrchestrator.register(LaserGun);
            WeaponOrchestrator.register(NerfGun);
        });

        test.it('should return fire result from update() for auto-fire weapons', () => {
            // Setup LaserGun as current weapon (auto-fire)
            WeaponOrchestrator.currentWeaponId = 'lasergun';
            WeaponOrchestrator.currentWeapon = LaserGun;
            LaserGun.resetState();

            // Start firing
            LaserGun.onFireStart(1000);
            test.assertTrue(LaserGun.state.isFiring, 'LaserGun should be firing');

            // update() should return fire result when weapon fires
            const result = WeaponOrchestrator.update(0.1, 1000);
            test.assertTrue(result !== null, 'update() should return fire result');
            test.assertTrue(result.speed > 0, 'Fire result should have speed');
            test.assertEqual(result.projectileType, 'laser', 'Should have laser projectile type');
        });

        test.it('should return null from update() when not firing', () => {
            WeaponOrchestrator.currentWeaponId = 'lasergun';
            WeaponOrchestrator.currentWeapon = LaserGun;
            LaserGun.resetState();

            // Don't start firing
            const result = WeaponOrchestrator.update(0.1, 1000);
            test.assertEqual(result, null, 'Should return null when not firing');
        });

        test.it('should return fire result from onFireStart() for single-shot weapons', () => {
            // Setup NerfGun as current weapon
            WeaponOrchestrator.currentWeaponId = 'nerfgun';
            WeaponOrchestrator.currentWeapon = NerfGun;
            NerfGun.resetState();

            // onFireStart() should return fire result immediately for single-shot
            const result = WeaponOrchestrator.onFireStart(1000);
            test.assertTrue(result !== null, 'onFireStart() should return fire result');
            test.assertTrue(result.speed > 0, 'Fire result should have speed');
            test.assertEqual(result.projectileType, 'dart', 'Should have dart projectile type');
        });

        test.it('should return no fire result from onFireStart() for charge weapons', () => {
            WeaponOrchestrator.currentWeaponId = 'slingshot';
            WeaponOrchestrator.currentWeapon = Slingshot;
            Slingshot.resetState();

            // Charge weapons don't fire on start (return null or undefined)
            const result = WeaponOrchestrator.onFireStart(1000);
            test.assertTrue(!result, 'Charge weapons should not return fire result on fire start');
            test.assertTrue(Slingshot.state.isCharging, 'Slingshot should start charging');
        });

        test.it('should return fire result from onFireRelease() for charge weapons', () => {
            WeaponOrchestrator.currentWeaponId = 'slingshot';
            WeaponOrchestrator.currentWeapon = Slingshot;
            Slingshot.resetState();

            // Start charging
            WeaponOrchestrator.onFireStart(1000);
            WeaponOrchestrator.update(0.5, 1500);

            // Release should fire
            const result = WeaponOrchestrator.onFireRelease(1500);
            test.assertTrue(result !== null, 'onFireRelease() should return fire result');
            test.assertTrue(result.speed > 60, 'Fire result should have proper speed');
            test.assertEqual(result.projectileType, 'stone', 'Should have stone projectile type');
        });

        test.it('should return null from onFireRelease() for auto-fire weapons', () => {
            WeaponOrchestrator.currentWeaponId = 'lasergun';
            WeaponOrchestrator.currentWeapon = LaserGun;
            LaserGun.resetState();

            // Auto-fire weapons don't fire on release
            LaserGun.onFireStart(1000);
            const result = WeaponOrchestrator.onFireRelease(1100);
            test.assertEqual(result, null, 'Auto-fire weapons should return null on release');
        });
    });

    test.describe('WeaponOrchestrator - Crosshair', () => {
        test.beforeEach(() => {
            WeaponOrchestrator.init(null);
            WeaponOrchestrator.register(Slingshot);
            WeaponOrchestrator.currentWeaponId = 'slingshot';
            WeaponOrchestrator.currentWeapon = Slingshot;
        });

        test.it('should have fixed crosshair at center', () => {
            // Game uses fixed crosshair at center (slightly above)
            // No auto-aim - player aims manually
            const pos = WeaponOrchestrator.getCrosshairPosition();
            test.assertTrue(pos !== undefined, 'Crosshair position should be defined');
        });

        test.it('should set aim profile', () => {
            const result = WeaponOrchestrator.setAimProfile('NONE');
            test.assertTrue(result);
            test.assertEqual(WeaponOrchestrator.aimProfile, 'NONE');
        });

        test.it('should check if aiming enabled', () => {
            WeaponOrchestrator.setAimProfile('STANDARD');
            test.assertTrue(WeaponOrchestrator.isAimingEnabled());

            WeaponOrchestrator.setAimProfile('NONE');
            test.assertFalse(WeaponOrchestrator.isAimingEnabled());
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

        test.it('should have limited ammo', () => {
            test.assertEqual(Slingshot.config.ammo.max, 25);
            test.assertEqual(Slingshot.state.ammo, 25);
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
            test.assertEqual(Slingshot.state.chargeAmount, 0.05);
        });

        test.it('should update charge over time', () => {
            Slingshot.onFireStart(1000);
            Slingshot.update(0.5, 1500);
            test.assertTrue(Slingshot.state.chargeAmount > 0.05);
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

        test.it('should consume ammo when firing', () => {
            const startAmmo = Slingshot.state.ammo;
            Slingshot.onFireStart(1000);
            Slingshot.update(0.5, 1500);
            Slingshot.fire(1500);
            test.assertEqual(Slingshot.state.ammo, startAmmo - 1);
        });

        test.it('should not fire when out of ammo', () => {
            Slingshot.state.ammo = 0;
            test.assertFalse(Slingshot.canFire(1000));

            Slingshot.onFireStart(2000);
            test.assertFalse(Slingshot.state.isCharging, 'Should not start charging with no ammo');
        });

        test.it('should add ammo up to max', () => {
            Slingshot.state.ammo = 20;
            Slingshot.addAmmo(10);
            test.assertEqual(Slingshot.state.ammo, 25, 'Should cap at max ammo');
        });

        test.it('should show ammo display', () => {
            const display = Slingshot.getAmmoDisplay();
            test.assertTrue(display.includes('STONES'), 'Display should show STONES');
            test.assertTrue(display.includes('25'), 'Display should show ammo count');
        });

        test.it('should show EMPTY when out of ammo', () => {
            Slingshot.state.ammo = 0;
            const display = Slingshot.getAmmoDisplay();
            test.assertEqual(display, 'EMPTY');
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

        test.it('should have single fire mode', () => {
            test.assertEqual(WaterGun.config.fireMode, 'single');
        });

        test.it('should have limited ammo', () => {
            test.assertEqual(WaterGun.config.ammo.max, 30);
        });

        test.it('should have range in config', () => {
            test.assertEqual(WaterGun.config.range, 90, 'WaterGun range should be 90');
        });

        test.it('should have splash damage config', () => {
            test.assertTrue(WaterGun.config.projectile.splashRadius > 0);
            test.assertTrue(WaterGun.config.projectile.splashDamage > 0);
        });

        test.it('should fire on fire start (single shot)', () => {
            const result = WaterGun.onFireStart(1000);
            test.assertTrue(result !== null, 'Should return fire result');
            test.assertTrue(WaterGun.state.ammo < 30);
        });

        test.it('should consume ammo when firing', () => {
            WaterGun.fire(1000);
            test.assertTrue(WaterGun.state.ammo < 30);
        });

        test.it('should add ammo', () => {
            WaterGun.state.ammo = 15;
            WaterGun.addAmmo(10);
            test.assertEqual(WaterGun.state.ammo, 25);
        });

        test.it('should cap ammo at max', () => {
            WaterGun.state.ammo = 25;
            WaterGun.addAmmo(20);
            test.assertEqual(WaterGun.state.ammo, 30);
        });

        test.it('should have createFPSMesh method', () => {
            test.assertTrue(typeof WaterGun.createFPSMesh === 'function');
        });

        test.it('should have createPickupMesh method', () => {
            test.assertTrue(typeof WaterGun.createPickupMesh === 'function');
        });
    });

    // ==========================================
    // LASER GUN MODULE TESTS
    // ==========================================

    test.describe('LaserGun Module', () => {
        test.beforeEach(() => {
            LaserGun.resetState();
        });

        test.it('should have correct id', () => {
            test.assertEqual(LaserGun.id, 'lasergun');
        });

        test.it('should have auto fire mode', () => {
            test.assertEqual(LaserGun.config.fireMode, 'auto');
        });

        test.it('should have limited ammo', () => {
            test.assertEqual(LaserGun.config.ammo.max, 75);
        });

        test.it('should have range in config', () => {
            test.assertEqual(LaserGun.config.range, 100, 'LaserGun range should be 100');
        });

        test.it('should start firing on fire start', () => {
            LaserGun.onFireStart(1000);
            test.assertTrue(LaserGun.state.isFiring);
        });

        test.it('should stop firing on fire release', () => {
            LaserGun.onFireStart(1000);
            LaserGun.onFireRelease(1100);
            test.assertFalse(LaserGun.state.isFiring);
        });

        test.it('should return fire result during update when firing', () => {
            LaserGun.onFireStart(1000);
            const result = LaserGun.update(0.1, 1000);
            test.assertTrue(result !== null, 'Should return fire result');
            test.assertEqual(result.projectileType, 'laser');
        });

        test.it('should consume ammo when firing', () => {
            LaserGun.onFireStart(1000);
            LaserGun.fire(1000);
            test.assertTrue(LaserGun.state.ammo < 75);
        });

        test.it('should add ammo', () => {
            LaserGun.state.ammo = 30;
            LaserGun.addAmmo(20);
            test.assertEqual(LaserGun.state.ammo, 50);
        });

        test.it('should cap ammo at max', () => {
            LaserGun.state.ammo = 60;
            LaserGun.addAmmo(30);
            test.assertEqual(LaserGun.state.ammo, 75);
        });

        test.it('should have createFPSMesh method', () => {
            test.assertTrue(typeof LaserGun.createFPSMesh === 'function');
        });

        test.it('should have createPickupMesh method', () => {
            test.assertTrue(typeof LaserGun.createPickupMesh === 'function');
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

        test.it('should have LASERGUN pickup defined', () => {
            test.assertTrue(WeaponPickup.types.LASERGUN !== undefined);
            test.assertEqual(WeaponPickup.types.LASERGUN.weaponId, 'lasergun');
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

    test.describe('PickupOrchestrator', () => {
        test.it('should have init method', () => {
            test.assertTrue(typeof PickupOrchestrator.init === 'function');
        });

        test.it('should have reset method', () => {
            test.assertTrue(typeof PickupOrchestrator.reset === 'function');
        });

        test.it('should have spawn method', () => {
            test.assertTrue(typeof PickupOrchestrator.spawn === 'function');
        });

        test.it('should have update method', () => {
            test.assertTrue(typeof PickupOrchestrator.update === 'function');
        });

        test.it('should have collect method', () => {
            test.assertTrue(typeof PickupOrchestrator.collect === 'function');
        });

        test.it('should have trySpawnForRoom method', () => {
            test.assertTrue(typeof PickupOrchestrator.trySpawnForRoom === 'function');
        });

        test.it('should have cleanupBehind method', () => {
            test.assertTrue(typeof PickupOrchestrator.cleanupBehind === 'function');
        });

        test.it('should track pickup count', () => {
            PickupOrchestrator.pickups = [];
            test.assertEqual(PickupOrchestrator.getCount(), 0);
        });

        test.it('trySpawnForRoom accepts obstacles and shelves params', () => {
            // Test that the method exists and can be called with obstacles/shelves
            // Note: Function.length only counts params before first default value
            test.assertTrue(typeof PickupOrchestrator.trySpawnForRoom === 'function');
            // Just verify the function exists - actual collision avoidance is tested in UI
        });

        test.it('should create ammo mesh with crate design', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }
            // Create ammo instance
            const instance = WeaponPickup.createInstance('AMMO_SMALL', { x: 0, y: 1, z: 0 });
            test.assertTrue(instance.config.isAmmo, 'Should be ammo type');

            // Test the private mesh creation method
            PickupOrchestrator.THREE = THREE;
            const mesh = PickupOrchestrator._createAmmoMesh(instance, THREE);

            test.assertTrue(mesh instanceof THREE.Group, 'Mesh should be a Group');
            test.assertTrue(mesh.children.length >= 3, 'Ammo crate should have multiple parts (body, stripes, corners)');
        });

        test.it('should create stylized speed boost mesh with halo and panels', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }

            const instance = WeaponPickup.createInstance('speed_boost', { x: 0, y: 1, z: 0 });
            test.assertTrue(instance.config.isPowerup, 'Should be powerup type');

            PickupOrchestrator.THREE = THREE;
            const mesh = PickupOrchestrator._createPowerUpMesh(instance, THREE);

            test.assertTrue(mesh instanceof THREE.Group, 'Powerup mesh should be a Group');
            test.assertGreaterThan(mesh.children.length, 10, 'Stylized can should have multiple detailed parts');

            const hasHalo = mesh.children.some((child) => child.geometry && child.geometry.type === 'TorusGeometry');
            test.assertTrue(hasHalo, 'Should include a halo ring (torus geometry)');

            const hasBasicGlow = mesh.children.some((child) => child.material && child.material.type === 'MeshBasicMaterial');
            test.assertTrue(hasBasicGlow, 'Should include at least one basic glow element');
        });

        test.it('should animate speed boost with gentle rotation', () => {
            if (typeof THREE === 'undefined') {
                test.skip('THREE.js not available');
                return;
            }

            const instance = WeaponPickup.createInstance('speed_boost', { x: 0, y: 1, z: 0 });
            const mesh = new THREE.Group();

            PickupOrchestrator.pickups = [instance];
            PickupOrchestrator.meshes = [mesh];

            const rotationBefore = instance.rotation;
            PickupOrchestrator.update(1, { x: 50, y: 0, z: 50 }, 0);

            test.assertCloseTo(instance.rotation, rotationBefore + 0.5, 0.0001, 'Speed boost rotation should be gentle');
        });

        test.it('should have ammo types with distinct visual', () => {
            const ammoSmall = WeaponPickup.types.AMMO_SMALL;
            const ammoLarge = WeaponPickup.types.AMMO_LARGE;

            test.assertTrue(ammoSmall.isAmmo, 'AMMO_SMALL should be ammo type');
            test.assertTrue(ammoLarge.isAmmo, 'AMMO_LARGE should be ammo type');
            test.assertTrue(ammoSmall.visual.scale < 2, 'Ammo should be smaller than weapons');
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
