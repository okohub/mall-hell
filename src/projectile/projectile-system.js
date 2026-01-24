// ============================================
// PROJECTILE SYSTEM - Orchestrator
// ============================================
// Manages projectile spawning, movement, and collision
// Uses Projectile data definitions (assumes Projectile is loaded globally)

const ProjectileSystem = {
    // Active projectiles
    projectiles: [],

    // Configuration
    maxProjectiles: 50,
    despawnDistance: 200,

    // References
    projectileData: null,
    scene: null,

    /**
     * Initialize the projectile system
     * @param {Object} projectileData - Reference to Projectile data object
     * @param {THREE.Scene} scene - Three.js scene for adding projectiles
     */
    init(projectileData, scene) {
        this.projectileData = projectileData || (typeof Projectile !== 'undefined' ? Projectile : null);
        this.scene = scene;
        this.reset();
    },

    /**
     * Reset all projectiles
     */
    reset() {
        // Remove all projectiles from scene
        this.projectiles.forEach(p => {
            if (p.mesh && this.scene) {
                this.scene.remove(p.mesh);
            }
        });
        this.projectiles = [];
    },

    /**
     * Spawn a new projectile
     * @param {string} typeId - Projectile type ID
     * @param {Object} position - Spawn position {x, y, z}
     * @param {Object} direction - Direction vector {x, y, z}
     * @param {number} speed - Projectile speed
     * @param {number} damage - Damage amount
     * @param {number} power - Fire power (affects visuals)
     * @param {THREE} THREE - Three.js library
     * @returns {Object} Spawned projectile data
     */
    spawn(typeId, position, direction, speed, damage, power, THREE) {
        if (this.projectiles.length >= this.maxProjectiles) {
            // Remove oldest projectile
            this.despawn(this.projectiles[0]);
        }

        const config = this.projectileData ? this.projectileData.get(typeId) : null;
        if (!config) return null;

        // Create visual
        let mesh = null;
        if (THREE && typeof ProjectileVisual !== 'undefined') {
            mesh = ProjectileVisual.createProjectileGroup(THREE, config, power);
            mesh.position.set(position.x, position.y, position.z);
            if (this.scene) {
                this.scene.add(mesh);
            }
        }

        const projectile = {
            type: typeId,
            config: config,
            mesh: mesh,
            position: { x: position.x, y: position.y, z: position.z },
            direction: { x: direction.x, y: direction.y, z: direction.z },
            speed: speed,
            damage: damage,
            power: power,
            createdAt: Date.now(),
            active: true
        };

        this.projectiles.push(projectile);
        return projectile;
    },

    /**
     * Despawn a projectile
     * @param {Object} projectile - Projectile to remove
     */
    despawn(projectile) {
        if (!projectile) return;

        projectile.active = false;

        if (projectile.mesh && this.scene) {
            this.scene.remove(projectile.mesh);
        }

        const index = this.projectiles.indexOf(projectile);
        if (index > -1) {
            this.projectiles.splice(index, 1);
        }
    },

    /**
     * Update all projectiles (call each frame)
     * @param {number} dt - Delta time in seconds
     * @param {Object} cameraPosition - Camera position for despawn check
     * @returns {Array} List of projectiles that moved (for collision checking)
     */
    update(dt, cameraPosition) {
        const moved = [];

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (!p.active) continue;

            // Move projectile
            p.position.x += p.direction.x * p.speed * dt;
            p.position.y += p.direction.y * p.speed * dt;
            p.position.z += p.direction.z * p.speed * dt;

            // Apply gravity if configured
            if (p.config.gravity) {
                p.direction.y -= p.config.gravity * dt;
            }

            // Update mesh position
            if (p.mesh) {
                p.mesh.position.set(p.position.x, p.position.y, p.position.z);
            }

            // Check despawn conditions
            const distFromCamera = cameraPosition
                ? Math.abs(p.position.z - cameraPosition.z)
                : 0;

            const age = Date.now() - p.createdAt;
            const outOfBounds = Math.abs(p.position.x) > 50 ||
                               p.position.y < -5 ||
                               p.position.y > 20 ||
                               distFromCamera > this.despawnDistance;

            if (outOfBounds || age > (p.config.lifetime || 5000)) {
                this.despawn(p);
            } else {
                moved.push(p);
            }
        }

        return moved;
    },

    /**
     * Check collision between projectile and a target
     * @param {Object} projectile - Projectile to check
     * @param {THREE.Object3D} target - Target object with position
     * @param {number} radius - Collision radius
     * @returns {boolean} True if collision detected
     */
    checkCollision(projectile, target, radius) {
        if (!projectile || !projectile.active || !target) return false;

        const dx = projectile.position.x - target.position.x;
        const dy = projectile.position.y - target.position.y;
        const dz = projectile.position.z - target.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return dist < radius;
    },

    /**
     * Handle projectile hitting something
     * @param {Object} projectile - Projectile that hit
     * @param {Object} hitInfo - Info about what was hit
     */
    onHit(projectile, hitInfo) {
        if (!projectile || !projectile.active) return;

        // If not piercing, despawn
        if (!projectile.config.piercing) {
            this.despawn(projectile);
        }

        // Could trigger particle effects here
        // ProjectileVisual.createImpact(...)
    },

    /**
     * Get all active projectiles
     */
    getActive() {
        return this.projectiles.filter(p => p.active);
    },

    /**
     * Get projectile count
     */
    getCount() {
        return this.projectiles.length;
    }
};
