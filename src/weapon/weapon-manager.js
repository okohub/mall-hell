// ============================================
// WEAPON MANAGER - Thin Orchestrator
// ============================================
// Maintains weapon registry, tracks current weapon, delegates operations.
// Each weapon is self-contained with its own logic, mesh, and animation.

const WeaponManager = {
    // ==========================================
    // STATE
    // ==========================================

    weapons: {},           // Registry of all weapons { id: weaponModule }
    currentWeaponId: null, // Currently equipped weapon ID
    currentWeapon: null,   // Reference to current weapon module

    // Scene references
    scene: null,
    camera: null,

    // FPS mesh management
    fpsMesh: null,         // Current weapon's FPS mesh (attached to camera)
    fpsRefs: null,         // Current weapon's FPS animation references

    // Aiming state (shared across weapons)
    aimProfile: 'STANDARD',
    crosshairX: 0,
    crosshairY: 0,
    lockedTarget: null,
    aimAssistActive: false,

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the weapon manager
     * @param {Object} scene - THREE.js scene
     */
    init(scene) {
        this.scene = scene;
        this.weapons = {};
        this.currentWeaponId = null;
        this.currentWeapon = null;
        this.fpsMesh = null;
        this.fpsRefs = null;
        this.crosshairX = window.innerWidth / 2;
        this.crosshairY = window.innerHeight / 2;
        this.lockedTarget = null;
        this.aimAssistActive = false;
    },

    /**
     * Register a weapon module
     * @param {Object} weapon - Weapon module implementing the weapon interface
     */
    register(weapon) {
        if (!weapon || !weapon.id) {
            console.error('WeaponManager: Cannot register weapon without id');
            return false;
        }
        this.weapons[weapon.id] = weapon;
        return true;
    },

    /**
     * Equip a weapon by ID
     * @param {string} weaponId - ID of weapon to equip
     * @param {Object} THREE - Three.js library
     * @param {Object} materials - MaterialsTheme for mesh creation
     * @param {Object} camera - Camera to attach FPS mesh to
     * @returns {boolean} Success
     */
    equip(weaponId, THREE, materials, camera) {
        const weapon = this.weapons[weaponId];
        if (!weapon) {
            console.error(`WeaponManager: Unknown weapon '${weaponId}'`);
            return false;
        }

        // Unequip current weapon
        if (this.currentWeapon && this.currentWeapon.onUnequip) {
            this.currentWeapon.onUnequip();
        }

        // Remove current FPS mesh from camera
        if (this.fpsMesh && camera) {
            camera.remove(this.fpsMesh);
            this.fpsMesh = null;
            this.fpsRefs = null;
        }

        // Set new weapon
        this.currentWeaponId = weaponId;
        this.currentWeapon = weapon;
        this.camera = camera;

        // Reset weapon state
        if (weapon.resetState) {
            weapon.resetState();
        }

        // Create and attach FPS mesh
        if (weapon.createFPSMesh && camera && THREE) {
            const result = weapon.createFPSMesh(THREE, materials);
            if (result) {
                this.fpsMesh = result.weapon || result;
                this.fpsRefs = result;
                camera.add(this.fpsMesh);
                this.fpsMesh.visible = false; // Hidden until gameplay starts
            }
        }

        // Call onEquip
        if (weapon.onEquip) {
            weapon.onEquip();
        }

        return true;
    },

    /**
     * Get currently equipped weapon
     * @returns {Object} Current weapon module
     */
    getCurrent() {
        return this.currentWeapon;
    },

    /**
     * Get current weapon ID
     * @returns {string} Current weapon ID
     */
    getCurrentId() {
        return this.currentWeaponId;
    },

    // ==========================================
    // INPUT DELEGATION (to current weapon)
    // ==========================================

    /**
     * Handle fire button press
     * @param {number} time - Current timestamp
     */
    onFireStart(time) {
        if (!this.currentWeapon) return;
        if (this.currentWeapon.onFireStart) {
            this.currentWeapon.onFireStart(time);
        }
    },

    /**
     * Handle fire button release
     * @param {number} time - Current timestamp
     * @returns {Object|null} Fire result if weapon fires
     */
    onFireRelease(time) {
        if (!this.currentWeapon) return null;
        if (this.currentWeapon.onFireRelease) {
            return this.currentWeapon.onFireRelease(time);
        }
        return null;
    },

    /**
     * Update weapon (called each frame)
     * @param {number} dt - Delta time in seconds
     * @param {number} time - Current timestamp
     */
    update(dt, time) {
        if (!this.currentWeapon) return;
        if (this.currentWeapon.update) {
            this.currentWeapon.update(dt, time);
        }
    },

    /**
     * Cancel current action (e.g., cancel charge)
     */
    cancelAction() {
        if (!this.currentWeapon) return;
        if (this.currentWeapon.cancelAction) {
            this.currentWeapon.cancelAction();
        }
    },

    // ==========================================
    // FIRING DELEGATION
    // ==========================================

    /**
     * Check if weapon can fire
     * @param {number} time - Current timestamp
     * @returns {boolean}
     */
    canFire(time) {
        if (!this.currentWeapon) return false;
        if (this.currentWeapon.canFire) {
            return this.currentWeapon.canFire(time);
        }
        return false;
    },

    /**
     * Fire the weapon
     * @param {number} time - Current timestamp
     * @returns {Object|null} Fire result with speed, damage, projectileType
     */
    fire(time) {
        if (!this.currentWeapon) return null;
        if (this.currentWeapon.fire) {
            return this.currentWeapon.fire(time);
        }
        return null;
    },

    // ==========================================
    // ANIMATION DELEGATION
    // ==========================================

    /**
     * Animate FPS weapon
     * @param {number} dt - Delta time in seconds
     */
    animateFPS(dt) {
        if (!this.currentWeapon || !this.fpsRefs) return;
        if (this.currentWeapon.animateFPS) {
            this.currentWeapon.animateFPS(this.fpsRefs, dt);
        }
    },

    /**
     * Update FPS weapon transform (lean/sway)
     * @param {number} turnRate - Current turn rate
     */
    updateTransform(turnRate) {
        if (!this.currentWeapon || !this.fpsMesh) return;
        if (this.currentWeapon.updateTransform) {
            this.currentWeapon.updateTransform(this.fpsMesh, turnRate);
        }
    },

    /**
     * Trigger fire animation
     */
    triggerFireAnim() {
        if (!this.currentWeapon) return;
        if (this.currentWeapon.triggerFireAnim) {
            this.currentWeapon.triggerFireAnim();
        }
    },

    /**
     * Check if fire animation is playing
     * @returns {boolean}
     */
    isFireAnimPlaying() {
        if (!this.currentWeapon) return false;
        if (this.currentWeapon.isFireAnimPlaying) {
            return this.currentWeapon.isFireAnimPlaying();
        }
        return false;
    },

    // ==========================================
    // STATE QUERIES
    // ==========================================

    /**
     * Get current tension (for charge weapons)
     * @returns {number}
     */
    getTension() {
        if (!this.currentWeapon) return 0;
        if (this.currentWeapon.getTension) {
            return this.currentWeapon.getTension();
        }
        return 0;
    },

    /**
     * Get max tension for current weapon
     * @returns {number}
     */
    getMaxTension() {
        if (!this.currentWeapon) return 1.0;
        if (this.currentWeapon.config && this.currentWeapon.config.charge) {
            return this.currentWeapon.config.charge.maxTension;
        }
        return 1.0;
    },

    /**
     * Check if currently charging
     * @returns {boolean}
     */
    isCharging() {
        if (!this.currentWeapon) return false;
        if (this.currentWeapon.state) {
            return this.currentWeapon.state.isCharging || false;
        }
        return false;
    },

    /**
     * Get ammo display string
     * @returns {string}
     */
    getAmmoDisplay() {
        if (!this.currentWeapon) return '';
        if (this.currentWeapon.getAmmoDisplay) {
            return this.currentWeapon.getAmmoDisplay();
        }
        return '';
    },

    /**
     * Check if currently reloading
     * @param {number} time - Current timestamp
     * @returns {boolean}
     */
    isReloading(time) {
        if (!this.currentWeapon) return false;
        if (this.currentWeapon.isReloading) {
            return this.currentWeapon.isReloading(time);
        }
        return false;
    },

    /**
     * Get projectile config for current weapon
     * @returns {Object}
     */
    getProjectileConfig() {
        if (!this.currentWeapon) return null;
        if (this.currentWeapon.config && this.currentWeapon.config.projectile) {
            return this.currentWeapon.config.projectile;
        }
        return null;
    },

    /**
     * Check if aim assist is enabled for current weapon
     * @returns {boolean}
     */
    getAimAssistEnabled() {
        if (!this.currentWeapon) return false;
        if (this.currentWeapon.config) {
            return this.currentWeapon.config.aimAssist || false;
        }
        return false;
    },

    // ==========================================
    // AMMO MANAGEMENT
    // ==========================================

    /**
     * Add ammo to current weapon
     * @param {number} amount - Amount to add
     */
    addAmmo(amount) {
        if (!this.currentWeapon) return;
        if (this.currentWeapon.addAmmo) {
            this.currentWeapon.addAmmo(amount);
        }
    },

    /**
     * Get current ammo count
     * @returns {number}
     */
    getAmmo() {
        if (!this.currentWeapon) return 0;
        if (this.currentWeapon.config && this.currentWeapon.config.ammo) {
            return this.currentWeapon.state?.ammo ?? this.currentWeapon.config.ammo.current;
        }
        return Infinity;
    },

    // ==========================================
    // AIMING (Shared across weapons)
    // ==========================================

    /**
     * Set aim profile
     * @param {string} profileId - Profile ID ('STANDARD', 'NONE')
     */
    setAimProfile(profileId) {
        if (typeof Weapon !== 'undefined' && Weapon.aimProfiles[profileId]) {
            this.aimProfile = profileId;
            return true;
        }
        return false;
    },

    /**
     * Get aim profile config
     * @returns {Object}
     */
    getAimProfileConfig() {
        if (typeof Weapon !== 'undefined') {
            return Weapon.getAimProfile(this.aimProfile);
        }
        return null;
    },

    /**
     * Check if aiming is enabled
     * @returns {boolean}
     */
    isAimingEnabled() {
        const profile = this.getAimProfileConfig();
        return profile ? profile.enabled : false;
    },

    /**
     * Update crosshair position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    updateCrosshair(x, y) {
        this.crosshairX = x;
        this.crosshairY = y;
    },

    /**
     * Get crosshair position
     * @returns {Object} {x, y}
     */
    getCrosshairPosition() {
        return { x: this.crosshairX, y: this.crosshairY };
    },

    /**
     * Set target lock
     * @param {Object} target - Target object
     */
    setLock(target) {
        this.lockedTarget = target;
        this.aimAssistActive = target !== null;
    },

    /**
     * Clear target lock
     */
    clearLock() {
        this.lockedTarget = null;
        this.aimAssistActive = false;
    },

    /**
     * Get locked target
     * @returns {Object}
     */
    getLockedTarget() {
        return this.lockedTarget;
    },

    /**
     * Check if aim assist is active
     * @returns {boolean}
     */
    isAimAssistActive() {
        return this.aimAssistActive;
    },

    /**
     * Score a potential target (enemy)
     */
    scoreEnemy(enemy, cameraPos, playerPos) {
        const config = this.getAimProfileConfig();
        if (!config || !config.enabled) return -Infinity;

        const zDist = cameraPos.z - enemy.position.z;
        const xDist = Math.abs(enemy.position.x - playerPos.x);
        const isAhead = zDist > 0 && zDist < config.maxRange;
        const inPath = xDist < config.inPathThreshold;

        const scoring = config.scoring.enemy;
        if (isAhead && inPath) {
            return scoring.inPathBonus - zDist * scoring.distancePenalty - xDist * scoring.lateralPenalty;
        } else if (isAhead) {
            return scoring.baseScore - zDist * 2 - xDist * 5;
        }
        return scoring.fallbackScore - Math.sqrt(
            Math.pow(enemy.position.x - cameraPos.x, 2) +
            Math.pow(enemy.position.z - cameraPos.z, 2)
        );
    },

    /**
     * Score a potential target (obstacle)
     */
    scoreObstacle(obstacle, cameraPos, playerPos) {
        const config = this.getAimProfileConfig();
        if (!config || !config.enabled) return -Infinity;

        const zDist = cameraPos.z - obstacle.position.z;
        const xDist = Math.abs(obstacle.position.x - playerPos.x);
        const isAhead = zDist > 0 && zDist < 80;
        const inPath = xDist < config.obstacleInPathThreshold;

        const scoring = config.scoring.obstacle;
        if (isAhead && inPath) {
            return scoring.inPathBonus - zDist * scoring.distancePenalty - xDist * scoring.lateralPenalty;
        } else if (isAhead) {
            return scoring.baseScore - zDist * 2 - xDist * 5;
        }
        return -Infinity;
    },

    /**
     * Check if a target is valid
     */
    isTargetValid(obj, camera, playerPosition, collisionSystem, gridSystem, roomConfig) {
        if (!obj || !obj.userData?.active) return false;
        if (obj.userData.hit) return false;

        const pos = obj.position.clone();
        pos.project(camera);
        if (pos.z >= 1 || pos.z <= 0) return false;

        const zDist = camera.position.z - obj.position.z;
        if (zDist < -10) return false;

        if (collisionSystem && gridSystem && roomConfig) {
            if (!collisionSystem.hasLineOfSight(playerPosition.x, playerPosition.z, obj.position.x, obj.position.z, gridSystem, roomConfig)) {
                return false;
            }
        }

        return true;
    },

    /**
     * Get screen position of a target
     */
    getTargetScreenPos(obj, camera, yOffset = 0) {
        const pos = obj.position.clone();
        pos.y += yOffset;
        pos.project(camera);
        return {
            x: (pos.x * 0.5 + 0.5) * window.innerWidth,
            y: (-pos.y * 0.5 + 0.5) * window.innerHeight
        };
    },

    /**
     * Update aim assist
     */
    updateAim(options) {
        const { camera, playerPosition, enemies, obstacles, collisionSystem, gridSystem, roomConfig, boundsMargin = 50 } = options;

        const aimConfig = this.getAimProfileConfig();
        let crosshairX = this.crosshairX;
        let crosshairY = this.crosshairY;

        if (this.isAimingEnabled() && this.getAimAssistEnabled()) {
            if (this.lockedTarget && aimConfig?.stickyTargeting &&
                this.isTargetValid(this.lockedTarget, camera, playerPosition, collisionSystem, gridSystem, roomConfig)) {
                this.aimAssistActive = true;
                const yOffset = this.lockedTarget.userData.height ? this.lockedTarget.userData.height * 0.4 : 1.5;
                const screenPos = this.getTargetScreenPos(this.lockedTarget, camera, yOffset);
                crosshairX = screenPos.x;
                crosshairY = screenPos.y;
            } else {
                this.clearLock();
                let bestTarget = null;
                let bestScore = -Infinity;

                if (enemies) {
                    enemies.forEach(enemy => {
                        if (!this.isTargetValid(enemy, camera, playerPosition, collisionSystem, gridSystem, roomConfig)) return;
                        const score = this.scoreEnemy(enemy, camera.position, playerPosition);
                        if (score > bestScore) {
                            bestScore = score;
                            bestTarget = enemy;
                        }
                    });
                }

                if (obstacles) {
                    obstacles.forEach(obs => {
                        if (!this.isTargetValid(obs, camera, playerPosition, collisionSystem, gridSystem, roomConfig)) return;
                        const score = this.scoreObstacle(obs, camera.position, playerPosition);
                        if (score > bestScore) {
                            bestScore = score;
                            bestTarget = obs;
                        }
                    });
                }

                if (bestTarget) {
                    this.setLock(bestTarget);
                    const yOffset = bestTarget.userData.height ? bestTarget.userData.height * 0.4 : 1.5;
                    const screenPos = this.getTargetScreenPos(bestTarget, camera, yOffset);
                    crosshairX = screenPos.x;
                    crosshairY = screenPos.y;
                }
            }
        }

        crosshairX = Math.max(boundsMargin, Math.min(window.innerWidth - boundsMargin, crosshairX));
        crosshairY = Math.max(boundsMargin, Math.min(window.innerHeight - boundsMargin, crosshairY));

        this.crosshairX = crosshairX;
        this.crosshairY = crosshairY;

        return {
            crosshairX,
            crosshairY,
            aimAssistActive: this.aimAssistActive
        };
    },

    // ==========================================
    // RESET
    // ==========================================

    /**
     * Reset weapon manager (on game restart)
     */
    reset() {
        if (this.currentWeapon && this.currentWeapon.resetState) {
            this.currentWeapon.resetState();
        }
        this.crosshairX = window.innerWidth / 2;
        this.crosshairY = window.innerHeight / 2;
        this.lockedTarget = null;
        this.aimAssistActive = false;
    },

    /**
     * Show FPS weapon
     */
    showFPSWeapon() {
        if (this.fpsMesh) {
            this.fpsMesh.visible = true;
        }
    },

    /**
     * Hide FPS weapon
     */
    hideFPSWeapon() {
        if (this.fpsMesh) {
            this.fpsMesh.visible = false;
        }
    },

    // ==========================================
    // COMPLETE FIRING PIPELINE
    // ==========================================

    // Last shot timestamp for cooldown tracking
    _lastFireTime: 0,

    // References for projectile creation
    _projectileSystem: null,
    _entitySystem: null,
    _THREE: null,

    /**
     * Set references for projectile creation
     * @param {Object} refs - { ProjectileSystem, EntitySystem, THREE }
     */
    setProjectileRefs(refs) {
        this._projectileSystem = refs.ProjectileSystem;
        this._entitySystem = refs.EntitySystem;
        this._THREE = refs.THREE;
    },

    /**
     * Get last fire time
     * @returns {number}
     */
    getLastFireTime() {
        return this._lastFireTime;
    },

    /**
     * Set last fire time
     * @param {number} time
     */
    setLastFireTime(time) {
        this._lastFireTime = time;
    },

    /**
     * Execute complete fire action
     * Creates projectile and handles all firing logic
     * @param {Object} options - { camera, crosshairX, crosshairY, projectiles (array), scene, onFire (callback) }
     * @returns {Object|null} Created projectile or null
     */
    executeFire(options) {
        const { camera, crosshairX, crosshairY, projectiles, scene, onFire } = options;
        const THREE = this._THREE;

        if (!camera || !THREE) return null;

        const now = Date.now();
        this._lastFireTime = now;

        // Get fire result from weapon
        const fireResult = this.currentWeapon ? this.onFireRelease(now) : null;
        if (!fireResult) return null;

        // Trigger FPS firing animation
        this.triggerFireAnim();

        // Calculate spawn position and direction
        const ProjectileSystem = this._projectileSystem || (typeof window !== 'undefined' ? window.ProjectileSystem : null);
        if (!ProjectileSystem) return null;

        const { spawnPos, direction } = ProjectileSystem.calculateFire(THREE, camera, crosshairX, crosshairY);

        // Apply spread if present (for auto-fire weapons)
        if (fireResult.spread) {
            direction.x += fireResult.spread.x;
            direction.y += fireResult.spread.y;
            direction.normalize();
        }

        // Get weapon config for projectile speed
        const speedMin = this.currentWeapon?.config?.projectile?.speedMin || 60;
        const speedMax = this.currentWeapon?.config?.projectile?.speedMax || 180;

        // Create projectile
        const projectile = ProjectileSystem.createMesh(THREE, direction, spawnPos, fireResult.speed, {
            speedMin,
            speedMax,
            fallbackCamera: camera
        });

        if (projectile) {
            scene.add(projectile);
            if (projectiles) {
                projectiles.push(projectile);
            }
        }

        // Fire callback
        if (onFire) {
            onFire(fireResult, projectile);
        }

        return projectile;
    },

    /**
     * Handle continuous firing (for auto-fire weapons)
     * Call this in update loop
     * @param {number} dt - Delta time
     * @param {Object} options - Same as executeFire options
     * @returns {Object|null} Created projectile if auto-fired
     */
    handleAutoFire(dt, options) {
        if (!this.currentWeapon) return null;

        const now = Date.now();
        const fireResult = this.update(dt, now);

        // For auto-fire weapons, handle fire result from update
        if (fireResult) {
            // Use executeFire-like logic but with fireResult already obtained
            const { camera, crosshairX, crosshairY, projectiles, scene } = options;
            const THREE = this._THREE;

            if (!camera || !THREE) return null;

            this._lastFireTime = now;
            this.triggerFireAnim();

            const ProjectileSystem = this._projectileSystem || (typeof window !== 'undefined' ? window.ProjectileSystem : null);
            if (!ProjectileSystem) return null;

            const { spawnPos, direction } = ProjectileSystem.calculateFire(THREE, camera, crosshairX, crosshairY);

            if (fireResult.spread) {
                direction.x += fireResult.spread.x;
                direction.y += fireResult.spread.y;
                direction.normalize();
            }

            const speedMin = this.currentWeapon?.config?.projectile?.speedMin || 60;
            const speedMax = this.currentWeapon?.config?.projectile?.speedMax || 180;

            const projectile = ProjectileSystem.createMesh(THREE, direction, spawnPos, fireResult.speed, {
                speedMin,
                speedMax,
                fallbackCamera: camera
            });

            if (projectile) {
                scene.add(projectile);
                if (projectiles) {
                    projectiles.push(projectile);
                }
            }

            return projectile;
        }

        return null;
    }
};
