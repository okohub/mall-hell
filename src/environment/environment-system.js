// ============================================
// ENVIRONMENT SYSTEM - Orchestrator
// ============================================
// Manages obstacle and shelf spawning, collision, cleanup
// Uses Obstacle and Shelf data (assumes they are loaded globally)

const EnvironmentSystem = {
    // Active objects
    obstacles: [],
    shelves: [],

    // Configuration
    maxObstacles: 15,
    obstacleSpawnChance: 0.02,
    obstacleSpawnDistance: 150,
    obstacleDespawnDistance: 30,

    // References
    obstacleData: null,
    shelfData: null,
    scene: null,

    /**
     * Initialize the environment system
     * @param {Object} obstacleData - Reference to Obstacle data
     * @param {Object} shelfData - Reference to Shelf data
     * @param {THREE.Scene} scene - Three.js scene
     */
    init(obstacleData, shelfData, scene) {
        this.obstacleData = obstacleData || (typeof Obstacle !== 'undefined' ? Obstacle : null);
        this.shelfData = shelfData || (typeof Shelf !== 'undefined' ? Shelf : null);
        this.scene = scene;
        this.reset();
    },

    /**
     * Reset all environment objects
     */
    reset() {
        // Remove obstacles
        this.obstacles.forEach(o => {
            if (o.mesh && this.scene) {
                this.scene.remove(o.mesh);
            }
        });
        this.obstacles = [];

        // Remove shelves
        this.shelves.forEach(s => {
            if (s.mesh && this.scene) {
                this.scene.remove(s.mesh);
            }
        });
        this.shelves = [];
    },

    // ==========================================
    // OBSTACLE METHODS
    // ==========================================

    /**
     * Spawn an obstacle
     * @param {string} typeId - Obstacle type ID
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {THREE} THREE - Three.js library
     * @param {Array} themeColors - Theme colors for visuals
     * @returns {Object} Spawned obstacle data
     */
    spawnObstacle(typeId, x, z, THREE, themeColors = null) {
        if (this.obstacles.length >= this.maxObstacles) return null;

        const config = this.obstacleData ? this.obstacleData.get(typeId) : null;
        if (!config) return null;

        const instance = this.obstacleData.createInstance(typeId, { x, y: 0, z });
        if (!instance) return null;

        // Create visual
        let mesh = null;
        if (THREE && typeof ObstacleVisual !== 'undefined') {
            mesh = ObstacleVisual.createMesh(THREE, config, themeColors);
            mesh.position.set(x, 0, z);
            if (this.scene) {
                this.scene.add(mesh);
            }
        }

        const obstacle = {
            ...instance,
            mesh: mesh
        };

        this.obstacles.push(obstacle);
        return obstacle;
    },

    /**
     * Despawn an obstacle
     * @param {Object} obstacle - Obstacle to remove
     */
    despawnObstacle(obstacle) {
        if (!obstacle) return;

        obstacle.active = false;

        if (obstacle.mesh && this.scene) {
            this.scene.remove(obstacle.mesh);
        }

        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
        }
    },

    /**
     * Hit an obstacle
     * @param {Object} obstacle - Obstacle that was hit
     * @returns {Object} Hit result with score
     */
    hitObstacle(obstacle) {
        if (!obstacle || !obstacle.active) return null;

        obstacle.health--;
        obstacle.falling = true;

        const destroyed = obstacle.health <= 0;

        return {
            hit: true,
            destroyed: destroyed,
            score: obstacle.config.scoreHit,
            obstacle: obstacle
        };
    },

    /**
     * Update all obstacles
     * @param {Object} cameraPos - Camera position
     * @param {number} dt - Delta time
     */
    updateObstacles(cameraPos, dt) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];

            // Update falling animation
            if (obs.falling) {
                obs.fallProgress += dt * obs.config.fallSpeed;

                if (obs.mesh && typeof ObstacleVisual !== 'undefined') {
                    ObstacleVisual.animateFall(obs.mesh, obs.fallProgress);
                }

                // Remove when fully fallen
                if (obs.fallProgress >= 1) {
                    this.despawnObstacle(obs);
                    continue;
                }
            }

            // Despawn if behind camera
            if (cameraPos && obs.position.z > cameraPos.z + this.obstacleDespawnDistance) {
                this.despawnObstacle(obs);
            }
        }
    },

    /**
     * Try to spawn obstacle (random chance)
     * @param {Object} cameraPos - Camera position
     * @param {number} aisleWidth - Aisle width for bounds
     * @param {THREE} THREE - Three.js library
     * @param {Array} themeColors - Theme colors
     * @returns {Object|null} Spawned obstacle or null
     */
    trySpawnObstacle(cameraPos, aisleWidth, THREE, themeColors) {
        if (this.obstacles.length >= this.maxObstacles) return null;
        if (Math.random() > this.obstacleSpawnChance) return null;

        const typeId = this.obstacleData ? this.obstacleData.getRandomType() : 'STACK';
        const x = (Math.random() - 0.5) * (aisleWidth - 4);
        const z = cameraPos.z - this.obstacleSpawnDistance;

        return this.spawnObstacle(typeId, x, z, THREE, themeColors);
    },

    // ==========================================
    // SHELF METHODS
    // ==========================================

    /**
     * Create a shelf unit
     * @param {string} templateId - Shelf template ID
     * @param {Object} position - Position {x, y, z}
     * @param {number} rotation - Y rotation
     * @param {THREE} THREE - Three.js library
     * @param {Array} productColors - Theme colors for products
     * @returns {Object} Shelf data
     */
    createShelf(templateId, position, rotation, THREE, productColors) {
        const template = this.shelfData ? this.shelfData.getTemplate(templateId) : null;
        if (!template) return null;

        let mesh = null;
        if (THREE && typeof ShelfVisual !== 'undefined') {
            mesh = ShelfVisual.createShelf(THREE, template, productColors);
            mesh.position.set(position.x, position.y || 0, position.z);
            mesh.rotation.y = rotation || 0;
            if (this.scene) {
                this.scene.add(mesh);
            }
        }

        const shelf = {
            template: templateId,
            position: { ...position },
            rotation: rotation,
            mesh: mesh
        };

        this.shelves.push(shelf);
        return shelf;
    },

    /**
     * Create shelves along a wall
     * @param {number} wallX - X position of wall
     * @param {number} startZ - Starting Z position
     * @param {number} endZ - Ending Z position
     * @param {number} spacing - Spacing between shelves
     * @param {number} rotation - Y rotation
     * @param {THREE} THREE - Three.js library
     * @param {Array} productColors - Theme colors
     */
    createWallShelves(wallX, startZ, endZ, spacing, rotation, THREE, productColors) {
        const templates = ['WALL_STANDARD', 'WALL_TALL'];

        for (let z = startZ; z > endZ; z -= spacing) {
            const templateId = templates[Math.floor(Math.random() * templates.length)];
            this.createShelf(templateId, { x: wallX, y: 0, z: z }, rotation, THREE, productColors);
        }
    },

    /**
     * Create center displays
     * @param {number} startZ - Starting Z position
     * @param {number} endZ - Ending Z position
     * @param {number} spacing - Spacing between displays
     * @param {THREE} THREE - Three.js library
     * @param {Array} productColors - Theme colors
     */
    createCenterDisplays(startZ, endZ, spacing, THREE, productColors) {
        for (let z = startZ; z > endZ; z -= spacing) {
            if (Math.random() > 0.3) { // 70% chance
                this.createShelf('FLOOR_ISLAND', { x: 0, y: 0, z: z }, 0, THREE, productColors);
            }
        }
    },

    // ==========================================
    // GENERAL METHODS
    // ==========================================

    /**
     * Update all environment objects
     * @param {Object} cameraPos - Camera position
     * @param {number} dt - Delta time
     */
    update(cameraPos, dt) {
        this.updateObstacles(cameraPos, dt);
    },

    /**
     * Get all active obstacles
     */
    getActiveObstacles() {
        return this.obstacles.filter(o => o.active && !o.falling);
    },

    /**
     * Get obstacle count
     */
    getObstacleCount() {
        return this.obstacles.length;
    },

    /**
     * Get shelf count
     */
    getShelfCount() {
        return this.shelves.length;
    }
};
