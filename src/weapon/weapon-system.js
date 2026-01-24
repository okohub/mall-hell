// ============================================
// WEAPON SYSTEM - Orchestrator
// ============================================
// Manages weapon state, charging, firing, and aiming
// Uses Weapon data definitions (assumes Weapon is loaded globally)

const WeaponSystem = {
    // Current state
    currentWeaponId: 'SLINGSHOT',
    chargeState: 0,
    isCharging: false,
    lastFireTime: 0,

    // Aiming state
    aimProfile: 'STANDARD',
    lockedTarget: null,
    crosshairX: 0,
    crosshairY: 0,
    aimAssistActive: false,

    // References (set during init)
    weaponData: null,

    /**
     * Initialize the weapon system
     * @param {Object} weaponData - Reference to Weapon data object
     */
    init(weaponData) {
        this.weaponData = weaponData || (typeof Weapon !== 'undefined' ? Weapon : null);
        this.currentWeaponId = 'SLINGSHOT';
        this.aimProfile = 'STANDARD';
        this.crosshairX = window.innerWidth / 2;
        this.crosshairY = window.innerHeight / 2;
        this.reset();
    },

    /**
     * Reset all weapon state
     */
    reset() {
        this.chargeState = 0;
        this.isCharging = false;
        this.lastFireTime = 0;
        this.lockedTarget = null;
        this.aimAssistActive = false;
        this.crosshairX = window.innerWidth / 2;
        this.crosshairY = window.innerHeight / 2;
        this.fireAnim = 0;
    },

    // ==========================================
    // WEAPON METHODS
    // ==========================================

    /**
     * Get current weapon configuration
     */
    getWeaponConfig() {
        if (!this.weaponData) return null;
        return this.weaponData.get(this.currentWeaponId);
    },

    /**
     * Switch to a different weapon
     */
    switchWeapon(weaponId) {
        if (!this.weaponData || !this.weaponData.get(weaponId)) return false;
        this.currentWeaponId = weaponId;
        this.reset();
        return true;
    },

    /**
     * Check if weapon can fire
     */
    canFire(time) {
        const weapon = this.getWeaponConfig();
        if (!weapon) return false;
        return (time - this.lastFireTime) >= weapon.cooldown;
    },

    /**
     * Start charging the weapon
     */
    startCharge() {
        if (this.isCharging) return false;
        const weapon = this.getWeaponConfig();
        if (!weapon || weapon.fireMode !== 'charge') return false;

        this.isCharging = true;
        this.chargeState = weapon.minTension;
        return true;
    },

    /**
     * Update charge state (call each frame while charging)
     */
    updateCharge(dt) {
        if (!this.isCharging) return;
        const weapon = this.getWeaponConfig();
        if (!weapon) return;

        if (this.chargeState < weapon.maxTension) {
            this.chargeState += weapon.chargeRate * dt;
            if (this.chargeState > weapon.maxTension) {
                this.chargeState = weapon.maxTension;
            }
        }
    },

    /**
     * Release charge and get tension value
     */
    releaseCharge() {
        if (!this.isCharging) return null;

        const tension = this.chargeState;
        this.isCharging = false;
        this.chargeState = 0;
        return tension;
    },

    /**
     * Cancel charging without firing
     */
    cancelCharge() {
        this.isCharging = false;
        this.chargeState = 0;
    },

    /**
     * Calculate projectile speed based on tension
     */
    calculateSpeed(tension) {
        const weapon = this.getWeaponConfig();
        if (!weapon) return 0;
        const speed = weapon.projectileSpeed;
        return speed.min + (speed.max - speed.min) * tension;
    },

    /**
     * Fire the weapon
     * @returns {Object|null} Fire result with speed, power, damage or null if can't fire
     */
    fire(time) {
        if (!this.canFire(time)) return null;

        const weapon = this.getWeaponConfig();
        if (!weapon) return null;

        this.lastFireTime = time;

        if (weapon.fireMode === 'charge') {
            const tension = this.releaseCharge();
            if (tension === null || tension < weapon.minTension) return null;
            return {
                speed: this.calculateSpeed(tension),
                power: tension,
                damage: weapon.damage,
                projectileType: weapon.projectile
            };
        }

        // Single fire mode
        return {
            speed: weapon.projectileSpeed.max,
            power: 1.0,
            damage: weapon.damage,
            projectileType: weapon.projectile
        };
    },

    /**
     * Get current tension value
     */
    getTension() {
        return this.chargeState;
    },

    /**
     * Get max tension for current weapon
     */
    getMaxTension() {
        const weapon = this.getWeaponConfig();
        return weapon ? weapon.maxTension : 1.0;
    },

    /**
     * Check if aim assist is enabled for current weapon
     */
    getAimAssistEnabled() {
        const weapon = this.getWeaponConfig();
        return weapon ? weapon.aimAssist : false;
    },

    /**
     * Get projectile configuration for current weapon
     * @returns {Object} Projectile config with size, color, glow settings
     */
    getProjectileConfig() {
        const weapon = this.getWeaponConfig();
        if (!weapon) {
            // Default projectile config
            return {
                size: 0.2,
                color: 0xf39c12,
                glowColor: 0xf39c12,
                glow: true,
                emissiveIntensity: { min: 0.2, max: 0.6 }
            };
        }
        // Get from Projectile definitions if available
        if (typeof Projectile !== 'undefined' && Projectile.types && Projectile.types[weapon.projectile?.toUpperCase()]) {
            return Projectile.types[weapon.projectile.toUpperCase()].visual;
        }
        // Default stone projectile config
        return {
            size: 0.2,
            color: 0xf39c12,
            glowColor: 0xf39c12,
            glow: true,
            emissiveIntensity: { min: 0.2, max: 0.6 }
        };
    },

    // ==========================================
    // AIMING METHODS
    // ==========================================

    /**
     * Set aim profile
     */
    setAimProfile(profileId) {
        if (!this.weaponData) return false;
        const profile = this.weaponData.getAimProfile(profileId);
        if (profile) {
            this.aimProfile = profileId;
            return true;
        }
        return false;
    },

    /**
     * Get current aim profile config
     */
    getAimProfileConfig() {
        if (!this.weaponData) return null;
        return this.weaponData.getAimProfile(this.aimProfile);
    },

    /**
     * Check if aiming is enabled
     */
    isAimingEnabled() {
        const profile = this.getAimProfileConfig();
        return profile ? profile.enabled : false;
    },

    /**
     * Update crosshair position
     */
    updateCrosshair(x, y) {
        this.crosshairX = x;
        this.crosshairY = y;
    },

    /**
     * Get crosshair position
     */
    getCrosshairPosition() {
        return { x: this.crosshairX, y: this.crosshairY };
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
        return -Infinity; // Don't target obstacles behind
    },

    /**
     * Lock onto a target
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
     */
    getLockedTarget() {
        return this.lockedTarget;
    },

    /**
     * Check if aim assist is currently active
     */
    isAimAssistActive() {
        return this.aimAssistActive;
    },

    /**
     * Check if a target object is valid for aiming
     * @param {Object} obj - Target object (enemy or obstacle)
     * @param {Object} camera - Three.js camera
     * @param {Object} playerPosition - Player position {x, z}
     * @param {Object} collisionSystem - CollisionSystem reference
     * @param {Object} gridSystem - Grid system for line-of-sight
     * @param {Object} roomConfig - Room configuration
     * @returns {boolean} True if target is valid
     */
    isTargetValid(obj, camera, playerPosition, collisionSystem, gridSystem, roomConfig) {
        if (!obj || !obj.userData?.active) return false;
        if (obj.userData.hit) return false; // Obstacle already hit

        // Check if in front of camera
        const pos = obj.position.clone();
        pos.project(camera);
        if (pos.z >= 1 || pos.z <= 0) return false;

        // Check if passed behind player
        const zDist = camera.position.z - obj.position.z;
        if (zDist < -10) return false; // Too far behind

        // Check line-of-sight (no walls blocking)
        if (collisionSystem && gridSystem && roomConfig) {
            if (!collisionSystem.hasLineOfSight(playerPosition.x, playerPosition.z, obj.position.x, obj.position.z, gridSystem, roomConfig)) {
                return false; // Wall blocks view
            }
        }

        return true;
    },

    /**
     * Get screen position of a target
     * @param {Object} obj - Target object
     * @param {Object} camera - Three.js camera
     * @param {number} yOffset - Y offset for target center
     * @returns {Object} Screen position {x, y}
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
     * Update aim assist - find and track best target
     * @param {Object} options - Update options
     * @param {Object} options.camera - Three.js camera
     * @param {Object} options.playerPosition - Player position {x, z}
     * @param {Array} options.enemies - Array of enemy objects
     * @param {Array} options.obstacles - Array of obstacle objects
     * @param {Object} options.collisionSystem - CollisionSystem reference
     * @param {Object} options.gridSystem - Grid system for line-of-sight
     * @param {Object} options.roomConfig - Room configuration
     * @param {number} options.boundsMargin - Screen bounds margin
     * @returns {Object} Result {crosshairX, crosshairY, aimAssistActive}
     */
    updateAim(options) {
        const { camera, playerPosition, enemies, obstacles, collisionSystem, gridSystem, roomConfig, boundsMargin = 50 } = options;

        const aimConfig = this.getAimProfileConfig();
        let crosshairX = this.crosshairX;
        let crosshairY = this.crosshairY;

        // Only do aim assist if enabled
        if (this.isAimingEnabled() && this.getAimAssistEnabled()) {
            // Check if current locked target is still valid (sticky targeting)
            if (this.lockedTarget && aimConfig?.stickyTargeting &&
                this.isTargetValid(this.lockedTarget, camera, playerPosition, collisionSystem, gridSystem, roomConfig)) {
                // Keep tracking current target
                this.aimAssistActive = true;
                const yOffset = this.lockedTarget.userData.height ? this.lockedTarget.userData.height * 0.4 : 1.5;
                const screenPos = this.getTargetScreenPos(this.lockedTarget, camera, yOffset);
                crosshairX = screenPos.x;
                crosshairY = screenPos.y;
            } else {
                // Find new best target
                this.clearLock();
                let bestTarget = null;
                let bestScore = -Infinity;

                // Evaluate enemies
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

                // Evaluate obstacles
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

                // Lock onto new target
                if (bestTarget) {
                    this.setLock(bestTarget);
                    const yOffset = bestTarget.userData.height ? bestTarget.userData.height * 0.4 : 1.5;
                    const screenPos = this.getTargetScreenPos(bestTarget, camera, yOffset);
                    crosshairX = screenPos.x;
                    crosshairY = screenPos.y;
                }
            }
        }

        // Keep crosshair within screen bounds
        crosshairX = Math.max(boundsMargin, Math.min(window.innerWidth - boundsMargin, crosshairX));
        crosshairY = Math.max(boundsMargin, Math.min(window.innerHeight - boundsMargin, crosshairY));

        // Update internal state
        this.crosshairX = crosshairX;
        this.crosshairY = crosshairY;

        return {
            crosshairX,
            crosshairY,
            aimAssistActive: this.aimAssistActive
        };
    },

    // ==========================================
    // FPS ANIMATION
    // ==========================================

    // Animation state
    fireAnim: 0,

    /**
     * Animate FPS slingshot based on charging/firing state
     * @param {Object} parts - Weapon parts {pouch, stone, bandL, bandR, hands}
     * @param {number} dt - Delta time
     * @param {boolean} isCharging - Is currently charging
     * @param {number} tension - Current tension (0-1)
     */
    animateFPS(parts, dt, isCharging, tension) {
        const { pouch, stone, bandL, bandR, hands } = parts;

        if (isCharging) {
            // CHARGING: Left hand pulls back based on tension
            const pullBack = tension; // 0 to 1
            const pullZ = pullBack * 0.2;  // Pull back distance
            const pullY = pullBack * 0.03; // Slight upward pull

            // Move pouch and stone back with left hand
            if (pouch) {
                pouch.position.z = 0.08 + pullZ;
                pouch.position.y = 0.02 + pullY;
            }
            if (stone) {
                stone.position.z = 0.08 + pullZ;
                stone.position.y = 0.025 + pullY;
                stone.visible = true;
            }

            // Rubber bands stretch and thin out with tension
            const bandStretch = 1 + pullBack * 1.8;  // Length multiplier
            const bandThin = 1 - pullBack * 0.3;     // Thinner when stretched
            const bandAngle = pullBack * 0.6;        // Angle toward pull point

            if (bandL) {
                bandL.scale.set(bandThin, bandStretch, bandThin);
                bandL.position.z = 0.04 + pullZ * 0.5;
                bandL.rotation.x = 0.3 + bandAngle;
                bandL.rotation.z = 0.1 - pullBack * 0.05;
            }
            if (bandR) {
                bandR.scale.set(bandThin, bandStretch, bandThin);
                bandR.position.z = 0.04 + pullZ * 0.5;
                bandR.rotation.x = 0.3 + bandAngle;
                bandR.rotation.z = -0.1 + pullBack * 0.05;
            }

            // Pull LEFT hand back with pouch (pinching gesture)
            if (hands && hands.userData.leftHand) {
                const leftHand = hands.userData.leftHand;
                leftHand.position.z = -0.15 + pullZ;
                leftHand.position.y = -0.08 + pullY;
                // Tighten pinch as tension increases
                if (leftHand.userData.fingers) {
                    leftHand.userData.fingers[0].rotation.x = 0.8 + pullBack * 0.3;
                }
                if (leftHand.userData.thumb) {
                    leftHand.userData.thumb.rotation.x = 0.4 + pullBack * 0.2;
                }
            }
        } else if (this.fireAnim > 0) {
            // FIRING: Quick release animation - bands snap back
            this.fireAnim -= dt * 8; // Fast snap
            if (this.fireAnim < 0) this.fireAnim = 0;

            const snapProgress = 1 - this.fireAnim; // 0 to 1
            const snapZ = (1 - snapProgress) * 0.08;
            const snapY = (1 - snapProgress) * 0.02;

            // Pouch snaps forward
            if (pouch) {
                pouch.position.z = 0.08 + snapZ;
                pouch.position.y = 0.02 + snapY;
            }
            if (stone) {
                stone.position.z = 0.08 + snapZ;
                stone.position.y = 0.025 + snapY;
                stone.visible = this.fireAnim > 0.7; // Stone disappears quickly (fired)
            }

            // Bands snap back with slight overshoot
            const bandSnap = 1 + (1 - snapProgress) * 0.4;
            const overshoot = snapProgress > 0.8 ? Math.sin((snapProgress - 0.8) * Math.PI * 5) * 0.1 : 0;

            if (bandL) {
                bandL.scale.set(1, bandSnap + overshoot, 1);
                bandL.position.z = 0.04 + snapZ * 0.3;
                bandL.rotation.x = 0.3 + (1 - snapProgress) * 0.3;
            }
            if (bandR) {
                bandR.scale.set(1, bandSnap + overshoot, 1);
                bandR.position.z = 0.04 + snapZ * 0.3;
                bandR.rotation.x = 0.3 + (1 - snapProgress) * 0.3;
            }

            // Left hand follows release
            if (hands && hands.userData.leftHand) {
                const leftHand = hands.userData.leftHand;
                leftHand.position.z = -0.15 + snapZ;
                leftHand.position.y = -0.08 + snapY;
                // Open fingers after release
                if (leftHand.userData.fingers) {
                    leftHand.userData.fingers[0].rotation.x = 0.8 + (1 - snapProgress) * 0.3;
                }
            }
        } else {
            // READY: Reset to ready position
            if (pouch) {
                pouch.position.set(0, 0.02, 0.08);
            }
            if (stone) {
                stone.position.set(0, 0.025, 0.08);
                stone.visible = true;
            }
            if (bandL) {
                bandL.scale.set(1, 1, 1);
                bandL.position.z = 0.04;
                bandL.rotation.set(0.3, 0, 0.1);
            }
            if (bandR) {
                bandR.scale.set(1, 1, 1);
                bandR.position.z = 0.04;
                bandR.rotation.set(0.3, 0, -0.1);
            }
            if (hands && hands.userData.leftHand) {
                const leftHand = hands.userData.leftHand;
                leftHand.position.set(-0.05, -0.08, -0.15);
                if (leftHand.userData.fingers) {
                    leftHand.userData.fingers[0].rotation.x = 0.8;
                }
                if (leftHand.userData.thumb) {
                    leftHand.userData.thumb.rotation.x = 0.4;
                }
            }
        }
    },

    /**
     * Trigger fire animation
     */
    triggerFireAnim() {
        this.fireAnim = 1.0;
    },

    /**
     * Check if fire animation is playing
     */
    isFireAnimPlaying() {
        return this.fireAnim > 0;
    }
};
