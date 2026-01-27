/**
 * Mall Hell - Integration Test Framework
 * Extends test-framework.js with scenario helpers for end-to-end testing
 */

(function(window) {
    'use strict';

    // Integration test helpers namespace
    const IntegrationHelpers = {
        runner: null,

        init(runner) {
            this.runner = runner;
        },

        /**
         * Ensure WeaponOrchestrator has projectile refs set up
         * Must be called before firing weapons
         */
        ensureProjectileRefs() {
            const runner = this.runner;
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const THREE = runner.gameWindow.THREE;
            const ProjectileOrchestrator = runner.gameWindow.ProjectileOrchestrator;
            const EntityOrchestrator = runner.gameWindow.EntityOrchestrator;

            if (!WeaponOrchestrator._THREE) {
                WeaponOrchestrator.setProjectileRefs({
                    THREE: THREE,
                    ProjectileOrchestrator: ProjectileOrchestrator,
                    EntityOrchestrator: EntityOrchestrator
                });
            }
        },

        /**
         * Create a projectile from a fire result
         * @param {Object} fireResult - Result from weapon fire
         * @param {Object} target - Optional target to aim at (enemy mesh)
         * @returns {Object} Created projectile
         */
        createProjectileFromResult(fireResult, target = null) {
            const runner = this.runner;
            const THREE = runner.gameWindow.THREE;
            const ProjectileOrchestrator = runner.gameWindow.ProjectileOrchestrator;
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const camera = runner.gameWindow.camera;
            const scene = runner.gameWindow.scene;
            // Get projectiles via __gameInternals to ensure we have the real array
            const gi = runner.gameWindow.__gameInternals;
            const projectiles = gi ? gi.getProjectiles() : (runner.gameWindow.projectiles || []);

            // Calculate spawn position
            const spawnPos = ProjectileOrchestrator.calculateSpawnPosition(THREE, camera);

            // Calculate direction - aim at target if provided, otherwise use camera direction
            let direction;
            if (target && target.position) {
                // Aim directly at target center (at enemy hitbox height)
                const targetCenter = new THREE.Vector3(
                    target.position.x,
                    1.2,  // Enemy hitbox center height
                    target.position.z
                );
                direction = new THREE.Vector3().subVectors(targetCenter, spawnPos).normalize();
            } else {
                // Use camera direction (crosshair)
                direction = ProjectileOrchestrator.calculateFireDirection(
                    THREE, camera,
                    runner.gameWindow.innerWidth / 2 || 400,
                    runner.gameWindow.innerHeight / 2 || 300,
                    spawnPos
                );
            }

            // Apply spread if present
            if (fireResult.spread) {
                direction.x += fireResult.spread.x;
                direction.y += fireResult.spread.y;
                direction.normalize();
            }

            // Get weapon config
            const weapon = WeaponOrchestrator.currentWeapon;
            const speedMin = weapon?.config?.projectile?.speed?.min || 60;
            const speedMax = weapon?.config?.projectile?.speed?.max || 180;

            // Create projectile
            const projectile = ProjectileOrchestrator.createMesh(THREE, direction, spawnPos, fireResult.speed, {
                speedMin,
                speedMax,
                fallbackCamera: camera,
                projectileType: fireResult.projectileType || 'stone'
            });

            if (projectile) {
                scene.add(projectile);
                projectiles.push(projectile);
            }

            return projectile;
        },

        /**
         * Setup combat scenario with enemy at specified distance
         * @param {Object} options - { weapon, enemyType, distance, enemyHealth }
         * @returns {Promise<Object>} { enemy, weapon, player }
         */
        async setupCombatScenario(options) {
            const { weapon = 'slingshot', enemyType = 'SKELETON', distance = 20, enemyHealth = null } = options;

            const runner = this.runner;

            // Reset helper state from previous tests
            this._currentTarget = null;

            // CRITICAL: Stop any existing game loop from previous test FIRST
            if (runner.gameWindow.LoopOrchestrator) {
                runner.gameWindow.LoopOrchestrator.stop();
            }

            // Reset game state
            runner.resetGame();
            await runner.wait(100);

            // Start game
            runner.simulateClick(runner.getElement('#start-btn'));

            // CRITICAL: Stop the game loop IMMEDIATELY after start (before wait)
            // This prevents non-deterministic state from game loop running during wait
            if (runner.gameWindow.LoopOrchestrator) {
                runner.gameWindow.LoopOrchestrator.stop();
            }

            // Now wait for UI to settle
            await runner.wait(200);

            // Use default starting position (45, 75) which is center of room (1, 2)
            // ROOM_UNIT = 30, so room (1, 2) has z-range 60-90
            const startX = 45;
            const startZ = 75;
            const ROOM_UNIT = 30;

            // Position player at default start looking forward (negative Z)
            await this.positionPlayerAt(startX, startZ, 0);

            // Calculate enemy position ensuring it stays in a valid room
            // For short distances (<= 12), keep enemy in same room
            // For longer distances, position enemy closer to avoid wall issues
            let enemyZ = startZ - distance;

            // Ensure enemy is at least 3 units from room boundary (margin for collision)
            const roomMinZ = Math.floor(startZ / ROOM_UNIT) * ROOM_UNIT + 3;
            if (enemyZ < roomMinZ) {
                // For very long distances, place enemy at minimum safe position in room
                // This means the test might not test the exact requested distance,
                // but it ensures the projectile can reach the enemy
                enemyZ = roomMinZ;
            }

            const enemy = await this.spawnEnemyAt(startX, enemyZ, enemyType, enemyHealth);

            // Store as current target for automatic aiming
            this._currentTarget = enemy;

            // Equip weapon
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const THREE = runner.gameWindow.THREE;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const camera = runner.gameWindow.camera;

            // Clear any auto-collected pickups that spawned at player location
            // (This prevents flaky tests where pickup collection changes weapon state)
            const PickupOrchestrator = runner.gameWindow.PickupOrchestrator;
            if (PickupOrchestrator?.reset) {
                PickupOrchestrator.reset();
            }

            // Equip the requested weapon
            WeaponOrchestrator.equip(weapon, THREE, MaterialsTheme, camera);

            // Show weapon (game loop normally does this, but we stopped it)
            if (WeaponOrchestrator.showFPSWeapon) {
                WeaponOrchestrator.showFPSWeapon();
            }

            // Force a render update so the new weapon mesh appears
            // (we stopped the game loop, so Three.js won't auto-render)
            if (runner.gameWindow.manualUpdate) {
                runner.gameWindow.manualUpdate(0.016);
            }


            // Ensure projectile refs are set
            this.ensureProjectileRefs();

            // Reset weapon state for clean test
            const weaponInstance = WeaponOrchestrator.currentWeapon;
            if (weaponInstance) {
                if (weaponInstance.reset) {
                    weaponInstance.reset();
                }
                // Clear cooldown
                if (weaponInstance.state) {
                    weaponInstance.state.lastFireTime = 0;
                    weaponInstance.state.isCharging = false;
                    weaponInstance.state.chargeAmount = 0;
                }
            }

            return {
                enemy,
                weapon: weaponInstance,
                player: camera
            };
        },

        /**
         * Spawn enemy at specific position
         * @param {number} x - X position
         * @param {number} z - Z position
         * @param {string} type - Enemy type (SKELETON, DINOSAUR)
         * @param {number} health - Optional health override
         * @returns {Promise<Object>} Enemy mesh
         */
        async spawnEnemyAt(x, z, type, health = null) {
            const runner = this.runner;
            const THREE = runner.gameWindow.THREE;
            const EnemyOrchestrator = runner.gameWindow.EnemyOrchestrator;
            const Enemy = runner.gameWindow.Enemy;

            // Create enemy mesh
            const config = Enemy.types[type];
            const enemy = EnemyOrchestrator.createMesh(THREE, type, x, z);

            // Override health if specified
            if (health !== null) {
                enemy.userData.health = health;
            }

            // Add to scene and enemies array
            const scene = runner.gameWindow.scene;
            scene.add(enemy);

            // Use enemies array directly
            const enemies = runner.gameWindow.enemies || [];
            if (enemies) {
                enemies.push(enemy);
            }

            // Note: We intentionally don't run manualUpdate here to avoid
            // game loop moving the enemy or player unexpectedly

            return enemy;
        },

        /**
         * Position player at specific location
         * @param {number} x - X position
         * @param {number} z - Z position
         * @param {number} rotation - Rotation in radians
         */
        async positionPlayerAt(x, z, rotation = 0) {
            const runner = this.runner;
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const camera = runner.gameWindow.camera;
            const playerCart = runner.gameWindow.playerCart;

            // Set PlayerOrchestrator position (game loop syncs camera/cart from this)
            if (PlayerOrchestrator) {
                PlayerOrchestrator.position = { x: x, z: z };
            }

            // Also directly set camera and cart for immediate effect
            camera.position.set(x, 2, z);
            camera.rotation.set(0, 0, 0);  // Point forward (negative Z)

            if (playerCart) {
                playerCart.position.set(x, 0, z);
                if (rotation !== undefined) {
                    playerCart.rotation.y = rotation;
                }
            }

            // Note: We intentionally don't run manualUpdate here to avoid
            // game loop moving the player away from the set position
        },

        // Store current target for aiming (set by setupCombatScenario)
        _currentTarget: null,

        /**
         * Fire weapon using the game's actual firing system
         * Handles different weapon types:
         * - Charge weapons (slingshot): onFireStart -> charge -> onFireRelease
         * - Single-shot (nerfgun): onFireStart fires immediately
         * - Auto-fire (lasergun): use holdFire() instead
         *
         * @param {number} chargeTime - Milliseconds to charge (0 for instant weapons)
         * @param {Object} target - Optional target to aim at (uses _currentTarget if not provided)
         * @returns {Promise<Object>} Projectile reference
         */
        async fireWeapon(chargeTime = 0, target = null) {
            const runner = this.runner;
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const weapon = WeaponOrchestrator.currentWeapon;

            console.log(`[fireWeapon] Starting fire, weapon=${weapon?.config?.id}, fireMode=${weapon?.config?.fireMode}`);

            if (!weapon) {
                throw new Error('No weapon equipped');
            }

            // Use provided target or fall back to stored target
            const aimTarget = target || this._currentTarget;

            // Ensure refs are set
            this.ensureProjectileRefs();

            // Reset weapon state for clean fire
            weapon.state.lastFireTime = 0;
            weapon.state.isCharging = false;
            weapon.state.chargeAmount = 0;

            const now = Date.now();
            let fireResult = null;
            let projectile = null;

            // Determine weapon type from fireMode config
            const fireMode = weapon.config.fireMode || 'single';
            const isChargeWeapon = fireMode === 'charge';
            const isAutoFire = fireMode === 'auto';
            const isSingleShot = fireMode === 'single' || fireMode === 'burst';

            if (isSingleShot) {
                // Single-shot weapons (NerfGun, WaterGun) fire on onFireStart
                fireResult = weapon.onFireStart(now);
                if (fireResult) {
                    projectile = this.createProjectileFromResult(fireResult, aimTarget);
                }
            } else if (isChargeWeapon) {
                // Charge weapons (Slingshot) need to charge first
                // Start charging
                weapon.onFireStart(now);

                // Force full charge (simplified approach for testing)
                weapon.state.isCharging = true;
                weapon.state.chargeAmount = weapon.config.charge?.maxTension || 1.0;

                // Optionally simulate charge time with game updates
                if (chargeTime > 0) {
                    const chargeFrames = Math.ceil(chargeTime / 16);
                    for (let i = 0; i < chargeFrames; i++) {
                        if (runner.gameWindow.manualUpdate) {
                            runner.gameWindow.manualUpdate(0.016);
                        }
                        await runner.wait(16);
                    }
                }

                // Release to fire - onFireRelease returns fire result for charge weapons
                const releaseTime = Date.now();
                fireResult = weapon.onFireRelease(releaseTime);
                if (!fireResult) {
                    // Diagnostic: why didn't fire work?
                    const canFireResult = weapon.canFire ? weapon.canFire(releaseTime) : 'no canFire method';
                    const ammo = weapon.state?.ammo;
                    const lastFire = weapon.state?.lastFireTime;
                    const cooldown = weapon.config?.cooldown;
                    const isCharging = weapon.state?.isCharging;
                    const chargeAmt = weapon.state?.chargeAmount;
                    console.warn(`[fireWeapon] Charge weapon fire failed: canFire=${canFireResult}, ammo=${ammo}, lastFire=${lastFire}, cooldown=${cooldown}, isCharging=${isCharging}, charge=${chargeAmt}, time=${releaseTime}`);
                }
                if (fireResult) {
                    projectile = this.createProjectileFromResult(fireResult, aimTarget);
                }
            } else if (isAutoFire) {
                // Auto-fire weapons need continuous firing - use holdFire instead
                // But we can try a single shot via startFiring -> update -> stopFiring
                if (runner.gameWindow.startFiring) {
                    runner.gameWindow.startFiring();
                }

                // Run update to trigger auto-fire
                for (let i = 0; i < 10; i++) {
                    if (runner.gameWindow.manualUpdate) {
                        runner.gameWindow.manualUpdate(0.016);
                    }
                    await runner.wait(16);
                }

                if (runner.gameWindow.stopFiring) {
                    runner.gameWindow.stopFiring();
                }

                // Check if projectile was created
                const projectiles = runner.gameWindow.projectiles || [];
                projectile = projectiles[projectiles.length - 1] || null;
            }

            // Wait a frame for projectile to be fully added
            await runner.wait(32);

            console.log(`[fireWeapon] Complete, projectile=${projectile ? 'created' : 'null'}, fireResult=${fireResult ? 'success' : 'null'}`);
            return projectile;
        },

        /**
         * Run game loop until condition is met or timeout
         * @param {Function} condition - Function that returns true when condition met
         * @param {number} maxTime - Maximum time to wait in ms
         * @param {number} frameTime - Time per frame in ms (default 16ms = 60fps)
         * @returns {Promise<boolean>} True if condition met, false if timeout
         */
        async waitForCondition(condition, maxTime = 2000, frameTime = 16) {
            const runner = this.runner;
            const startTime = Date.now();
            const maxFrames = Math.ceil(maxTime / frameTime);

            for (let frame = 0; frame < maxFrames; frame++) {
                // Run game update
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(frameTime / 1000);
                }

                // Check condition
                if (condition()) {
                    return true;
                }

                // Wait for next frame
                await runner.wait(frameTime);

                // Check timeout
                if (Date.now() - startTime >= maxTime) {
                    break;
                }
            }

            return false;
        },

        /**
         * Wait for projectile to hit target or despawn
         * @param {number} maxTime - Max wait time in milliseconds
         * @returns {Promise<Object>} { hit: boolean, target: enemy|null }
         */
        async waitForProjectileImpact(maxTime = 2000) {
            const runner = this.runner;
            const gi = runner.gameWindow.__gameInternals;
            const getProjectiles = () => gi ? gi.getProjectiles() : (runner.gameWindow.projectiles || []);
            const getEnemies = () => gi ? gi.getEnemies() : (runner.gameWindow.enemies || []);

            const projectiles = getProjectiles();
            const enemies = getEnemies();

            // Record initial enemy health values AND keep direct references to track them
            const initialHealthMap = new Map();
            const trackedEnemies = [];
            enemies.forEach(e => {
                if (e.userData && e.userData.active) {
                    initialHealthMap.set(e, e.userData.health);
                    trackedEnemies.push(e);
                }
            });

            const initialProjectileCount = projectiles.filter(p => p.userData && p.userData.active !== false).length;
            let hitResult = { hit: false, target: null };

            const conditionMet = await this.waitForCondition(() => {
                const currentProjectiles = getProjectiles();

                // Check tracked enemies directly (even if removed from array)
                for (const enemy of trackedEnemies) {
                    const initialHealth = initialHealthMap.get(enemy);
                    if (initialHealth !== undefined) {
                        // Check if took damage
                        if (enemy.userData.health < initialHealth) {
                            hitResult = { hit: true, target: enemy };
                            return true;
                        }
                        // Check if died (could be removed from array already)
                        if (!enemy.userData.active) {
                            hitResult = { hit: true, target: enemy };
                            return true;
                        }
                    }
                }

                // Check if all projectiles despawned (missed)
                const activeProjectiles = currentProjectiles.filter(p => p.userData && p.userData.active !== false);
                if (initialProjectileCount > 0 && activeProjectiles.length === 0) {
                    hitResult = { hit: false, target: null };
                    return true;
                }

                return false;
            }, maxTime);

            return hitResult;
        },

        /**
         * Wait for enemy to die (active = false)
         * @param {Object} enemy - Enemy mesh
         * @param {number} maxTime - Max wait time in milliseconds
         * @throws {Error} If timeout
         */
        async waitForEnemyDeath(enemy, maxTime = 3000) {
            const conditionMet = await this.waitForCondition(() => {
                return !enemy.userData.active;
            }, maxTime);

            if (!conditionMet) {
                throw new Error(`Enemy did not die within ${maxTime}ms`);
            }
        },

        /**
         * Get enemies in specific room
         * @param {number} roomX - Room X coordinate
         * @param {number} roomZ - Room Z coordinate
         * @returns {Array} Enemies in room
         */
        getEnemiesInRoom(roomX, roomZ) {
            const runner = this.runner;
            const enemies = runner.gameWindow.enemies || [];
            const ROOM_UNIT = 30; // From game constants

            const roomCenterX = roomX * ROOM_UNIT + ROOM_UNIT / 2;
            const roomCenterZ = roomZ * ROOM_UNIT + ROOM_UNIT / 2;

            return enemies.filter(e => {
                if (!e.userData || !e.userData.active) return false;
                const dx = Math.abs(e.position.x - roomCenterX);
                const dz = Math.abs(e.position.z - roomCenterZ);
                return dx < ROOM_UNIT / 2 && dz < ROOM_UNIT / 2;
            });
        },

        /**
         * Assert player health matches expected
         * @param {number} expected - Expected health value
         * @throws {Error} If mismatch
         */
        assertPlayerHealth(expected) {
            const runner = this.runner;
            const PlayerOrchestrator = runner.gameWindow.PlayerOrchestrator;
            const health = PlayerOrchestrator ? PlayerOrchestrator.health : (runner.gameWindow.health || 100);

            if (health !== expected) {
                throw new Error(`Expected health ${expected}, got ${health}`);
            }
        },

        /**
         * Simulate weapon fire using startFiring/stopFiring (for rapid fire weapons)
         * @param {number} duration - How long to hold fire in ms
         */
        async holdFire(duration) {
            const runner = this.runner;

            // Ensure refs are set
            this.ensureProjectileRefs();

            // Start firing
            if (runner.gameWindow.startFiring) {
                runner.gameWindow.startFiring();
            }

            // Run game loop during fire
            const frames = Math.ceil(duration / 16);
            for (let i = 0; i < frames; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
                await runner.wait(16);
            }

            // Stop firing
            if (runner.gameWindow.stopFiring) {
                runner.gameWindow.stopFiring();
            }
        },
    };

    // Attach to window for global access
    window.IntegrationHelpers = IntegrationHelpers;

})(typeof window !== 'undefined' ? window : global);
