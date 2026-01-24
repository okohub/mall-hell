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
     * @param {Object} enemy - Enemy to damage
     * @param {number} amount - Damage amount
     * @returns {Object} Damage result with scores
     */
    damage(enemy, amount = 1) {
        if (!enemy || !enemy.active) return null;

        enemy.health -= amount;
        enemy.hitFlash = 1;

        const destroyed = enemy.health <= 0;

        if (destroyed) {
            enemy.health = 0;
            enemy.active = false;
        }

        return {
            hit: true,
            destroyed: destroyed,
            scoreHit: enemy.config.scoreHit,
            scoreDestroy: destroyed ? enemy.config.scoreDestroy : 0,
            totalScore: enemy.config.scoreHit + (destroyed ? enemy.config.scoreDestroy : 0)
        };
    },

    /**
     * Update enemy AI behavior
     * @param {Object} enemy - Enemy to update
     * @param {Object} playerPos - Player position
     * @param {number} dt - Delta time
     * @param {number} baseSpeed - Base movement speed
     */
    updateBehavior(enemy, playerPos, dt, baseSpeed) {
        if (!enemy || !enemy.active) return;

        const config = enemy.config;
        const behavior = config.behavior;

        // Execute behavior
        switch (behavior) {
            case 'chase':
                this._behaviorChase(enemy, playerPos, dt, baseSpeed);
                break;
            case 'patrol':
                this._behaviorPatrol(enemy, playerPos, dt, baseSpeed);
                break;
            case 'stationary':
                // Does nothing
                break;
            default:
                this._behaviorChase(enemy, playerPos, dt, baseSpeed);
        }

        // Random drift (all enemies)
        enemy.driftTimer += dt;
        if (enemy.driftTimer > config.driftInterval) {
            enemy.driftTimer = 0;
            enemy.driftSpeed = (Math.random() - 0.5) * config.driftSpeed;
        }
        enemy.position.x += enemy.driftSpeed * dt;

        // Update mesh position
        if (enemy.mesh) {
            enemy.mesh.position.set(enemy.position.x, 0, enemy.position.z);
        }
    },

    /**
     * Chase behavior - move towards player
     */
    _behaviorChase(enemy, playerPos, dt, baseSpeed) {
        const toPlayer = {
            x: playerPos.x - enemy.position.x,
            z: playerPos.z - enemy.position.z
        };
        const dist = Math.sqrt(toPlayer.x * toPlayer.x + toPlayer.z * toPlayer.z);

        if (dist > 3) {
            const nx = toPlayer.x / dist;
            const nz = toPlayer.z / dist;
            const speed = baseSpeed * enemy.config.speed;
            enemy.position.x += nx * speed * dt;
            enemy.position.z += nz * speed * dt;
        }
    },

    /**
     * Patrol behavior - move back and forth
     */
    _behaviorPatrol(enemy, playerPos, dt, baseSpeed) {
        enemy.patrolTimer = (enemy.patrolTimer || 0) + dt;
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

        return this.spawn('CART', x, z, THREE);
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
    }
};
