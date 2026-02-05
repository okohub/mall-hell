// ============================================
// ENEMY SYSTEM - Orchestrator
// ============================================
// Manages enemy spawning, AI, damage, and cleanup
// Uses Enemy data definitions (assumes Enemy is loaded globally)

const EnemyOrchestrator = {
    // Active enemies
    enemies: [],


    // Configuration (use Enemy.system defaults if available)
    get maxEnemies() { return (typeof Enemy !== 'undefined' && Enemy.system) ? Enemy.system.MAX_ENEMIES : 10; },
    get spawnChance() { return (typeof Enemy !== 'undefined' && Enemy.system) ? Enemy.system.SPAWN_CHANCE : 0.015; },
    get spawnDistance() { return (typeof Enemy !== 'undefined' && Enemy.system) ? Enemy.system.SPAWN_DISTANCE : 150; },
    get despawnDistance() { return (typeof Enemy !== 'undefined' && Enemy.system) ? Enemy.system.DESPAWN_DISTANCE : 60; },
    get collisionDistance() { return (typeof Enemy !== 'undefined' && Enemy.system) ? Enemy.system.COLLISION_DISTANCE : 3.5; },

    // Behavior defaults (use Enemy.behaviorDefaults if available)
    get chaseMinDistance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.CHASE_MIN_DISTANCE : 3; },
    get lostSightTimeout() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.LOST_SIGHT_TIMEOUT : 2; },
    get lostSightSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.LOST_SIGHT_SPEED : 0.5; },
    get wanderInterval() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.WANDER_INTERVAL : 2; },
    get wanderSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.WANDER_SPEED : 0.15; },
    get patrolSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.PATROL_SPEED : 0.2; },
    get homeReturnSpeed() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.HOME_RETURN_SPEED : 0.25; },
    get homeRadius() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.HOME_RADIUS : 8; },
    get searchLastSeenChance() { return (typeof Enemy !== 'undefined' && Enemy.behaviorDefaults) ? Enemy.behaviorDefaults.SEARCH_LAST_SEEN_CHANCE : 0.4; },

    // Effect constants (use Enemy.effects if available)
    get hitFlashInitial() { return (typeof Enemy !== 'undefined' && Enemy.effects) ? Enemy.effects.HIT_FLASH_INITIAL : 1; },
    get hitFlashDecay() { return (typeof Enemy !== 'undefined' && Enemy.effects) ? Enemy.effects.HIT_FLASH_DECAY : 5; },

    // References
    enemyData: null,
    scene: null,

    getEnemyModule(typeId) {
        const registry = (typeof globalThis !== 'undefined' && globalThis.EnemyTypeRegistry)
            ? globalThis.EnemyTypeRegistry
            : {};
        return registry[typeId] || null;
    },

    /**
     * Initialize the enemy system
     * @param {Object} enemyData - Reference to Enemy data object
     * @param {THREE.Scene} scene - Three.js scene
     */
    init(enemyData, scene) {
        this.enemyData = enemyData || (typeof Enemy !== 'undefined' ? Enemy : null);
        this.scene = scene;
        this.reset();
    },

    /**
     * Reset all enemies
     */
    reset() {
        this.enemies.forEach(e => {
            if (e.mesh && this.scene) {
                this.scene.remove(e.mesh);
            }
        });
        this.enemies = [];
        // Delegate to spawner
        if (typeof EnemySpawner !== 'undefined') {
            EnemySpawner.reset();
        }
    },

    // Expose spawner config for backward compatibility
    get dinoSpawnInterval() { return (typeof EnemySpawner !== 'undefined') ? EnemySpawner.dinoSpawnInterval : 5000; },
    get _dinoSpawnCount() { return (typeof EnemySpawner !== 'undefined') ? EnemySpawner._dinoSpawnCount : 0; },
    set _dinoSpawnCount(value) { if (typeof EnemySpawner !== 'undefined') EnemySpawner._dinoSpawnCount = value; },

    /**
     * Get enemy type to spawn based on score
     * Returns 'DINOSAUR' once per 5000 point threshold, otherwise 'SKELETON'
     * @param {number} currentScore - Current player score
     * @returns {string} Enemy type ID
     */
    getSpawnType(currentScore) {
        // Delegate to spawner module
        if (typeof EnemySpawner !== 'undefined') {
            return EnemySpawner.getSpawnType(currentScore);
        }
        // Fallback
        return 'SKELETON';
    },

    /**
     * Check if a dinosaur should spawn based on score threshold
     * Returns true once per 5000 point threshold crossed
     * @param {number} currentScore - Current player score
     * @returns {boolean} True if dino should spawn
     */
    checkDinoSpawn(currentScore) {
        // Delegate to spawner module
        if (typeof EnemySpawner !== 'undefined') {
            return EnemySpawner.checkDinoSpawn(currentScore);
        }
        // Fallback
        return false;
    },

    /**
     * Spawn a new enemy
     * @param {string} typeId - Enemy type ID
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {THREE} THREE - Three.js library
     * @returns {Object} Spawned enemy data
     */
    spawn(typeId, x, z, THREE) {
        if (this.enemies.length >= this.maxEnemies) return null;

        const config = this.enemyData ? this.enemyData.get(typeId) : null;
        if (!config) return null;

        // Create instance data
        const instance = this.enemyData.createInstance(typeId, { x, y: 0, z });
        if (!instance) return null;

        // Create visual - use registry dispatch
        let mesh = null;
        if (THREE) {
            const module = this.getEnemyModule(typeId);
            if (module && typeof module.createMesh === 'function') {
                mesh = module.createMesh(THREE, config);
            }

            if (mesh) {
                mesh.position.set(x, 0, z);
                if (this.scene) {
                    this.scene.add(mesh);
                }
            }
        }

        const enemy = {
            ...instance,
            mesh: mesh
        };

        this.enemies.push(enemy);
        return enemy;
    },

    /**
     * Despawn an enemy
     * @param {Object} enemy - Enemy to remove
     */
    despawn(enemy) {
        if (!enemy) return;

        enemy.active = false;

        if (enemy.mesh && this.scene) {
            this.scene.remove(enemy.mesh);
        }

        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    },

    /**
     * Deal damage to an enemy
     * @param {Object} enemy - Enemy to damage (mesh with userData OR instance data)
     * @param {number} amount - Damage amount
     * @returns {Object} Damage result with scores
     */
    damage(enemy, amount = 1) {
        if (!enemy) return null;

        // Support both mesh (userData) and instance data objects
        const data = enemy.userData || enemy;
        if (!data.active) return null;

        data.health -= amount;
        const effects = (typeof Enemy !== 'undefined' && Enemy.effects) ? Enemy.effects : { HIT_FLASH_INITIAL: 1 };
        data.hitFlash = effects.HIT_FLASH_INITIAL;

        const destroyed = data.health <= 0;

        if (destroyed) {
            data.health = 0;
            data.active = false;
        }

        const config = data.config || {};
        return {
            hit: true,
            destroyed: destroyed,
            scoreHit: config.scoreHit || 100,
            scoreDestroy: destroyed ? (config.scoreDestroy || 300) : 0,
            totalScore: (config.scoreHit || 100) + (destroyed ? (config.scoreDestroy || 300) : 0)
        };
    },

    /**
     * Update enemy AI behavior
     * @param {Object} enemy - Enemy to update (can be instance data OR THREE.Group mesh)
     * @param {Object} playerPos - Player position
     * @param {number} dt - Delta time
     * @param {number} baseSpeed - Base movement speed
     * @param {Object} [aiOptions] - AI options {collisionCheck, hasLineOfSight}
     */
    updateBehavior(enemy, playerPos, dt, baseSpeed, aiOptions = {}) {
        // Apply slow effect if active
        let effectiveSpeed = baseSpeed;
        if (enemy.userData?.slowedUntil && Date.now() < enemy.userData.slowedUntil) {
            effectiveSpeed *= enemy.userData.slowMultiplier || 1.0;
        } else if (enemy.userData?.slowedUntil) {
            // Clean up expired slow
            delete enemy.userData.slowedUntil;
            delete enemy.userData.slowMultiplier;
        }

        // Delegate to AI module with modified speed
        if (typeof EnemyAI !== 'undefined') {
            EnemyAI.updateBehavior(enemy, playerPos, dt, effectiveSpeed, aiOptions);
        }
    },

    /**
     * Chase behavior - passthrough to AI module (for testing)
     */
    _behaviorChase(enemy, targetPos, dt, baseSpeed) {
        if (typeof EnemyAI !== 'undefined') {
            EnemyAI._behaviorChase(enemy, targetPos, dt, baseSpeed);
        }
    },

    /**
     * Wander behavior - passthrough to AI module (for testing)
     */
    _behaviorWander(enemy, data, dt, baseSpeed) {
        if (typeof EnemyAI !== 'undefined') {
            EnemyAI._behaviorWander(enemy, data, dt, baseSpeed);
        }
    },

    /**
     * Patrol behavior - passthrough to AI module (for testing)
     */
    _behaviorPatrol(enemy, playerPos, dt, baseSpeed) {
        if (typeof EnemyAI !== 'undefined') {
            EnemyAI._behaviorPatrol(enemy, playerPos, dt, baseSpeed);
        }
    },

    /**
     * Update all enemies
     * @param {Object} playerPos - Player position
     * @param {Object} cameraPos - Camera position
     * @param {number} dt - Delta time
     * @param {number} baseSpeed - Base movement speed
     */
    update(playerPos, cameraPos, dt, baseSpeed) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Update AI
            this.updateBehavior(enemy, playerPos, dt, baseSpeed);

            // Update hit flash
            if (enemy.hitFlash > 0) {
                enemy.hitFlash -= dt * this.hitFlashDecay;
                if (enemy.hitFlash < 0) enemy.hitFlash = 0;

                if (enemy.mesh) {
                    const module = this.getEnemyModule(enemy.type);
                    if (module && typeof module.applyHitFlash === 'function') {
                        module.applyHitFlash(enemy.mesh.userData.cart, enemy.hitFlash);
                    }
                }
            }

            // Update slow visual effect (blue tint)
            if (enemy.mesh && enemy.mesh.userData.cart) {
                const isSlowed = enemy.slowedUntil && Date.now() < enemy.slowedUntil;
                const cart = enemy.mesh.userData.cart;

                cart.traverse(child => {
                    if (child.material && child.material.emissive) {
                        if (isSlowed) {
                            // Apply blue tint for slow effect
                            child.material.emissive.setHex(0x3498db);
                            child.material.emissiveIntensity = 0.3;
                        } else if (enemy.hitFlash === 0) {
                            // Clear slow visual only if hit flash is also done
                            child.material.emissiveIntensity = 0;
                        }
                    }
                });
            }

            // Animate carried health heart (subtle bob + slow spin)
            if (enemy.mesh?.userData?.healthCarryMesh) {
                const heart = enemy.mesh.userData.healthCarryMesh;
                const baseY = heart.userData.baseY ?? heart.position.y;
                const phase = heart.userData.bobPhase ?? 0;
                const t = Date.now() * 0.003;
                heart.position.y = baseY + Math.sin(t + phase) * 0.05;
                heart.rotation.y += dt * 0.6;
            }

            // Update health bar
            if (enemy.mesh && enemy.mesh.userData.healthBar) {
                const module = this.getEnemyModule(enemy.type);
                if (module && typeof module.updateHealthBar === 'function') {
                    module.updateHealthBar(
                        enemy.mesh.userData.healthBar,
                        enemy.health / enemy.maxHealth
                    );
                }
            }

            // Despawn if behind camera or destroyed
            if (!enemy.active || (cameraPos && enemy.position.z > cameraPos.z + this.despawnDistance)) {
                this.despawn(enemy);
            }
        }
    },

    /**
     * Check if can spawn more enemies
     */
    canSpawn() {
        return this.enemies.length < this.maxEnemies;
    },

    /**
     * Try to spawn enemy (random chance)
     * @param {Object} cameraPos - Camera position
     * @param {number} aisleWidth - Aisle width for spawn bounds
     * @param {THREE} THREE - Three.js library
     * @param {string} [typeId='SKELETON'] - Enemy type ID (defaults to SKELETON)
     * @returns {Object|null} Spawned enemy or null
     */
    trySpawn(cameraPos, aisleWidth, THREE, typeId = 'SKELETON') {
        if (!this.canSpawn()) return null;
        if (Math.random() > this.spawnChance) return null;

        const x = (Math.random() - 0.5) * (aisleWidth - 4);
        const z = cameraPos.z - this.spawnDistance;

        return this.spawn(typeId, x, z, THREE);
    },

    /**
     * Get all active enemies
     */
    getActive() {
        return this.enemies.filter(e => e.active);
    },

    /**
     * Get enemy count
     */
    getCount() {
        return this.enemies.length;
    },

    /**
     * Create enemy data for a new enemy (helper for index.html)
     * @param {string} typeId - Enemy type ID
     * @returns {Object} Enemy data object
     */
    createEnemyData(typeId) {
        const config = this.enemyData ? this.enemyData.get(typeId) : (typeof Enemy !== 'undefined' ? Enemy.get(typeId) : null);
        if (!config) return { active: true, health: 3, maxHealth: 3, hitFlash: 0 };

        const carryChance = (typeId === 'SKELETON' || config.id === 'skeleton')
            ? (config.healthCarryChance ?? 0.2)
            : 0;

        return {
            type: typeId,
            config: config,
            health: config.health,
            maxHealth: config.health,
            active: true,
            driftSpeed: (Math.random() - 0.5) * config.driftSpeed,
            driftTimer: 0,
            hitFlash: 0,
            walkTimer: Math.random() * Math.PI * 2,
            carriesHealth: Math.random() < carryChance
        };
    },

    /**
     * Create enemy mesh group (for external array management in index.html)
     * @param {THREE} THREE - Three.js library
     * @param {string} typeId - Enemy type ID (e.g., 'SKELETON', 'CART')
     * @param {number} x - X position
     * @param {number} z - Z position
     * @returns {THREE.Group} Enemy mesh group with userData
     */
    createMesh(THREE, typeId = 'SKELETON', x = 0, z = 0) {
        // Get config from Enemy data
        const config = this.enemyData ? this.enemyData.get(typeId) : null;

        if (!config) return null;

        // Create mesh - use registry dispatch
        let group = null;
        const module = this.getEnemyModule(typeId);
        if (!module || typeof module.createMesh !== 'function') {
            throw new Error(`EnemyOrchestrator: Enemy '${typeId}' missing createMesh`);
        }

        group = module.createMesh(THREE, config);
        if (!group) {
            throw new Error(`EnemyOrchestrator: createMesh returned null for '${typeId}'`);
        }

        if (!group.userData.cart) {
            group.userData.cart = group;
        }

        // Set userData using createEnemyData helper
        const enemyData = this.createEnemyData(typeId);
        Object.assign(group.userData, enemyData);

        // Position the enemy
        group.position.set(x, 0, z);

        // Remember spawn position (home) for AI
        group.userData.spawnPosition = { x, z };

        // Attach carried health heart to skeleton cart (if applicable)
        if (group.userData.carriesHealth && group.userData.cart && typeof PickupOrchestrator !== 'undefined') {
            const healthInstance = (typeof WeaponPickup !== 'undefined')
                ? WeaponPickup.createInstance('health_heart', { x: 0, y: 0, z: 0 })
                : null;
            if (healthInstance && typeof PickupOrchestrator._createPowerUpMesh === 'function') {
                const heartMesh = PickupOrchestrator._createPowerUpMesh(healthInstance, THREE);
                if (typeof PickupOrchestrator._addGlowEffect === 'function') {
                    PickupOrchestrator._addGlowEffect(heartMesh, healthInstance, THREE);
                }
                // Make it clearly visible above the cart contents
                heartMesh.scale.set(0.7, 0.7, 0.7);
                heartMesh.position.set(0, 1.55, 0.5);
                heartMesh.rotation.x = -0.15;
                heartMesh.userData.baseY = heartMesh.position.y;
                heartMesh.userData.bobPhase = Math.random() * Math.PI * 2;
                group.userData.cart.add(heartMesh);
                group.userData.healthCarryMesh = heartMesh;
            }
        }

        return group;
    },

    /**
     * Get health percentage for an enemy
     * @param {Object} enemy - Enemy mesh with userData
     * @returns {number} Health percentage 0-1
     */
    getHealthPercent(enemy) {
        if (!enemy || !enemy.userData) return 0;
        const health = enemy.userData.health || 0;
        const maxHealth = enemy.userData.maxHealth || 1;
        return health / maxHealth;
    },

    /**
     * Check and resolve environment collisions (obstacles, other enemies)
     * @param {Object} enemy - Enemy mesh
     * @param {Array} allEnemies - All enemy meshes (for enemy-enemy collision)
     * @param {Array} obstacles - Obstacle meshes
     * @param {Array} shelves - Shelf meshes
     */
    _resolveEnvironmentCollisions(enemy, allEnemies, obstacles, shelves) {
        // Delegate to collision module
        if (typeof EnemyCollision !== 'undefined') {
            EnemyCollision.resolveEnvironment(enemy, allEnemies, obstacles, shelves);
        }
    },

    /**
     * Update visual aspects (facing, animations, hit flash)
     * @param {Object} enemy - Enemy mesh
     * @param {Object} options - Update options with playerPosition, dt
     */
    _updateVisuals(enemy, options) {
        const { playerPosition, dt } = options;

        // Calculate distance to player and face them
        const dx = playerPosition.x - enemy.position.x;
        const dz = playerPosition.z - enemy.position.z;
        const lookDir = Math.atan2(dx, dz);
        const behavior = enemy.userData.config?.behavior;
        enemy.rotation.y = behavior === 'flee' ? (lookDir + Math.PI) : lookDir;

        // Get type module for animations
        const typeId = enemy.userData.type;
        const module = this.getEnemyModule(typeId);

        // Animate eyes (track player - skeleton only)
        if (enemy.userData.skeleton && module && typeof module.animateEyes === 'function') {
            module.animateEyes(enemy.userData.cart, playerPosition);
        }

        // Animate walking
        const walkSpeed = enemy.userData.config?.walkSpeed || 3.5;
        enemy.userData.walkTimer = (enemy.userData.walkTimer || 0) + dt * walkSpeed;

        if (module && typeof module.animateWalk === 'function') {
            enemy.userData.walkTimer = module.animateWalk(enemy.userData.cart, enemy.userData.walkTimer, walkSpeed);
        }

        // Hit flash
        if (enemy.userData.hitFlash > 0) {
            enemy.userData.hitFlash -= dt * this.hitFlashDecay;
            if (enemy.userData.hitFlash < 0) enemy.userData.hitFlash = 0;

            if (enemy.userData.cart) {
                if (module && typeof module.applyHitFlash === 'function') {
                    module.applyHitFlash(enemy.userData.cart, enemy.userData.hitFlash);
                }
            } else {
                // Fallback for legacy enemies
                enemy.children.forEach(child => {
                    if (child.material && child.material.emissive) {
                        child.material.emissiveIntensity = enemy.userData.hitFlash;
                    }
                });
            }
        }
    },

    /**
     * Check player collision and trigger damage callback
     * @param {Object} enemy - Enemy mesh
     * @param {Object} playerCart - Player cart mesh
     * @param {boolean} isInvulnerable - Whether player is invulnerable
     * @param {number} collisionDistance - Collision distance threshold
     * @param {Function} onPlayerCollision - Callback when collision detected
     */
    _checkPlayerCollision(enemy, playerCart, isInvulnerable, collisionDistance, onPlayerCollision, onToyCollected) {
        if (!enemy.userData.active || !playerCart) return;

        const cartDist = Math.sqrt(
            Math.pow(enemy.position.x - playerCart.position.x, 2) +
            Math.pow(enemy.position.z - playerCart.position.z, 2)
        );

        const effectiveRadius = enemy.userData.config?.collisionRadius || collisionDistance;

        const isToy = enemy.userData.isToy || enemy.userData.config?.isToy;
        if (isToy) {
            if (cartDist < effectiveRadius && onToyCollected) {
                onToyCollected(enemy);
            }
            return;
        }

        if (!isInvulnerable && onPlayerCollision && cartDist < effectiveRadius) {
            onPlayerCollision(enemy);
        }
    },

    /**
     * Update all enemies in an array (for external enemy arrays)
     * @param {Array} enemies - Array of enemy meshes
     * @param {Object} options - Update options
     * @param {Object} options.playerPosition - Player position {x, z}
     * @param {Object} options.playerCart - Player cart mesh (for collision)
     * @param {number} options.dt - Delta time
     * @param {number} options.baseSpeed - Base movement speed
     * @param {boolean} options.isInvulnerable - Whether player is invulnerable
     * @param {Function} options.onPlayerCollision - Callback when enemy hits player (damage)
     * @param {Function} options.collisionCheck - Wall collision check function(newX, newZ, oldX, oldZ)
     * @param {Function} options.hasLineOfSight - LOS check function(fromX, fromZ, toX, toZ)
     * @param {Array} options.obstacles - Obstacle meshes for collision
     * @param {Array} options.shelves - Shelf meshes for collision
     * @param {number} options.despawnDistance - Distance to despawn (uses Enemy.system.DESPAWN_DISTANCE)
     * @param {number} options.collisionDistance - Collision distance (uses Enemy.system.COLLISION_DISTANCE)
     */
    updateAll(enemies, options) {
        const {
            playerPosition,
            playerCart,
            dt,
            baseSpeed,
            isInvulnerable = false,
            onPlayerCollision = null,
            collisionCheck = null,
            hasLineOfSight = null,
            clampToRoomBounds = null,
            obstacles = null,
            shelves = null,
            collisionDistance = this.collisionDistance,
            despawnDistance = this.despawnDistance
        } = options;

        enemies.forEach(enemy => {
            if (!enemy.userData.active) return;

            // AI behavior with wall collision and LOS awareness
            this.updateBehavior(enemy, playerPosition, dt, baseSpeed, { collisionCheck, hasLineOfSight });

            // Environment collision (obstacles, other enemies, shelves)
            // Run multiple passes to handle nested overlaps
            for (let i = 0; i < 3; i++) {
                this._resolveEnvironmentCollisions(enemy, enemies, obstacles, shelves);
            }

            // Hard clamp to room bounds (never go through walls)
            if (clampToRoomBounds) {
                clampToRoomBounds(enemy.position);
            }

            // Visual updates (facing, animations, hit flash)
            this._updateVisuals(enemy, options);

            // Player collision detection (supports toy collection)
            this._checkPlayerCollision(enemy, playerCart, isInvulnerable, collisionDistance, onPlayerCollision, options.onToyCollected || null);
        });
    }
};
