// ============================================
// ENEMY SYSTEM - Orchestrator
// ============================================
// Manages enemy spawning, AI, damage, and cleanup
// Uses Enemy data definitions (assumes Enemy is loaded globally)

const EnemySystem = {
    // Active enemies
    enemies: [],

    // Configuration
    maxEnemies: 10,
    spawnChance: 0.015,      // Per frame spawn chance
    spawnDistance: 150,       // Distance ahead of camera to spawn
    despawnDistance: 20,      // Distance behind camera to despawn

    // References
    enemyData: null,
    scene: null,

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

        // Create visual
        let mesh = null;
        if (THREE && typeof EnemyVisual !== 'undefined') {
            mesh = EnemyVisual.createEnemy(THREE, config);
            mesh.position.set(x, 0, z);
            if (this.scene) {
                this.scene.add(mesh);
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
        data.hitFlash = 1;

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
        if (!enemy) return;

        const { collisionCheck = null, hasLineOfSight = null } = aiOptions;

        // Support both instance data and THREE.Group meshes
        const data = enemy.userData || enemy;
        if (!data.active) return;

        const config = data.config;
        if (!config) return;

        const behavior = config.behavior;
        const position = enemy.position;
        const oldX = position.x;
        const oldZ = position.z;

        // Check line of sight to player
        const canSeePlayer = hasLineOfSight
            ? hasLineOfSight(position.x, position.z, playerPos.x, playerPos.z)
            : true; // Default to true if no LOS check provided

        // Track LOS state for smooth behavior transitions
        if (canSeePlayer) {
            data.lastSeenPlayerPos = { x: playerPos.x, z: playerPos.z };
            data.lostSightTimer = 0;
        } else {
            data.lostSightTimer = (data.lostSightTimer || 0) + dt;
        }

        // Execute behavior based on LOS
        switch (behavior) {
            case 'chase':
                if (canSeePlayer) {
                    // Can see player - chase directly
                    this._behaviorChase({ position, config }, playerPos, dt, baseSpeed);
                } else if (data.lastSeenPlayerPos && data.lostSightTimer < 2) {
                    // Lost sight recently - move to last known position
                    this._behaviorChase({ position, config }, data.lastSeenPlayerPos, dt, baseSpeed * 0.5);
                } else {
                    // No LOS for a while - wander in room
                    this._behaviorWander(enemy, data, dt, baseSpeed);
                }
                break;
            case 'patrol':
                this._behaviorPatrol({ position, config, patrolTimer: data.patrolTimer || 0 }, playerPos, dt, baseSpeed);
                data.patrolTimer = (data.patrolTimer || 0) + dt;
                break;
            case 'stationary':
                // Does nothing
                break;
            default:
                if (canSeePlayer) {
                    this._behaviorChase({ position, config }, playerPos, dt, baseSpeed);
                } else {
                    this._behaviorWander(enemy, data, dt, baseSpeed);
                }
        }

        // Random drift only when can see player (adds unpredictability to chase)
        if (canSeePlayer) {
            data.driftTimer = (data.driftTimer || 0) + dt;
            if (data.driftTimer > config.driftInterval) {
                data.driftTimer = 0;
                data.driftSpeed = (Math.random() - 0.5) * config.driftSpeed;
            }
            position.x += (data.driftSpeed || 0) * dt;
        }

        // Wall collision check - revert movement if blocked
        if (collisionCheck) {
            const collision = collisionCheck(position.x, position.z, oldX, oldZ);
            if (collision.blockedX) {
                position.x = oldX;
                data.driftSpeed = -(data.driftSpeed || 0);
                data.wanderDirX = -(data.wanderDirX || 0); // Reverse wander direction
            }
            if (collision.blockedZ) {
                position.z = oldZ;
                data.wanderDirZ = -(data.wanderDirZ || 0);
            }
        }

        // Update mesh position if this is instance data with a mesh reference
        if (enemy.mesh) {
            enemy.mesh.position.set(position.x, 0, position.z);
        }
    },

    /**
     * Chase behavior - move towards target
     */
    _behaviorChase(enemy, targetPos, dt, baseSpeed) {
        const position = enemy.position;
        const toTarget = {
            x: targetPos.x - position.x,
            z: targetPos.z - position.z
        };
        const dist = Math.sqrt(toTarget.x * toTarget.x + toTarget.z * toTarget.z);

        if (dist > 3) {
            const nx = toTarget.x / dist;
            const nz = toTarget.z / dist;
            const speed = baseSpeed * enemy.config.speed;
            position.x += nx * speed * dt;
            position.z += nz * speed * dt;
        }
    },

    /**
     * Wander behavior - random movement within room (when can't see player)
     */
    _behaviorWander(enemy, data, dt, baseSpeed) {
        const position = enemy.position;

        // Initialize or update wander direction periodically
        data.wanderTimer = (data.wanderTimer || 0) + dt;
        if (!data.wanderDirX || !data.wanderDirZ || data.wanderTimer > 2) {
            data.wanderTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            data.wanderDirX = Math.cos(angle);
            data.wanderDirZ = Math.sin(angle);
        }

        // Move slowly in wander direction
        const wanderSpeed = baseSpeed * 0.15;
        position.x += data.wanderDirX * wanderSpeed * dt;
        position.z += data.wanderDirZ * wanderSpeed * dt;
    },

    /**
     * Patrol behavior - move back and forth
     */
    _behaviorPatrol(enemy, playerPos, dt, baseSpeed) {
        const dir = Math.sin(enemy.patrolTimer) > 0 ? 1 : -1;
        enemy.position.x += dir * baseSpeed * 0.2 * dt;
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
                enemy.hitFlash -= dt * 5;
                if (enemy.hitFlash < 0) enemy.hitFlash = 0;

                if (enemy.mesh && typeof EnemyVisual !== 'undefined') {
                    EnemyVisual.applyHitFlash(enemy.mesh.userData.cart, enemy.hitFlash);
                }
            }

            // Update health bar
            if (enemy.mesh && enemy.mesh.userData.healthBar && typeof EnemyVisual !== 'undefined') {
                EnemyVisual.updateHealthBar(
                    enemy.mesh.userData.healthBar,
                    enemy.health / enemy.maxHealth
                );
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
     * @returns {Object|null} Spawned enemy or null
     */
    trySpawn(cameraPos, aisleWidth, THREE) {
        if (!this.canSpawn()) return null;
        if (Math.random() > this.spawnChance) return null;

        const x = (Math.random() - 0.5) * (aisleWidth - 4);
        const z = cameraPos.z - this.spawnDistance;

        return this.spawn('SKELETON', x, z, THREE);
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

        return {
            type: typeId,
            config: config,
            health: config.health,
            maxHealth: config.health,
            active: true,
            driftSpeed: (Math.random() - 0.5) * config.driftSpeed,
            driftTimer: 0,
            hitFlash: 0,
            walkTimer: Math.random() * Math.PI * 2
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
        // Get config from ENEMY_TYPES registry
        const config = (typeof ENEMY_TYPES !== 'undefined' && ENEMY_TYPES[typeId])
            ? ENEMY_TYPES[typeId]
            : (this.enemyData ? this.enemyData.get(typeId) : null);

        if (!config) return null;

        // Create mesh using EnemyVisual
        const group = (typeof EnemyVisual !== 'undefined')
            ? EnemyVisual.createEnemy(THREE, config)
            : new THREE.Group();

        // Set userData using createEnemyData helper
        const enemyData = this.createEnemyData(typeId);
        Object.assign(group.userData, enemyData);

        // Position the enemy
        group.position.set(x, 0, z);

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
        const pos = enemy.position;
        const enemyRadius = 1.2;

        // Enemy-Enemy collision (separation)
        allEnemies.forEach(other => {
            if (other === enemy || !other.userData.active) return;

            const dx = pos.x - other.position.x;
            const dz = pos.z - other.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = enemyRadius * 2;

            if (dist < minDist && dist > 0.01) {
                // Push apart
                const overlap = minDist - dist;
                const nx = dx / dist;
                const nz = dz / dist;
                pos.x += nx * overlap * 0.5;
                pos.z += nz * overlap * 0.5;
            }
        });

        // Enemy-Obstacle collision
        if (obstacles) {
            obstacles.forEach(obs => {
                if (!obs.userData.active || obs.userData.hit) return;

                const dx = pos.x - obs.position.x;
                const dz = pos.z - obs.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const obsRadius = (obs.userData.width || 1.5) * 0.6;
                const minDist = enemyRadius + obsRadius;

                if (dist < minDist && dist > 0.01) {
                    // Push away from obstacle
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const nz = dz / dist;
                    pos.x += nx * overlap;
                    pos.z += nz * overlap;
                }
            });
        }

        // Enemy-Shelf collision
        if (shelves) {
            shelves.forEach(shelf => {
                if (!shelf.position) return;

                // Shelves are rectangular - use AABB-ish check
                const shelfWidth = 3;
                const shelfDepth = 1.5;
                const halfW = shelfWidth / 2 + enemyRadius;
                const halfD = shelfDepth / 2 + enemyRadius;

                const dx = pos.x - shelf.position.x;
                const dz = pos.z - shelf.position.z;

                // Check if within shelf bounds
                if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
                    // Push out along shortest axis
                    const overlapX = halfW - Math.abs(dx);
                    const overlapZ = halfD - Math.abs(dz);

                    if (overlapX < overlapZ) {
                        pos.x += Math.sign(dx) * overlapX;
                    } else {
                        pos.z += Math.sign(dz) * overlapZ;
                    }
                }
            });
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
     * @param {number} options.despawnDistance - Distance to despawn (default 60)
     * @param {number} options.collisionDistance - Collision distance (default 3.5)
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
            obstacles = null,
            shelves = null,
            despawnDistance = 60,
            collisionDistance = 3.5
        } = options;

        enemies.forEach(enemy => {
            if (!enemy.userData.active) return;

            // Behavior updates with wall collision and LOS awareness
            this.updateBehavior(enemy, playerPosition, dt, baseSpeed, { collisionCheck, hasLineOfSight });

            // Environment collision (obstacles, other enemies, shelves)
            this._resolveEnvironmentCollisions(enemy, enemies, obstacles, shelves);

            // Calculate distance to player
            const dx = playerPosition.x - enemy.position.x;
            const dz = playerPosition.z - enemy.position.z;
            const distToPlayer = Math.sqrt(dx * dx + dz * dz);

            // Face player
            const lookDir = Math.atan2(dx, dz);
            enemy.rotation.y = lookDir;

            // Animate eyes (track player)
            if (typeof EnemyVisual !== 'undefined' && enemy.userData.cart) {
                EnemyVisual.animateEyes(enemy.userData.cart, playerPosition);
            }

            // Animate skeleton walking
            if (typeof EnemyVisual !== 'undefined' && enemy.userData.skeleton) {
                const walkSpeed = enemy.userData.config?.walkSpeed || 3.5;
                enemy.userData.walkTimer = (enemy.userData.walkTimer || 0) + dt * walkSpeed;
                EnemyVisual.animateSkeletonWalk(enemy.userData.cart, enemy.userData.walkTimer, walkSpeed);
            }

            // Hit flash
            if (enemy.userData.hitFlash > 0) {
                enemy.userData.hitFlash -= dt * 5;
                if (enemy.userData.hitFlash < 0) enemy.userData.hitFlash = 0;

                if (typeof EnemyVisual !== 'undefined' && enemy.userData.cart) {
                    EnemyVisual.applyHitFlash(enemy.userData.cart, enemy.userData.hitFlash);
                } else {
                    // Fallback for legacy enemies
                    enemy.children.forEach(child => {
                        if (child.material && child.material.emissive) {
                            child.material.emissiveIntensity = enemy.userData.hitFlash;
                        }
                    });
                }
            }

            // Remove if too far from player
            if (distToPlayer > despawnDistance) {
                enemy.userData.active = false;
            }

            // Player collision
            if (enemy.userData.active && !isInvulnerable && playerCart) {
                const cartDist = Math.sqrt(
                    Math.pow(enemy.position.x - playerCart.position.x, 2) +
                    Math.pow(enemy.position.z - playerCart.position.z, 2)
                );
                if (cartDist < collisionDistance && onPlayerCollision) {
                    onPlayerCollision(enemy);
                }
            }
        });
    }
};
