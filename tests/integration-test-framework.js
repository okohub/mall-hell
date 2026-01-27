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
         * Setup combat scenario with enemy at specified distance
         * @param {Object} options - { weapon, enemyType, distance, enemyHealth }
         * @returns {Promise<Object>} { enemy, weapon, player }
         */
        async setupCombatScenario(options) {
            const { weapon = 'slingshot', enemyType = 'SKELETON', distance = 20, enemyHealth = null } = options;

            const runner = this.runner;

            // Start game
            runner.resetGame();
            await runner.wait(100);
            runner.simulateClick(runner.getElement('#start-btn'));
            await runner.wait(300);

            // Position player at origin
            await this.positionPlayerAt(0, 0, 0);

            // Spawn enemy at distance (negative Z = forward)
            const enemy = await this.spawnEnemyAt(0, -distance, enemyType, enemyHealth);

            // Equip weapon
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const THREE = runner.gameWindow.THREE;
            const MaterialsTheme = runner.gameWindow.MaterialsTheme;
            const camera = runner.gameWindow.camera;

            // Switch to requested weapon if not already equipped
            if (WeaponOrchestrator.currentWeapon?.config?.id !== weapon) {
                WeaponOrchestrator.equip(weapon, THREE, MaterialsTheme, camera);
            }

            // Reset weapon state for clean test
            const weaponInstance = WeaponOrchestrator.currentWeapon;
            if (weaponInstance) {
                if (weaponInstance.reset) {
                    weaponInstance.reset();
                }
                // Clear cooldown to ensure weapon can fire immediately
                // Set lastFireTime far in the past so cooldown is definitely passed
                if (weaponInstance.state) {
                    weaponInstance.state.lastFireTime = Date.now() - 10000; // 10 seconds ago
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

            // Add to scene and enemies array via fast-forward
            const scene = runner.gameWindow.scene;
            scene.add(enemy);
            runner.gameWindow.enemies.push(enemy);

            // Fast-forward to apply state
            for (let i = 0; i < 5; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }

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
            const camera = runner.gameWindow.camera;
            const playerCart = runner.gameWindow.playerCart;

            // Set positions
            camera.position.set(x, 2, z);
            if (playerCart) {
                playerCart.position.set(x, 0, z);
                if (rotation !== undefined) {
                    playerCart.rotation.y = rotation;
                }
            }

            // Fast-forward to apply
            for (let i = 0; i < 5; i++) {
                if (runner.gameWindow.manualUpdate) {
                    runner.gameWindow.manualUpdate(0.016);
                }
            }
        },

        /**
         * Fire weapon with optional charge time
         * @param {number} chargeTime - Milliseconds to charge (0 for instant)
         * @returns {Promise<Object>} Projectile reference
         */
        async fireWeapon(chargeTime = 0) {
            const runner = this.runner;

            // Clear weapon cooldown to ensure it can fire
            const WeaponOrchestrator = runner.gameWindow.WeaponOrchestrator;
            const weapon = WeaponOrchestrator.currentWeapon;
            if (weapon && weapon.state) {
                weapon.state.lastFireTime = Date.now() - 10000; // 10 seconds ago
            }

            // Start charging
            runner.gameWindow.startCharging();

            // Wait and run updates for charge time
            if (chargeTime > 0) {
                const frames = Math.ceil(chargeTime / 16);
                for (let i = 0; i < frames; i++) {
                    if (runner.gameWindow.manualUpdate) {
                        runner.gameWindow.manualUpdate(0.016);
                    }
                    await runner.wait(16);
                }
            }

            // Release and fire
            runner.gameWindow.releaseAndFire();

            // Wait one frame for projectile to spawn
            await runner.wait(16);

            // Get most recent projectile
            const projectiles = runner.gameWindow.getProjectiles ? runner.gameWindow.getProjectiles() : [];
            return projectiles[projectiles.length - 1] || null;
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
            const projectiles = runner.gameWindow.getProjectiles ? runner.gameWindow.getProjectiles() : [];
            const enemies = runner.gameWindow.getEnemies ? runner.gameWindow.getEnemies() : [];

            // Record initial enemy health values
            const initialHealthMap = new Map();
            enemies.forEach(e => {
                if (e.userData && e.userData.active) {
                    initialHealthMap.set(e, e.userData.health);
                }
            });

            const initialProjectileCount = projectiles.filter(p => p.active !== false).length;
            let hitResult = { hit: false, target: null };

            const conditionMet = await this.waitForCondition(() => {
                const currentProjectiles = runner.gameWindow.getProjectiles ? runner.gameWindow.getProjectiles() : [];
                const currentEnemies = runner.gameWindow.getEnemies ? runner.gameWindow.getEnemies() : [];

                // Check if any enemy took damage (indicates hit)
                for (const enemy of currentEnemies) {
                    if (enemy.userData && enemy.userData.active) {
                        const initialHealth = initialHealthMap.get(enemy);
                        if (initialHealth !== undefined && enemy.userData.health < initialHealth) {
                            hitResult = { hit: true, target: enemy };
                            return true;
                        }
                    }
                }

                // Check if any enemy died (indicates hit)
                for (const enemy of currentEnemies) {
                    const initialHealth = initialHealthMap.get(enemy);
                    if (initialHealth !== undefined && !enemy.userData.active) {
                        hitResult = { hit: true, target: enemy };
                        return true;
                    }
                }

                // Check if all projectiles despawned (missed)
                const activeProjectiles = currentProjectiles.filter(p => p.active !== false);
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
            const health = runner.gameWindow.health || runner.gameWindow.cart?.health || 100;

            if (health !== expected) {
                throw new Error(`Expected health ${expected}, got ${health}`);
            }
        },
    };

    // Attach to window for global access
    window.IntegrationHelpers = IntegrationHelpers;

})(typeof window !== 'undefined' ? window : global);
