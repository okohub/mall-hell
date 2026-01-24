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
     */
    updateBehavior(enemy, playerPos, dt, baseSpeed) {
        if (!enemy) return;

        // Support both instance data and THREE.Group meshes
        const data = enemy.userData || enemy;
        if (!data.active) return;

        const config = data.config;
        if (!config) return;

        const behavior = config.behavior;

        // Execute behavior (pass position from mesh or instance)
        const position = enemy.position;
        switch (behavior) {
            case 'chase':
                this._behaviorChase({ position, config }, playerPos, dt, baseSpeed);
                break;
            case 'patrol':
                this._behaviorPatrol({ position, config, patrolTimer: data.patrolTimer || 0 }, playerPos, dt, baseSpeed);
                data.patrolTimer = (data.patrolTimer || 0) + dt;
                break;
            case 'stationary':
                // Does nothing
                break;
            default:
                this._behaviorChase({ position, config }, playerPos, dt, baseSpeed);
        }

        // Random drift (all enemies)
        data.driftTimer = (data.driftTimer || 0) + dt;
        if (data.driftTimer > config.driftInterval) {
            data.driftTimer = 0;
            data.driftSpeed = (Math.random() - 0.5) * config.driftSpeed;
        }
        position.x += (data.driftSpeed || 0) * dt;

        // Update mesh position if this is instance data with a mesh reference
        if (enemy.mesh) {
            enemy.mesh.position.set(position.x, 0, position.z);
        }
    },

    /**
     * Chase behavior - move towards player
     */
    _behaviorChase(enemy, playerPos, dt, baseSpeed) {
        const position = enemy.position;
        const toPlayer = {
            x: playerPos.x - position.x,
            z: playerPos.z - position.z
        };
        const dist = Math.sqrt(toPlayer.x * toPlayer.x + toPlayer.z * toPlayer.z);

        if (dist > 3) {
            const nx = toPlayer.x / dist;
            const nz = toPlayer.z / dist;
            const speed = baseSpeed * enemy.config.speed;
            position.x += nx * speed * dt;
            position.z += nz * speed * dt;
        }
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
     * Update all enemies in an array (for external enemy arrays)
     * @param {Array} enemies - Array of enemy meshes
     * @param {Object} options - Update options
     * @param {Object} options.playerPosition - Player position {x, z}
     * @param {Object} options.playerCart - Player cart mesh (for collision)
     * @param {number} options.dt - Delta time
     * @param {number} options.baseSpeed - Base movement speed
     * @param {boolean} options.isInvulnerable - Whether player is invulnerable
     * @param {Function} options.onPlayerCollision - Callback when enemy hits player (damage)
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
            despawnDistance = 60,
            collisionDistance = 3.5
        } = options;

        enemies.forEach(enemy => {
            if (!enemy.userData.active) return;

            // Behavior updates (movement + drift)
            this.updateBehavior(enemy, playerPosition, dt, baseSpeed);

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
